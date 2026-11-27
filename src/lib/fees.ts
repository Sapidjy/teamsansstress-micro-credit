// Frè manyèl (admin anrejistre yo)
export const FEE_AMOUNTS = {
  MEMBERSHIP: 250,   // kane (entegrasyon)
  LATE_MEETING: 50,  // reta nan reyinyon
  PROXY_SHARE: 50,   // voye yon moun fè aksyon pou ou
  MISSED_SHARE: 100, // aksyon pou yon jou ki pase (absans)
} as const;

export type ManualFee = keyof typeof FEE_AMOUNTS;

// Otomatik sou chak vèsman nan yon pre (nan pwochen mesaj la)
export const INSTALLMENT_FEE = 25;

export const feeLabels = {
  MEMBERSHIP: "Kane (entegrasyon)",
  LATE_MEETING: "Reta nan reyinyon",
  PROXY_SHARE: "Aksyon pa pwokirasyon",
  MISSED_SHARE: "Aksyon jou ki pase (absans)",
  INSTALLMENT: "Vèsman sou pre",
  LOAN_PENALTY: "Penalite sou enterè",
  LOAN_INTEREST: "Pati ekip la sou enterè (25%)",
} as const;