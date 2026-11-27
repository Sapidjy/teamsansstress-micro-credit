import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const MONTHS = ["Jan", "Fev", "Mas", "Avr", "Me", "Jen", "Jiy", "Out", "Sep", "Okt", "Nov", "Des"];
const ordinal = (n: number) => (n === 1 ? "1e" : `${n}yèm`);

function shareNote(monday: Date) {
  const day = monday.getUTCDate();
  const nth = Math.floor((day - 1) / 7) + 1;
  const yy = String(monday.getUTCFullYear()).slice(-2);
  return `Aksyon ${ordinal(nth)} lendi - ${day} ${MONTHS[monday.getUTCMonth()]} ${yy}`;
}

async function main() {
  const rows = await db.transaction.findMany({ where: { type: "SHARE" } });
  let n = 0;
  for (const t of rows) {
    if (!t.weekOf) continue;
    await db.transaction.update({ where: { id: t.id }, data: { note: shareNote(t.weekOf) } });
    n++;
  }
  console.log(`${n} memo mete ajou.`);
}

main().finally(() => db.$disconnect());