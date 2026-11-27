"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { SHARE_MAX, SHARE_MIN } from "@/lib/loan";
import { addDays, mondayOf, shareNote, todayHT } from "@/lib/week";
type State = { error?: string; success?: boolean } | undefined;

class AppError extends Error { }

const amountRule = z.coerce.number().int().min(SHARE_MIN).max(SHARE_MAX);

const schema = z.object({
  userId: z.string().min(1),
  weekOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weeks: z.coerce.number().int().min(1).max(12),
  amount: amountRule,
});

async function applyShares(
  adminId: string,
  userId: string,
  firstMonday: Date,
  weeks: number,
  amount: number
) {
  if (mondayOf(firstMonday).getTime() !== firstMonday.getTime()) {
    throw new AppError("Dat la dwe se yon lendi.");
  }
  const last = addDays(firstMonday, (weeks - 1) * 7);
  if (last > mondayOf(todayHT())) {
    throw new AppError("Ou pa ka anrejistre yon semèn nan lavni.");
  }

  await db.$transaction(async (tx) => {
    const account = await tx.account.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!account) throw new AppError("Kont lan pa egziste.");
    if (account.user.status !== "ACTIVE") throw new AppError("Manm sa a inaktif.");
    if (account.user.role === "TEAM") throw new AppError("Kont sa a pa ka fè aksyon.");

    for (let i = 0; i < weeks; i++) {
      const monday = addDays(firstMonday, i * 7);
      await tx.transaction.create({
        data: {
          accountId: account.id,
          type: "SHARE",
          amount,
          weekOf: monday,
          note: shareNote(monday),
          createdById: adminId,
        },
      });
    }

    await tx.account.update({
      where: { id: account.id },
      data: { shares: { increment: amount * weeks } },
    });

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "SHARE_RECORDED",
        details: `${account.user.code ?? ""} ${account.user.name}: ${weeks} semèn × ${amount} HTG`,
      },
    });
  });
}

function toMessage(e: unknown) {
  if (e instanceof AppError) return e.message;
  if ((e as { code?: string })?.code === "P2002") {
    return "Youn nan semèn sa yo deja peye.";
  }
  console.error(e);
  return "Yon erè rive. Eseye ankò.";
}

function refresh() {
  revalidatePath("/admin/shares");
  revalidatePath("/admin/members");
  revalidatePath("/admin/transactions");
}

const amountError = `Montan an dwe ant ${SHARE_MIN.toLocaleString("fr-HT")} ak ${SHARE_MAX.toLocaleString("fr-HT")} HTG.`;

// Fòm anlè a (montan + rattrapage / plizyè semèn)
export async function recordShares(_prev: State, formData: FormData): Promise<State> {
  const admin = await requireAdmin();

  const parsed = schema.safeParse({
    userId: formData.get("userId"),
    weekOf: formData.get("weekOf"),
    weeks: formData.get("weeks"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) {
    const amountBad = parsed.error.issues.some((i) => i.path[0] === "amount");
    return {
      error: amountBad
        ? amountError
        : "Verifye manm nan, dat la ak kantite semèn yo (1 a 12).",
    };
  }

  try {
    await applyShares(
      admin.id,
      parsed.data.userId,
      new Date(parsed.data.weekOf + "T00:00:00Z"),
      parsed.data.weeks,
      parsed.data.amount
    );
  } catch (e) {
    return { error: toMessage(e) };
  }

  refresh();
  return { success: true };
}

// Bouton rapid nan tablo a (semèn aktyèl la, ak montan manm nan)
export async function quickShare(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId"));

  const amount = amountRule.safeParse(formData.get("amount"));
  if (!amount.success) {
    console.error(amountError);
    return;
  }

  try {
    await applyShares(admin.id, userId, mondayOf(todayHT()), 1, amount.data);
  } catch (e) {
    console.error(toMessage(e));
  }

  refresh();
}