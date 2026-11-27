"use server";

import { LOAN_TERMS, MIN_LOAN, REQUEST_TERMS, maxLoan, type TermDays } from "@/lib/loan";

export type LoanFormState = { error?: string; success?: boolean } | undefined;

export async function requestLoan(
  _prev: LoanFormState,
  formData: FormData
): Promise<LoanFormState> {
  const amount = Number(formData.get("amount"));
  const termDays = Number(formData.get("termDays")) as TermDays;
  const reason = String(formData.get("reason") ?? "").trim();

  if (!REQUEST_TERMS.includes(termDays) || !(termDays in LOAN_TERMS)) {
    return { error: "Dire a pa valid." };
  }
  if (!Number.isFinite(amount) || amount < MIN_LOAN) {
    return { error: `Minimòm se ${MIN_LOAN} HTG.` };
  }
  if (reason.length === 0 || reason.length > 300) {
    return { error: "Rezon an obligatwa (maksimòm 300 karaktè)." };
  }

  // TODO: pran manm nan konekte a (session) epi jwenn aksyon li yo nan baz done a
  const shares = 0;
  if (amount > maxLoan(shares)) {
    return { error: "Montan an depase maksimòm ou." };
  }

  // TODO: kreye pre a nan baz done a ak estati "PENDING"
  return { success: true };
}

export type DecisionState = { error?: string } | undefined;

export async function approveLoan(
  _prev: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID pre a manke." };

  // TODO: verifye admin nan, mete estati pre a "APPROVED"/"ACTIVE", kreye tranzaksyon
  return undefined;
}

export async function rejectLoan(
  _prev: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID pre a manke." };

  // TODO: verifye admin nan, mete estati pre a "REJECTED"
  return undefined;
}


// "use server";

// import { z } from "zod";
// import { revalidatePath } from "next/cache";
// import { db } from "@/lib/db";
// import { requireAdmin } from "@/lib/auth";
// import { LOAN_TERMS, MAX_RENEWALS, RENEWAL_NEXT, maxLoan, type TermDays } from "@/lib/loan";
// import { INSTALLMENT_FEE } from "@/lib/fees";
// import { loanDue } from "@/lib/loan-calc";
// import { money, splitInterest, toCents, ZERO } from "@/lib/cycle";

// type State = { error?: string; success?: boolean } | undefined;

// class AppError extends Error {}

// const DAY = 24 * 60 * 60 * 1000;

// type Client = Pick<typeof db, "loan" | "loanPayout" | "loanPayment" | "account" | "transaction">;

// function refresh() {
//   revalidatePath("/admin");
//   revalidatePath("/admin/loans");
//   revalidatePath("/admin/members");
//   revalidatePath("/admin/transactions");
//   revalidatePath("/admin/fees");
//   revalidatePath("/admin/cycle");
//   revalidatePath("/loans");
// }

// // ---------- Èd: frè vèsman 25 HTG ----------
// async function chargeInstallmentFee(
//   tx: Client,
//   p: {
//     memberAccountId: string;
//     teamAccountId: string;
//     adminId: string;
//     label: string;
//     source: "CASH" | "BALANCE";
//   }
// ) {
//   await tx.transaction.create({
//     data: {
//       accountId: p.memberAccountId,
//       type: "FEE_PAID",
//       feeKind: "INSTALLMENT",
//       amount: INSTALLMENT_FEE,
//       note: `Vèsman sou pre (${p.source === "CASH" ? "kach" : "soti nan balans"})`,
//       createdById: p.adminId,
//     },
//   });
//   await tx.account.update({
//     where: { id: p.teamAccountId },
//     data: { balance: { increment: INSTALLMENT_FEE } },
//   });
//   await tx.transaction.create({
//     data: {
//       accountId: p.teamAccountId,
//       type: "TEAM_INCOME",
//       feeKind: "INSTALLMENT",
//       amount: INSTALLMENT_FEE,
//       note: `Vèsman sou pre · ${p.label}`,
//       createdById: p.adminId,
//     },
//   });
// }

// // ---------- Èd: divize enterè a (50/25/25) + penalite 100% ekip ----------
// async function recordPayout(
//   tx: Client,
//   p: {
//     loanId: string;
//     cycleId: string;
//     interest: bigint;
//     penalty: bigint;
//     teamAccountId: string;
//     adminId: string;
//     label: string;
//   }
// ) {
//   const split = splitInterest(p.interest);

