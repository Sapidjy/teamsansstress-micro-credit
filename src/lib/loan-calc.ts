import { addDays, mondayOf } from "./week";
import { interestCents, toCents, ZERO } from "./cycle";

function dayHT(d: Date): Date {
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Port-au-Prince",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return new Date(s + "T00:00:00Z");
}

// Konbyen lendi ki pase apre dat limit la (jiska "until")
export function lateMondays(dueDate: Date, until: Date): number {
  const end = dayHT(until);
  let m = addDays(mondayOf(dayHT(dueDate)), 7);
  let n = 0;
  while (m <= end) {
    n++;
    m = addDays(m, 7);
  }
  return n;
}

type LoanLike = { amount: unknown; interestRate: unknown; dueDate: Date | null };
type PaymentLike = { amount: unknown; paidAt: Date };

// Tout kalkil an santim (BigInt)
export function loanDue(loan: LoanLike, payments: PaymentLike[], now = new Date()) {
  const principal = toCents(loan.amount);
  const interest = interestCents(loan.amount, loan.interestRate);
  const base = principal + interest;

  const sorted = [...payments].sort((a, b) => a.paidAt.getTime() - b.paidAt.getTime());
  let paid = ZERO;
  let stopAt: Date | null = null;
  for (const p of sorted) {
    paid += toCents(p.amount);
    // penalite a kanpe lè kapital + enterè orijinal la peye
    if (stopAt === null && paid >= base) stopAt = p.paidAt;
  }

  const weeks = loan.dueDate ? lateMondays(loan.dueDate, stopAt ?? now) : 0;
  const penalty = interest * BigInt(weeks);
  const total = base + penalty;

  return {
    principal,
    interest,
    penalty,
    weeks,
    paid,
    total,
    remaining: total > paid ? total - paid : ZERO,
  };
}