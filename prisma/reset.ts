import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE "AuditLog", "LoanPayment", "LoanPayout", "Loan", "Transaction", "Cycle", "Account", "User" RESTART IDENTITY CASCADE;`
  );
  console.log("Done yo vide");
}

main().finally(() => db.$disconnect());