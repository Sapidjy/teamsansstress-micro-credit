export const SHARE_AMOUNT = 500;   // HTG chak lendi (chanje l isit la)
export const SHARE_MULTIPLIER = 2; // pre maksimòm = 2 × aksyon
export const MIN_LOAN = 1000;      // HTG

export const LOAN_TERMS = {
  15: { label: "15 jou", rate: 5 },
  30: { label: "1 mwa", rate: 10 },
  60: { label: "2 mwa", rate: 15 },
} as const;

export type TermDays = keyof typeof LOAN_TERMS;

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
  LOAN_REPAYMENT: "Remboursman",
} as const;