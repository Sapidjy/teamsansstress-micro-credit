"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "../../../src/lib/db";
import { requireAdmin } from "../../../src/lib/auth";
import { formatCode, nextMemberCode, normalizeCode } from "@/lib/member-code";
import { normalizePhone } from "@/lib/phone";

type State = { error?: string; success?: boolean } | undefined;

const memberSchema = z.object({
  name: z.string().trim().min(2).max(80),
  pin: z.string().regex(/^\d{4,6}$/),
});

export async function createMember(_prev: State, formData: FormData): Promise<State> {
  const admin = await requireAdmin();

  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const parsed = memberSchema.safeParse({
    name: formData.get("name"),
    pin: formData.get("pin"),
  });
  if (!phone) {
    return { error: "Nimewo telefòn lan dwe gen 8 chif (egzanp: 4114 9129)." };
  }
  if (!parsed.success) {
    return { error: "Verifye non an (omwen 2 lèt) ak PIN lan (4 a 6 chif)." };
  }
  const { name, pin } = parsed.data;

  // Kòd opsyonèl: si l vid, sistèm nan jenere l
  const rawCode = String(formData.get("code") ?? "").trim();
  let manualCode: string | null = null;
  if (rawCode) {
    manualCode = normalizeCode(rawCode);
    if (!manualCode) return { error: "Kòd la dwe sanble ak TSS-0001." };
    if (await db.user.findUnique({ where: { code: manualCode } })) {
      return { error: `Kòd ${manualCode} deja egziste.` };
    }
  }

  if (await db.user.findUnique({ where: { phone } })) {
    return { error: "Nimewo telefòn sa a deja egziste." };
  }

  const pinHash = await bcrypt.hash(pin, 12);

  // Si de admin kreye yon manm an menm tan, kontrent inik la bloke youn: nou eseye ankò
  let user = null;
  for (let attempt = 0; attempt < 4 && !user; attempt++) {
    const code = manualCode ?? (await nextMemberCode());
    try {
      user = await db.user.create({
        data: { name, phone, code, pinHash, account: { create: {} } },
      });
    } catch (e) {
      if ((e as { code?: string }).code === "P2002") {
        if (manualCode) return { error: `Kòd ${manualCode} deja egziste.` };
        continue;
      }
      throw e;
    }
  }
  if (!user) return { error: "Pa t kapab kreye manm nan. Eseye ankò." };

  await db.auditLog.create({
    data: {
      actorId: admin.id,
      action: "MEMBER_CREATED",
      details: `${user.code} · ${user.name} (${user.phone})`,
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
  if (user.role === "TEAM") return;

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
  if (user.role === "TEAM") return;

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