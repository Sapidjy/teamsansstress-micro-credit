"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "../../../src/lib/db";
import { requireAdmin } from "../../../src/lib/auth";

type State = { error?: string; success?: boolean } | undefined;

const memberSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().regex(/^\d{8,15}$/),
  pin: z.string().regex(/^\d{4,6}$/),
});

export async function createMember(_prev: State, formData: FormData): Promise<State> {
  const admin = await requireAdmin();

  const parsed = memberSchema.safeParse({
    name: formData.get("name"),
    phone: String(formData.get("phone") ?? "").replace(/\s/g, ""),
    pin: formData.get("pin"),
  });
  if (!parsed.success) {
    return { error: "Verifye non an, telefòn lan (chif sèlman) ak PIN lan (4 a 6 chif)." };
  }

  const { name, phone, pin } = parsed.data;

  if (await db.user.findUnique({ where: { phone } })) {
    return { error: "Nimewo telefòn sa a deja egziste." };
  }

  const user = await db.user.create({
    data: {
      name,
      phone,
      pinHash: await bcrypt.hash(pin, 12),
      account: { create: {} },
    },
  });

  await db.auditLog.create({
    data: {
      actorId: admin.id,
      action: "MEMBER_CREATED",
      details: `${user.name} (${user.phone})`,
    },
  });

  revalidatePath("/admin/members");
  return { success: true };
}

export async function toggleStatus(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id"));
  if (id === admin.id) return; // admin pa ka dezaktive tèt li

  const user = await db.user.findUnique({ where: { id } });
  if (!user) return;

  const status = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await db.user.update({ where: { id }, data: { status } });

  await db.auditLog.create({
    data: {
      actorId: admin.id,
      action: status === "ACTIVE" ? "MEMBER_ACTIVATED" : "MEMBER_DEACTIVATED",
      details: `${user.name} (${user.phone})`,
    },
  });

  revalidatePath("/admin/members");
}

export async function resetPin(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id"));
  const pin = z.string().regex(/^\d{4,6}$/).safeParse(formData.get("pin"));
  if (!pin.success) return;

  const user = await db.user.findUnique({ where: { id } });
  if (!user) return;

  await db.user.update({
    where: { id },
    data: { pinHash: await bcrypt.hash(pin.data, 12) },
  });

  await db.auditLog.create({
    data: {
      actorId: admin.id,
      action: "PIN_RESET",
      details: `${user.name} (${user.phone})`,
    },
  });

  revalidatePath("/admin/members");
}