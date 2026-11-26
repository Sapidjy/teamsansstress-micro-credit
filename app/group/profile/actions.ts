"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

type State = { error?: string; success?: boolean } | undefined;

const pinRule = z.string().regex(/^\d{4,6}$/);

const schema = z.object({
  currentPin: pinRule,
  newPin: pinRule,
  confirmPin: z.string(),
});

// Refize PIN ki two fasil pou devine
function isWeak(pin: string) {
  if (/^(\d)\1+$/.test(pin)) return true;
  return ["1234", "12345", "123456", "4321", "54321", "654321", "0123", "012345"].includes(pin);
}

export async function changePin(_prev: State, formData: FormData): Promise<State> {
  const sessionUser = await requireUser();

  const parsed = schema.safeParse({
    currentPin: formData.get("currentPin"),
    newPin: formData.get("newPin"),
    confirmPin: formData.get("confirmPin"),
  });
  if (!parsed.success) {
    return { error: "PIN yo dwe gen 4 a 6 chif (chif sèlman)." };
  }

  const { currentPin, newPin, confirmPin } = parsed.data;

  if (newPin !== confirmPin) {
    return { error: "Nouvo PIN lan ak konfimasyon an pa menm." };
  }
  if (newPin === currentPin) {
    return { error: "Nouvo PIN lan dwe diferan de ansyen an." };
  }
  if (isWeak(newPin)) {
    return { error: "PIN sa a two fasil pou devine. Chwazi yon lòt." };
  }

  const user = await db.user.findUnique({ where: { id: sessionUser.id } });
  if (!user || !(await bcrypt.compare(currentPin, user.pinHash))) {
    return { error: "PIN aktyèl la pa kòrèk." };
  }

  await db.user.update({
    where: { id: user.id },
    data: { pinHash: await bcrypt.hash(newPin, 12) },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "PIN_CHANGED",
      details: `${user.code ?? ""} · ${user.name}`,
    },
  });

  return { success: true };
}