//   await tx.loanPayout.create({
//     data: {
//       loanId: p.loanId,
//       cycleId: p.cycleId,
//       interest: money(p.interest),
//       borrowerShare: money(split.borrower),
//       teamShare: money(split.team),
//       poolShare: money(split.pool),
//       penalty: money(p.penalty),
//     },
//   });

//   const teamTotal = split.team + p.penalty;
//   if (teamTotal <= ZERO) return;

//   await tx.account.update({
//     where: { id: p.teamAccountId },
//     data: { balance: { increment: money(teamTotal) } },
//   });

//   if (split.team > ZERO) {
//     await tx.transaction.create({
//       data: {
//         accountId: p.teamAccountId,
//         type: "TEAM_INCOME",
//         feeKind: "LOAN_INTEREST",
//         amount: money(split.team),
//         note: `Pati ekip la sou enterè (25%) · ${p.label}`,
//         createdById: p.adminId,
//       },
//     });
//   }
//   if (p.penalty > ZERO) {
//     await tx.transaction.create({
//       data: {
//         accountId: p.teamAccountId,
//         type: "TEAM_INCOME",
//         feeKind: "LOAN_PENALTY",
//         amount: money(p.penalty),
//         note: `Penalite sou enterè · ${p.label}`,
//         createdById: p.adminId,
//       },
//     });
//   }
// }

// // ---------- APWOUVE ----------
// export async function approveLoan(formData: FormData) {
//   const admin = await requireAdmin();
//   const id = String(formData.get("id"));

//   try {
//     await db.$transaction(async (tx) => {
//       const loan = await tx.loan.findUnique({
//         where: { id },
//         include: { user: true, cycle: true },
//       });
//       if (!loan || loan.status !== "PENDING") throw new AppError("Pre a pa an atant.");
//       if (!loan.cycle || loan.cycle.status !== "OPEN") {
//         throw new AppError("Pre sa a pa nan yon sik ouvri.");
//       }
//       if (loan.user.status !== "ACTIVE") throw new AppError("Manm nan inaktif.");

//       const account = await tx.account.findUnique({ where: { userId: loan.userId } });
//       if (!account) throw new AppError("Kont lan pa egziste.");
//       if (Number(loan.amount) > maxLoan(Number(account.shares))) {
//         throw new AppError("Montan an depase 2 fwa aksyon manm nan.");
//       }

//       const claimed = await tx.loan.updateMany({
//         where: { id, status: "PENDING" },
//         data: {
//           status: "ACTIVE",
//           approvedAt: new Date(),
//           dueDate: new Date(Date.now() + loan.termDays * DAY),
//         },
//       });
//       if (claimed.count === 0) throw new AppError("Pre a deja trete.");

//       await tx.account.update({
//         where: { id: account.id },
//         data: { balance: { increment: loan.amount } },
//       });
//       await tx.transaction.create({
//         data: {
//           accountId: account.id,
//           type: "LOAN_DISBURSEMENT",
//           amount: loan.amount,
//           note: `Pre ${loan.termDays} jou`,
//           createdById: admin.id,
//         },
//       });
//       await tx.auditLog.create({
//         data: {
//           actorId: admin.id,
//           action: "LOAN_APPROVED",
//           details: `${loan.user.name}: ${loan.amount} HTG, ${loan.termDays} jou, ${loan.interestRate}%`,
//         },
//       });
//     });
//   } catch (e) {
//     if (!(e instanceof AppError)) console.error(e);
//   }

//   refresh();
// }

// export async function rejectLoan(formData: FormData) {
//   const admin = await requireAdmin();
//   const id = String(formData.get("id"));

//   const r = await db.loan.updateMany({
//     where: { id, status: "PENDING" },
//     data: { status: "REJECTED" },
//   });
//   if (r.count > 0) {
//     await db.auditLog.create({
//       data: { actorId: admin.id, action: "LOAN_REJECTED", details: `Pre ${id}` },
//     });
//   }
//   refresh();
// }

// // ---------- REMBOURSMAN ----------
// const repaySchema = z.object({
//   loanId: z.string().min(1),
//   amount: z.string().regex(/^\d{1,12}(\.\d{1,2})?$/),
//   source: z.enum(["BALANCE", "CASH"]),
// });

// export async function recordRepayment(_prev: State, formData: FormData): Promise<State> {
//   const admin = await requireAdmin();

//   const parsed = repaySchema.safeParse({
//     loanId: formData.get("loanId"),
//     amount: String(formData.get("amount") ?? "").replace(",", "."),
//     source: formData.get("source"),
//   });
//   if (!parsed.success || toCents(parsed.data.amount) <= ZERO) {
//     return { error: "Verifye montan an (plis pase 0, maksimòm 2 desimal)." };
//   }

