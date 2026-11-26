"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "../../src/lib/db";
import { createSession, deleteSession } from "../../src/lib/session";
import { normalizePhone } from "@/lib/phone";

const schema = z.object({
  pin: z.string().regex(/^\d{4,6}$/),
});

export async function login(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const parsed = schema.safeParse({ pin: formData.get("pin") });
  if (!phone || !parsed.success) {
    return { error: "Nimewo telefòn oswa PIN pa valid." };
  }

  const user = await db.user.findUnique({ where: { phone } });

  if (
    !user ||
    user.role === "TEAM" ||
    user.status !== "ACTIVE" ||
    !(await bcrypt.compare(parsed.data.pin, user.pinHash))
  ) {
    return { error: "Nimewo telefòn oswa PIN pa kòrèk." };
  }

  await createSession(user.id, user.role);
  redirect(user.role === "ADMIN" ? "/admin" : "/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}