"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { FEE_AMOUNTS, feeLabels } from "@/lib/fees";

type State = { error?: string; success?: boolean } | undefined;

class AppError extends Error {}

const schema = z.object({
  userId: z.string().min(1),
  kind: z.enum(["MEMBERSHIP", "LATE_MEETING", "PROXY_SHARE", "MISSED_SHARE"]),
  source: z.enum(["CASH", "BALANCE"]),
  note: z.string().trim().max(200).optional(),
});

export async function recordFee(_prev: State, formData: FormData): Promise<State> {
  const admin = await requireAdmin();

  const parsed = schema.safeParse({
    userId: formData.get("userId"),
    kind: formData.get("kind"),
    source: formData.get("source"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { error: "Verifye manm nan, tip frè a ak fason peman an." };
  }

  const { userId, kind, source, note } = parsed.data;
  const amount = FEE_AMOUNTS[kind];

  try {
    await db.$transaction(async (tx) => {
      const team = await tx.user.findFirst({
        where: { role: "TEAM" },
        include: { account: true },
      });
      if (!team?.account) throw new AppError("Kont ekip la (TSS-MK) pa egziste.");

      const member = await tx.user.findUnique({
        where: { id: userId },
        include: { account: true },
      });
      if (!member?.account) throw new AppError("Manm nan pa egziste.");
      if (member.role !== "MEMBER") throw new AppError("Frè yo aplike sèlman sou manm òdinè.");
      if (member.status !== "ACTIVE") throw new AppError("Manm sa a inaktif.");

      if (kind === "MEMBERSHIP") {
        const already = await tx.transaction.findFirst({
          where: { accountId: member.account.id, type: "FEE_PAID", feeKind: "MEMBERSHIP" },
        });
        if (already) throw new AppError("Manm sa a deja peye frè kane a.");
      }

      if (source === "BALANCE") {
        const r = await tx.account.updateMany({
          where: { id: member.account.id, balance: { gte: amount } },
          data: { balance: { decrement: amount } },
        });
        if (r.count === 0) {
          throw new AppError("Balans manm nan pa sifi. Fè yon depo dabò oswa chwazi 'Kach'.");
        }
      }

      const label = feeLabels[kind];
      const memo = note ? ` · ${note}` : "";

      // Kote manm nan
      await tx.transaction.create({
        data: {
          accountId: member.account.id,
          type: "FEE_PAID",
          feeKind: kind,
          amount,
          note: `${label} (${source === "CASH" ? "kach" : "soti nan balans"})${memo}`,
          createdById: admin.id,
        },
      });

      // Kote TSS-MK
      await tx.account.update({
        where: { id: team.account.id },
        data: { balance: { increment: amount } },
      });
      await tx.transaction.create({
        data: {
          accountId: team.account.id,
          type: "TEAM_INCOME",
          feeKind: kind,
          amount,
          note: `${label} · ${member.code ?? ""} ${member.name}${memo}`,
          createdById: admin.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: `FEE_${kind}`,
          details: `${member.code ?? ""} ${member.name}: ${amount} HTG (${source})`,
        },
      });
    });
  } catch (e) {
    if (e instanceof AppError) return { error: e.message };
    console.error(e);
    return { error: "Yon erè rive. Anyen pa chanje. Eseye ankò." };
  }

  revalidatePath("/admin/fees");
  revalidatePath("/admin/members");
  revalidatePath("/admin/transactions");
  return { success: true };
}