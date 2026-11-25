"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "../../../src/lib/db";
import { requireAdmin } from "../../../src/lib/auth";
import { LOAN_TERMS, maxLoan, MIN_LOAN } from "../../../src/lib/loan";
import { fromCents, interestCents, money, splitInterest, toCents, ZERO } from "../../../src/lib/cycle";
import { Prisma } from "../../../generated/prisma/client";
import { getSession } from "@/lib/session";

type State = { error?: string; success?: boolean } | undefined;

class AppError extends Error {}

const GENERIC_ERROR = "Yon erè rive. Anyen pa chanje. Eseye ankò.";

const schema = z.object({
  amount: z.string().trim().regex(/^\d{1,12}$/),
  termDays: z.coerce.number().refine((d) => d in LOAN_TERMS),
  reason: z.string().trim().min(3).max(300),
});

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/admin/loans");
  revalidatePath("/admin/members");
  revalidatePath("/admin/transactions");
  revalidatePath("/admin/cycle");
  revalidatePath("/dashboard");
  revalidatePath("/pre");
}

// Tranzaksyon Serializable ak retry si gen konfli (P2034)
// Tranzaksyon Serializable ak retry si gen konfli (P2034)
async function serializable<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(fn, { isolationLevel: "Serializable" });
    } catch (e) {
      if ((e as { code?: string })?.code === "P2034") {
        lastError = e;
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}

// APWOUVE: lajan an antre sou balans manm nan, pre a vin ACTIVE
export async function approveLoan(_prev: State, formData: FormData): Promise<State> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Pre a pa idantifye." };

  try {
    await serializable(async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { id },
        include: { user: true, cycle: true },
      });
      if (!loan || loan.status !== "PENDING") throw new AppError("Pre a pa an atant.");
      if (!loan.cycle || loan.cycle.status !== "OPEN") {
        throw new AppError("Pre sa a pa nan yon sik ouvri.");
      }
      if (loan.user.status !== "ACTIVE") throw new AppError("Manm nan inaktif.");

      const account = await tx.account.findUnique({ where: { userId: loan.userId } });
      if (!account) throw new AppError("Kont lan pa egziste.");
      if (Number(loan.amount) > maxLoan(Number(account.shares))) {
        throw new AppError("Montan an depase 2 fwa aksyon manm nan.");
      }

      const claimed = await tx.loan.updateMany({
        where: { id, status: "PENDING" },
        data: {
          status: "ACTIVE",
          approvedAt: new Date(),
          dueDate: new Date(Date.now() + loan.termDays * 24 * 60 * 60 * 1000),
        },
      });
      if (claimed.count === 0) throw new AppError("Pre a deja trete.");

      await tx.account.update({
        where: { id: account.id },
        data: { balance: { increment: loan.amount } },
      });
      await tx.transaction.create({
        data: {
          accountId: account.id,
          type: "LOAN_DISBURSEMENT",
          amount: loan.amount,
          note: `Pre ${loan.termDays} jou`,
          createdById: admin.id,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "LOAN_APPROVED",
          details: `${loan.user.name}: ${loan.amount} HTG, ${loan.termDays} jou, ${loan.interestRate}%`,
        },
      });
    });
  } catch (e) {
    if (e instanceof AppError) return { error: e.message };
    console.error(e);
    return { error: GENERIC_ERROR };
  }

  refresh();
  return { success: true };
}

export async function rejectLoan(_prev: State, formData: FormData): Promise<State> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Pre a pa idantifye." };

  try {
    await db.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id }, include: { user: true } });
      if (!loan) throw new AppError("Pre a pa egziste.");

      const r = await tx.loan.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "REJECTED" },
      });
      if (r.count === 0) throw new AppError("Pre a pa an atant.");

      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "LOAN_REJECTED",
          details: `${loan.user.name}: ${loan.amount} HTG (pre ${id})`,
        },
      });
    });
  } catch (e) {
    if (e instanceof AppError) return { error: e.message };
    console.error(e);
    return { error: GENERIC_ERROR };
  }

  refresh();
  return { success: true };
}

const repaySchema = z.object({
  loanId: z.string().min(1),
  amount: z.string().regex(/^\d{1,12}(\.\d{1,2})?$/),
  source: z.enum(["BALANCE", "CASH"]),
});

