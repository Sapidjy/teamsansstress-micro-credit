export const ZERO = BigInt(0);

export const toCents = (v: unknown) => BigInt(Math.round(Number(v) * 100));
export const fromCents = (c: bigint) => Number(c) / 100;
export const money = (c: bigint) => (Number(c) / 100).toFixed(2);

// enterè an santim = montan × to (egzanp 20000 × 10 = 200000 santim = 2000 HTG)
export function interestCents(amount: unknown, ratePercent: unknown) {
  return BigInt(Math.round(Number(amount) * Number(ratePercent)));
}

// 50% manm ki prete a, 25% ekip la, 25% tout manm yo (rès la ale nan pati sa a)
export function splitInterest(interest: bigint) {
  const borrower = (interest * BigInt(50)) / BigInt(100);
  const team = (interest * BigInt(25)) / BigInt(100);
  const pool = interest - borrower - team;
  return { borrower, team, pool };
}

export type AccountIn = { id: string; userId: string; shares: bigint; initial: bigint };
export type PayoutIn = { userId: string; borrower: bigint; team: bigint; pool: bigint };

export function computeSettlement(accounts: AccountIn[], payouts: PayoutIn[]) {
  const teamTotal = payouts.reduce((s, p) => s + p.team, ZERO);
  const poolTotal = payouts.reduce((s, p) => s + p.pool, ZERO);
  const weightTotal = accounts.reduce((s, a) => s + a.shares + a.initial, ZERO);

  const borrowerByUser = new Map<string, bigint>();
  for (const p of payouts) {
    borrowerByUser.set(p.userId, (borrowerByUser.get(p.userId) ?? ZERO) + p.borrower);
  }

  const rows = accounts.map((a) => {
    const weight = a.shares + a.initial;
    const poolShare = weightTotal > ZERO ? (poolTotal * weight) / weightTotal : ZERO;
    const borrowerShare = borrowerByUser.get(a.userId) ?? ZERO;
    return {
      ...a,
      weight,
      poolShare,
      borrowerShare,
      total: a.shares + a.initial + borrowerShare + poolShare,
    };
  });

  const poolPaid = rows.reduce((s, r) => s + r.poolShare, ZERO);
  const remainder = poolTotal - poolPaid; // ale nan kès ekip la

  return { rows, teamTotal, poolTotal, remainder, weightTotal };
}