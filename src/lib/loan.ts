export const SHARE_MIN = 500;   // HTG pi piti pa semèn
export const SHARE_MAX = 2500;  // HTG pi gwo pa semèn
export const SHARE_MULTIPLIER = 2; // pre maksimòm = 2 × aksyon
export const MIN_LOAN = 1000;      // HTG

export const LOAN_TERMS = {
  8: { label: "8 jou", rate: 5 },
  15: { label: "15 jou", rate: 5 },
  30: { label: "1 mwa", rate: 10 },
  60: { label: "2 mwa", rate: 15 },
} as const;

export type TermDays = keyof typeof LOAN_TERMS;

// Dire manm nan ka chwazi lè l mande yon pre (8 jou sèlman pa renouvèlman)
export const REQUEST_TERMS: readonly TermDays[] = [15, 30, 60];

// Dire pre a pran lè l renouvle
export const RENEWAL_NEXT: Record<number, number> = { 60: 30, 30: 15, 15: 8, 8: 8 };
export const MAX_RENEWALS = 2;

export function maxLoan(shares: number) {
  return shares * SHARE_MULTIPLIER;
}

// Enterè fiks pou tout dire a, yon sèl peman nan dat limit la
export function calcLoan(amount: number, ratePercent: number) {
  const interest = amount * (ratePercent / 100);
  return { interest, total: amount + interest };
}

export const loanStatusLabels = {
  PENDING: "An atant",
  APPROVED: "Apwouve",
  REJECTED: "Rejte",
  ACTIVE: "Aktif",
  PAID: "Peye nèt",
  LATE: "An reta",
  RENEWED: "Renouvle",
} as const;

export const txLabels = {
  DEPOSIT: "Depo",
  WITHDRAWAL: "Retrè",
  INITIAL_DEPOSIT: "Depo inisyal",
  SHARE: "Aksyon lendi",
  SHARE_REFUND: "Remèt aksyon (dekesman)",
  INITIAL_REFUND: "Remèt depo inisyal (dekesman)",
  DIVIDEND: "Enterè (dekesman)",
  LOAN_DISBURSEMENT: "Pre resevwa",
  LOAN_REPAYMENT: "Rambousman",
  FEE_PAID: "Frè / penalite",
  TEAM_INCOME: "Revni ekip la",
} as const;