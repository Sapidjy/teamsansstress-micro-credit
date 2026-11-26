import { db } from "./db";

export const CODE_PREFIX = "TSS-";

export function formatCode(n: number) {
  return `${CODE_PREFIX}${String(n).padStart(4, "0")}`;
}

// Aksepte "tss-12", "TSS12", "TSS-0012" → "TSS-0012". Retounen null si fòma a move.
export function normalizeCode(input: string): string | null {
  const m = input.trim().toUpperCase().match(/^TSS-?(\d{1,6})$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 ? formatCode(n) : null;
}

// Pwochen kòd disponib = pi gwo nimewo + 1
export async function nextMemberCode() {
  const rows = await db.user.findMany({
    where: { code: { startsWith: CODE_PREFIX } },
    select: { code: true },
  });
  let max = 0;
  for (const r of rows) {
    const n = parseInt((r.code ?? "").slice(CODE_PREFIX.length), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return formatCode(max + 1);
}