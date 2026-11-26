import "dotenv/config";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const NAME = "Team Sans Stress";
const CODE = "TSS-MK";
const PHONE = "TEAM-TSS-MK"; // pa nimewo reyèl, se sèlman yon idantifyan inik

async function main() {
  const existing = await db.user.findUnique({ where: { code: CODE } });
  if (existing) {
    console.log("Kont ekip la deja egziste:", existing.id);
    return;
  }

  const pinHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);

  const user = await db.user.create({
    data: {
      name: NAME,
      code: CODE,
      phone: PHONE,
      pinHash,
      role: "TEAM",
      status: "INACTIVE",
      account: { create: {} },
    },
  });

  console.log("Kont ekip la kreye:", user.id, user.code);
}

main().finally(() => db.$disconnect());