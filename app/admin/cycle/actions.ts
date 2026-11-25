"use server";

import { revalidatePath } from "next/cache";
import { db } from "../../../src/lib/db";
import { requireAdmin } from "../../../src/lib/auth";
import { computeSettlement, fromCents, money, ZERO } from "../../../src/lib/cycle";

class AppError extends Error {}

type Client = Pick<typeof db, "cycle" | "loan" | "loanPayout" | "account">;

export type SettlementPreview =
  | { error: string }
  | {
      cycleName: string;
      totals: {
        interest: number;
        team: number;
        pool: number;
        remainder: number;
        weight: number;
      };
      rows: {
        id: string;
        name: string;
        phone: string;
        shares: number;
        initial: number;
        borrowerShare: number;
        poolShare: number;
        total: number;
      }[];
    };

async function loadData(client: Client) {
  const cycle = await client.cycle.findFirst({ where: { status: "OPEN" } });
  if (!cycle) throw new AppError("Pa gen okenn sik ouvri.");

  const blocking = await client.loan.count({
    where: { cycleId: cycle.id, status: { in: ["PENDING", "ACTIVE", "LATE"] } },
  });
  if (blocking > 0) {
    throw new AppError(
      `${blocking} pre poko fini (an atant, aktif oswa an reta). Rezoud yo anvan dekesman an.`
    );
  }

  const payouts = await client.loanPayout.findMany({
    where: { cycleId: cycle.id },
    include: { loan: { select: { userId: true } } },
  });
  const accounts = await client.account.findMany({ include: { user: true } });

  return { cycle, payouts, accounts };
}

function calc(data: Awaited<ReturnType<typeof loadData>>) {
  const toBig = (v: unknown) => BigInt(Math.round(Number(v) * 100));
  return computeSettlement(
    data.accounts.map((a) => ({
      id: a.id,
      userId: a.userId,
      shares: toBig(a.shares),
      initial: toBig(a.initialDeposit),
    })),
    data.payouts.map((p) => ({
      userId: p.loan.userId,
      borrower: toBig(p.borrowerShare),
      team: toBig(p.teamShare),
      pool: toBig(p.poolShare),
    }))
  );
}

export async function createCycle(formData: FormData) {
  const admin = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const start = String(formData.get("startDate") ?? "");
  if (name.length < 2 || !/^\d{4}-\d{2}-\d{2}$/.test(start)) return;
  if (await db.cycle.findFirst({ where: { status: "OPEN" } })) return;

  const startDate = new Date(start + "T00:00:00Z");
  const endDate = new Date(startDate);
  endDate.setUTCFullYear(endDate.getUTCFullYear() + 1);

  const cycle = await db.cycle.create({ data: { name, startDate, endDate } });
  await db.auditLog.create({
    data: { actorId: admin.id, action: "CYCLE_CREATED", details: `${cycle.name}` },
  });

  revalidatePath("/admin/cycle");
}

export async function previewSettlement(): Promise<SettlementPreview> {
  await requireAdmin();

  try {
    const data = await loadData(db);
    const r = calc(data);
    const byId = new Map(data.accounts.map((a) => [a.id, a.user]));

    const borrowerTotal = r.rows.reduce((s, x) => s + x.borrowerShare, ZERO);

    return {
      cycleName: data.cycle.name,
      totals: {
        interest: fromCents(borrowerTotal + r.teamTotal + r.poolTotal),
        team: fromCents(r.teamTotal),
        pool: fromCents(r.poolTotal),
        remainder: fromCents(r.remainder),
        weight: fromCents(r.weightTotal),
      },
      rows: r.rows
        .filter((x) => x.total > ZERO)
        .map((x) => ({
          id: x.id,
          name: byId.get(x.id)?.name ?? "",
          phone: byId.get(x.id)?.phone ?? "",
          shares: fromCents(x.shares),
          initial: fromCents(x.initial),
          borrowerShare: fromCents(x.borrowerShare),
          poolShare: fromCents(x.poolShare),
          total: fromCents(x.total),
        })),
    };
  } catch (e) {
    if (e instanceof AppError) return { error: e.message };
    console.error(e);
    return { error: "Yon erè rive." };
  }
}

export async function confirmSettlement(): Promise<{ error?: string; success?: boolean }> {
  const admin = await requireAdmin();

  try {
    await db.$transaction(
      async (tx) => {
        const data = await loadData(tx);

        // Fèmen sik la dabò (anpeche de konfimasyon alafwa)
        const closed = await tx.cycle.updateMany({
          where: { id: data.cycle.id, status: "OPEN" },
          data: { status: "CLOSED", closedAt: new Date() },
        });
        if (closed.count === 0) throw new AppError("Sik la deja fèmen.");

        const r = calc(data);

        for (const row of r.rows) {
          if (row.total <= ZERO) continue;

          await tx.account.update({
            where: { id: row.id },
            data: {
              balance: { increment: money(row.total) },
              shares: 0,
              initialDeposit: 0,
            },
          });

          const entries: {
            accountId: string;
            type: "SHARE_REFUND" | "INITIAL_REFUND" | "DIVIDEND";
            amount: string;
            note: string;
            createdById: string;
          }[] = [];

          if (row.shares > ZERO) {
            entries.push({ accountId: row.id, type: "SHARE_REFUND", amount: money(row.shares), note: `Dekesman ${data.cycle.name}`, createdById: admin.id });
          }
          if (row.initial > ZERO) {
            entries.push({ accountId: row.id, type: "INITIAL_REFUND", amount: money(row.initial), note: `Dekesman ${data.cycle.name}`, createdById: admin.id });
          }
          if (row.borrowerShare > ZERO) {
            entries.push({ accountId: row.id, type: "DIVIDEND", amount: money(row.borrowerShare), note: "Pati pre ou (50%)", createdById: admin.id });
          }
          if (row.poolShare > ZERO) {
            entries.push({ accountId: row.id, type: "DIVIDEND", amount: money(row.poolShare), note: "Pati manm (25%)", createdById: admin.id });
          }

          await tx.transaction.createMany({ data: entries });
        }

        await tx.cycle.update({
          where: { id: data.cycle.id },
          data: { teamFund: money(r.teamTotal + r.remainder) },
        });

        await tx.auditLog.create({
          data: {
            actorId: admin.id,
            action: "CYCLE_SETTLED",
            details: `${data.cycle.name}: ekip ${money(r.teamTotal + r.remainder)} HTG, manm yo ${money(r.poolTotal - r.remainder)} HTG`,
          },
        });
      },
      { timeout: 30000, maxWait: 10000 }
    );
  } catch (e) {
    if (e instanceof AppError) return { error: e.message };
    console.error(e);
    return { error: "Yon erè rive. Anyen pa distribye. Eseye ankò." };
  }

  revalidatePath("/admin/cycle");
  revalidatePath("/admin/members");
  revalidatePath("/admin/transactions");
  return { success: true };
}