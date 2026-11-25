"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "../../src/lib/db";
import { createSession, deleteSession } from "../../src/lib/session";

const schema = z.object({
  phone: z.string().min(8).max(20),
  pin: z.string().regex(/^\d{4,6}$/),
});

export async function login(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const parsed = schema.safeParse({
    phone: String(formData.get("phone") ?? "").replace(/\s/g, ""),
    pin: formData.get("pin"),
  });
  if (!parsed.success) return { error: "Nimewo telefòn oswa PIN pa valid." };

  const user = await db.user.findUnique({ where: { phone: parsed.data.phone } });

  if (
    !user ||
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