//   const { loanId, amount, source } = parsed.data;
//   const amountCents = toCents(amount);

//   try {
//     await db.$transaction(async (tx) => {
//       const team = await tx.user.findFirst({
//         where: { role: "TEAM" },
//         include: { account: true },
//       });
//       if (!team?.account) throw new AppError("Kont ekip la (TSS-MK) pa egziste.");

//       const loan = await tx.loan.findUnique({
//         where: { id: loanId },
//         include: { payments: true, user: true },
//       });
//       if (!loan) throw new AppError("Pre a pa egziste.");
//       if (loan.status !== "ACTIVE" && loan.status !== "LATE") {
//         throw new AppError("Pre sa a pa ouvri pou remboursman.");
//       }
//       if (!loan.cycleId) throw new AppError("Pre sa a pa gen sik.");

//       const due = loanDue(loan, loan.payments);
//       if (amountCents > due.remaining) {
//         throw new AppError(`Montan an depase sa ki rete a (${money(due.remaining)} HTG).`);
//       }

//       const account = await tx.account.findUnique({ where: { userId: loan.userId } });
//       if (!account) throw new AppError("Kont lan pa egziste.");

//       const isFinal = amountCents === due.remaining;
//       // Pa gen frè si manm nan peye tout pre a yon sèl fwa
//       const feeCents = !isFinal || loan.payments.length > 0 ? toCents(INSTALLMENT_FEE) : ZERO;

//       if (source === "BALANCE") {
//         const debit = money(amountCents + feeCents);
//         const r = await tx.account.updateMany({
//           where: { id: account.id, balance: { gte: debit } },
//           data: { balance: { decrement: debit } },
//         });
//         if (r.count === 0) {
//           throw new AppError(
//             `Balans manm nan pa sifi (bezwen ${debit} HTG ak frè vèsman an). Fè yon depo dabò oswa chwazi 'Kach'.`
//           );
//         }
//       }

//       const label = `${loan.user.code ?? ""} ${loan.user.name}`.trim();

//       await tx.loanPayment.create({ data: { loanId: loan.id, amount } });
//       await tx.transaction.create({
//         data: {
//           accountId: account.id,
//           type: "LOAN_REPAYMENT",
//           amount,
//           note: source === "BALANCE" ? "Remboursman (soti nan balans)" : "Remboursman (kach)",
//           createdById: admin.id,
//         },
//       });

//       if (feeCents > ZERO) {
//         await chargeInstallmentFee(tx, {
//           memberAccountId: account.id,
//           teamAccountId: team.account.id,
//           adminId: admin.id,
//           label,
//           source,
//         });
//       }

//       if (isFinal) {
//         await tx.loan.update({ where: { id: loan.id }, data: { status: "PAID" } });
//         await recordPayout(tx, {
//           loanId: loan.id,
//           cycleId: loan.cycleId,
//           interest: due.interest,
//           penalty: due.penalty,
//           teamAccountId: team.account.id,
//           adminId: admin.id,
//           label,
//         });
//         await tx.auditLog.create({
//           data: {
//             actorId: admin.id,
//             action: "LOAN_PAID",
//             details: `${label}: enterè ${money(due.interest)} HTG (50/25/25), penalite ${money(due.penalty)} HTG`,
//           },
//         });
//       } else {
//         await tx.auditLog.create({
//           data: {
//             actorId: admin.id,
//             action: "LOAN_REPAYMENT",
//             details: `${label}: ${amount} HTG, rete ${money(due.remaining - amountCents)} HTG`,
//           },
//         });
//       }
//     });
//   } catch (e) {
//     if (e instanceof AppError) return { error: e.message };
//     console.error(e);
//     return { error: "Yon erè rive. Anyen pa chanje. Eseye ankò." };
//   }

//   refresh();
//   return { success: true };
// }

// // ---------- RENOUVÈLMAN ----------
// const renewSchema = z.object({
//   loanId: z.string().min(1),
//   source: z.enum(["BALANCE", "CASH"]),
// });

// export async function renewLoan(_prev: State, formData: FormData): Promise<State> {
//   const admin = await requireAdmin();

//   const parsed = renewSchema.safeParse({
//     loanId: formData.get("loanId"),
//     source: formData.get("source"),
//   });
//   if (!parsed.success) return { error: "Verifye fason peman an." };

//   const { loanId, source } = parsed.data;

//   try {
//     await db.$transaction(async (tx) => {
//       const team = await tx.user.findFirst({
//         where: { role: "TEAM" },
//         include: { account: true },
//       });
//       if (!team?.account) throw new AppError("Kont ekip la (TSS-MK) pa egziste.");

