import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

// ⚠️ Chanje 3 valè sa yo anvan w kouri script la
const NAME = "Vixamar Sadeley";
const PHONE = "50941149129";
const PIN = "210802";

async function main() {
  const pinHash = await bcrypt.hash(PIN, 12);
  const user = await db.user.create({
    data: {
      name: NAME,
      phone: PHONE,
      pinHash,
      role: "ADMIN",
      account: { create: {} },
    },
  });
  console.log("Admin kreye:", user.id);
}

main().finally(() => db.$disconnect());