// REMBOURSMAN: si pre a peye nèt, enterè a divize 50/25/25 otomatikman
export async function recordRepayment(_prev: State, formData: FormData): Promise<State> {
  const admin = await requireAdmin();

  const parsed = repaySchema.safeParse({
    loanId: formData.get("loanId"),
    amount: String(formData.get("amount") ?? "").trim().replace(",", "."),
    source: formData.get("source"),
  });
  if (!parsed.success || toCents(parsed.data.amount) <= ZERO) {
    return { error: "Verifye montan an (plis pase 0, maksimòm 2 desimal)." };
  }

  const { loanId, amount, source } = parsed.data;
  const amountCents = toCents(amount);

  try {
    await serializable(async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { id: loanId },
        include: { payments: true, user: true },
      });
      if (!loan) throw new AppError("Pre a pa egziste.");
      if (loan.status !== "ACTIVE" && loan.status !== "LATE") {
        throw new AppError("Pre sa a pa ouvri pou remboursman.");
      }
      if (!loan.cycleId) throw new AppError("Pre sa a pa gen sik.");

      const interest = interestCents(loan.amount, loan.interestRate);
      const totalCents = toCents(loan.amount) + interest;
      const paidCents = loan.payments.reduce((s, p) => s + toCents(p.amount), ZERO);
      const remaining = totalCents - paidCents;

      if (amountCents > remaining) {
        throw new AppError(`Montan an depase sa ki rete a (${money(remaining)} HTG).`);
      }

      const account = await tx.account.findUnique({ where: { userId: loan.userId } });
      if (!account) throw new AppError("Kont lan pa egziste.");

      if (source === "BALANCE") {
        const r = await tx.account.updateMany({
          where: { id: account.id, balance: { gte: amount } },
          data: { balance: { decrement: amount } },
        });
        if (r.count === 0) {
          throw new AppError("Balans manm nan pa sifi. Fè yon depo dabò oswa chwazi 'Kach'.");
        }
      }

      await tx.loanPayment.create({ data: { loanId: loan.id, amount } });
      await tx.transaction.create({
        data: {
          accountId: account.id,
          type: "LOAN_REPAYMENT",
          amount,
          note: source === "BALANCE" ? "Remboursman (soti nan balans)" : "Remboursman (kach)",
          createdById: admin.id,
        },
      });

      if (amountCents === remaining) {
        const split = splitInterest(interest);
        await tx.loan.update({ where: { id: loan.id }, data: { status: "PAID" } });
        await tx.loanPayout.create({
          data: {
            loanId: loan.id,
            cycleId: loan.cycleId,
            interest: money(interest),
            borrowerShare: money(split.borrower),
            teamShare: money(split.team),
            poolShare: money(split.pool),
          },
        });
        await tx.auditLog.create({
          data: {
            actorId: admin.id,
            action: "LOAN_PAID",
            details: `${loan.user.name}: enterè ${money(interest)} HTG (50/25/25)`,
          },
        });
      } else {
        await tx.auditLog.create({
          data: {
            actorId: admin.id,
            action: "LOAN_REPAYMENT",
            details: `${loan.user.name}: ${amount} HTG, rete ${fromCents(remaining - amountCents)} HTG`,
          },
        });
      }
    });
  } catch (e) {
    if (e instanceof AppError) return { error: e.message };
    console.error(e);
    return { error: GENERIC_ERROR };
  }

  refresh();
  return { success: true };
}

export async function requestLoan(_prev: State, formData: FormData): Promise<State> {
  const session = await getSession();
  if (!session) return { error: "Ou dwe konekte." };

  const parsed = schema.safeParse({
    amount: formData.get("amount"),
    termDays: formData.get("termDays"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { error: "Verifye montan an, dire a ak rezon an." };

  const amount = Number(parsed.data.amount);
  const termDays = parsed.data.termDays;
  const rate = LOAN_TERMS[termDays as keyof typeof LOAN_TERMS].rate;

  try {
    const [user, cycle] = await Promise.all([
      db.user.findUnique({
        where: { id: session.userId },
        include: { account: true },
      }),
      db.cycle.findFirst({ where: { status: "OPEN" } }),
    ]);

    if (!user || user.status !== "ACTIVE") return { error: "Kont ou a inaktif." };
    if (!user.account) return { error: "Kont lan pa egziste." };
    if (!cycle) return { error: "Pa gen sik ouvri pou kounye a." };

    const max = maxLoan(Number(user.account.shares));
    if (amount < MIN_LOAN) return { error: `Minimòm se ${MIN_LOAN} HTG.` };
    if (amount > max) return { error: "Montan an depase 2 fwa aksyon ou." };

    const existing = await db.loan.count({
      where: { userId: user.id, status: { in: ["PENDING", "ACTIVE", "LATE"] } },
    });
    if (existing > 0) return { error: "Ou deja gen yon pre ki an kou oswa an atant." };

    await db.loan.create({
      data: {
        userId: user.id,
        cycleId: cycle.id,
        amount,
        termDays,
        interestRate: rate,
        reason: parsed.data.reason,
        status: "PENDING",
      },
    });
  } catch (e) {
    console.error(e);
    return { error: "Yon erè rive. Eseye ankò." };
  }

  revalidatePath("/pre");
  revalidatePath("/admin/loans");
  revalidatePath("/admin");
  return { success: true };
}