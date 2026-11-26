import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const PREFIX = "TSS-";
const fmt = (n: number) => `${PREFIX}${String(n).padStart(4, "0")}`;

async function main() {
  // Kòd ki deja egziste: jwenn pi gwo nimewo a
  const existing = await db.user.findMany({
    where: { code: { startsWith: PREFIX } },
    select: { code: true },
  });

  let max = 0;
  for (const u of existing) {
    const n = parseInt((u.code ?? "").slice(PREFIX.length), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }

  // Manm ki poko gen kòd, nan lòd dat kreyasyon
  const users = await db.user.findMany({
    where: { code: null },
    orderBy: { createdAt: "asc" },
  });

  if (users.length === 0) {
    console.log("Tout manm yo gen kòd deja.");
    return;
  }

  for (const u of users) {
    max += 1;
    await db.user.update({ where: { id: u.id }, data: { code: fmt(max) } });
    console.log(u.name, "→", fmt(max));
  }
  console.log("Fini.");
}

main().finally(() => db.$disconnect());