//       const loan = await tx.loan.findUnique({
//         where: { id: loanId },
//         include: { payments: true, user: true, cycle: true },
//       });
//       if (!loan) throw new AppError("Pre a pa egziste.");
//       if (loan.status !== "ACTIVE" && loan.status !== "LATE") {
//         throw new AppError("Pre sa a pa ouvri pou renouvèlman.");
//       }
//       if (!loan.cycleId || loan.cycle?.status !== "OPEN") {
//         throw new AppError("Sik la pa ouvri.");
//       }
//       if (loan.renewalCount >= MAX_RENEWALS) {
//         throw new AppError(`Pre sa a deja renouvle ${MAX_RENEWALS} fwa. Manm nan dwe ranbouse l.`);
//       }
//       if (loan.payments.length > 0) {
//         throw new AppError("Pre sa a gen deja peman. Ranbouse l nòmalman.");
//       }

//       const nextTerm = RENEWAL_NEXT[loan.termDays];
//       if (!nextTerm) throw new AppError("Pa gen dire renouvèlman pou pre sa a.");
//       const nextRate = LOAN_TERMS[nextTerm as TermDays].rate;

//       const account = await tx.account.findUnique({ where: { userId: loan.userId } });
//       if (!account) throw new AppError("Kont lan pa egziste.");

//       const due = loanDue(loan, loan.payments);
//       const payCents = due.interest + due.penalty; // enterè + penalite, kapital la rete
//       const feeCents = toCents(INSTALLMENT_FEE);

//       // Pran pre a anvan (anpeche de renouvèlman alafwa)
//       const claimed = await tx.loan.updateMany({
//         where: { id: loan.id, status: { in: ["ACTIVE", "LATE"] } },
//         data: { status: "RENEWED" },
//       });
//       if (claimed.count === 0) throw new AppError("Pre a deja trete.");

//       if (source === "BALANCE") {
//         const debit = money(payCents + feeCents);
//         const r = await tx.account.updateMany({
//           where: { id: account.id, balance: { gte: debit } },
//           data: { balance: { decrement: debit } },
//         });
//         if (r.count === 0) {
//           throw new AppError(
//             `Balans manm nan pa sifi (bezwen ${debit} HTG). Fè yon depo dabò oswa chwazi 'Kach'.`
//           );
//         }
//       }

//       const label = `${loan.user.code ?? ""} ${loan.user.name}`.trim();

//       await tx.loanPayment.create({ data: { loanId: loan.id, amount: money(payCents) } });
//       await tx.transaction.create({
//         data: {
//           accountId: account.id,
//           type: "LOAN_REPAYMENT",
//           amount: money(payCents),
//           note: `Renouvèlman: enterè sèlman${due.weeks > 0 ? ` + penalite (${due.weeks} lendi)` : ""} (${source === "CASH" ? "kach" : "soti nan balans"})`,
//           createdById: admin.id,
//         },
//       });

//       await chargeInstallmentFee(tx, {
//         memberAccountId: account.id,
//         teamAccountId: team.account.id,
//         adminId: admin.id,
//         label,
//         source,
//       });

//       await recordPayout(tx, {
//         loanId: loan.id,
//         cycleId: loan.cycleId,
//         interest: due.interest,
//         penalty: due.penalty,
//         teamAccountId: team.account.id,
//         adminId: admin.id,
//         label,
//       });

//       const next = await tx.loan.create({
//         data: {
//           userId: loan.userId,
//           amount: loan.amount,
//           termDays: nextTerm,
//           interestRate: nextRate,
//           reason: "Renouvèlman",
//           status: "ACTIVE",
//           approvedAt: new Date(),
//           dueDate: new Date(Date.now() + nextTerm * DAY),
//           cycleId: loan.cycleId,
//           renewalCount: loan.renewalCount + 1,
//           parentLoanId: loan.id,
//         },
//       });

//       await tx.auditLog.create({
//         data: {
//           actorId: admin.id,
//           action: "LOAN_RENEWED",
//           details: `${label}: ${loan.amount} HTG, ${loan.termDays}→${nextTerm} jou (${nextRate}%), renouvèlman ${next.renewalCount}/${MAX_RENEWALS}, peye ${money(payCents)} HTG`,
//         },
//       });
//     });
//   } catch (e) {
//     if (e instanceof AppError) return { error: e.message };
//     console.error(e);
//     return { error: "Yon erè rive. Anyen pa chanje. Eseye ankò." };
//   }

//   refresh();
//   return { success: true };
// }