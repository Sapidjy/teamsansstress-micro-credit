"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "../../../src/lib/db";
import { requireAdmin } from "../../../src/lib/auth";

type State = { error?: string; success?: boolean } | undefined;

class AppError extends Error { }

const schema = z.object({
  userId: z.string().min(1),
  type: z.enum(["DEPOSIT", "WITHDRAWAL", "INITIAL_DEPOSIT"]),
  amount: z.string().regex(/^\d{1,12}(\.\d{1,2})?$/),
  note: z.string().trim().max(200).optional(),
});

export async function createTransaction(
  _prev: State,
  formData: FormData
): Promise<State> {
  const admin = await requireAdmin();

  const parsed = schema.safeParse({
    userId: formData.get("userId"),
    type: formData.get("type"),
    amount: String(formData.get("amount") ?? "").replace(",", "."),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success || Number(parsed.data.amount) <= 0) {
    return { error: "Verifye manm nan, tip la ak montan an (plis pase 0)." };
  }

  const { userId, type, amount, note } = parsed.data;

  try {
    await db.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { userId },
        include: { user: true },
      });
      if (!account) throw new AppError("Kont lan pa egziste.");
      const isTeam = account.user.role === "TEAM";
      if (isTeam && type !== "INITIAL_DEPOSIT") {
        throw new AppError("Kont ekip la ka resevwa sèlman depo inisyal.");
      }
      if (!isTeam && account.user.status !== "ACTIVE") {
        throw new AppError("Manm sa a inaktif.");
      }

      if (type === "DEPOSIT") {
        await tx.account.update({
          where: { id: account.id },
          data: { balance: { increment: amount } },
        });
      } else if (type === "INITIAL_DEPOSIT") {
        // Lajan bloke jiska dekesman: li pa antre nan balans lan
        await tx.account.update({
          where: { id: account.id },
          data: { initialDeposit: { increment: amount } },
        });
      } else {
        const result = await tx.account.updateMany({
          where: { id: account.id, balance: { gte: amount } },
          data: { balance: { decrement: amount } },
        });
        if (result.count === 0) {
          throw new AppError("Balans lan pa sifi pou retrè sa a.");
        }
      }

      await tx.transaction.create({
        data: {
          accountId: account.id,
          type,
          amount,
          note,
          createdById: admin.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: `${type}_RECORDED`,
          details: `${account.user.name} (${account.user.phone}): ${amount} HTG`,
        },
      });
    });
  } catch (e) {
    if (e instanceof AppError) return { error: e.message };
    console.error(e);
    return { error: "Yon erè rive. Eseye ankò." };
  }

  revalidatePath("/admin/transactions");
  revalidatePath("/admin/members");
  return { success: true };
}