import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { markLateLoans } from "@/lib/late";
import {
  LOAN_TERMS,
  MAX_RENEWALS,
  RENEWAL_NEXT,
  loanStatusLabels,
  maxLoan,
  type TermDays,
} from "@/lib/loan";
import { INSTALLMENT_FEE } from "@/lib/fees";
import { loanDue } from "@/lib/loan-calc";
import { fromCents, interestCents, toCents } from "@/lib/cycle";
import { displayPhone } from "@/lib/phone";
import { approveLoan, rejectLoan } from "./actions";
import RepaymentForm from "./repayment-form";
import RenewForm from "./renew-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HandCoins } from "lucide-react";

export const instant = false;

const fmt = (n: number) => n.toLocaleString("fr-HT", { maximumFractionDigits: 2 });

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  ACTIVE: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  LATE: "bg-red-100 text-red-800",
  RENEWED: "bg-gray-100 text-gray-700",
};

const termLabel = (days: number) => LOAN_TERMS[days as TermDays]?.label ?? `${days} jou`;

export default async function AdminLoansPage() {
  await requireAdmin();
  await markLateLoans();

  const loans = await db.loan.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { include: { account: true } },
      payments: true,
      payout: true,
      renewedTo: true,
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Jesyon pre</h1>

      {loans.length === 0 && (
        <Card className="overflow-hidden border-dashed shadow-sm">
          <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="mb-5 flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HandCoins className="size-10" strokeWidth={1.5} />
            </div>

            <div className="max-w-sm space-y-2">
              <h3 className="text-lg font-semibold tracking-tight">
                Ou poko gen okenn prè
              </h3>

              <p className="text-sm leading-relaxed text-muted-foreground">
                Tout demann prè ou yo ap parèt isit la. Ou pral kapab konsilte detay yo, swiv estati demann ou yo ak kontwole ranbousman ou yo nan menm espas sa a.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {loans.map((l) => {
        const due = loanDue(l, l.payments);
        const shares = Number(l.user.account?.shares ?? 0);
        const isOpen = l.status === "ACTIVE" || l.status === "LATE";

        const nextTerm = RENEWAL_NEXT[l.termDays];
        const next = nextTerm ? LOAN_TERMS[nextTerm as TermDays] : null;
        const canRenew = isOpen && l.renewalCount < MAX_RENEWALS && l.payments.length === 0 && !!next;

        return (
          <Card key={l.id} className="shadow-sm">
            <CardContent className="space-y-3 p-4 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-semibold">
                    {l.user.code ? `${l.user.code} · ` : ""}
                    {l.user.name} · {fmt(Number(l.amount))} HTG
                  </p>
                  <p className="text-muted-foreground">
                    +509 {displayPhone(l.user.phone)} · {termLabel(l.termDays)} · {Number(l.interestRate)}% ·{" "}
                    {l.createdAt.toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={cn("rounded-full px-2 py-1 text-xs font-medium", statusColor[l.status])}>
                    {loanStatusLabels[l.status]}
                  </span>
                  {l.renewalCount > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      Renouvèlman {l.renewalCount}/{MAX_RENEWALS}
                    </Badge>
                  )}
                </div>
              </div>

              {l.reason && <p>Rezon: {l.reason}</p>}

              {/* AN ATANT */}
              {l.status === "PENDING" && (
                <div className="space-y-2 border-t pt-3">
                  <p>
                    Aksyon manm nan: <b>{fmt(shares)} HTG</b> · Maksimòm: <b>{fmt(maxLoan(shares))} HTG</b>
                  </p>
                  <p>
                    Enterè: <b>{fmt(fromCents(interestCents(l.amount, l.interestRate)))} HTG</b> · Total pou remèt:{" "}
                    <b>{fmt(fromCents(toCents(l.amount) + interestCents(l.amount, l.interestRate)))} HTG</b>
                  </p>
                  <div className="flex gap-3">
                    <form action={approveLoan}>
                      <input type="hidden" name="id" value={l.id} />
                      <Button size="sm">Apwouve</Button>
                    </form>
                    <form action={rejectLoan}>
                      <input type="hidden" name="id" value={l.id} />
                      <Button size="sm" variant="outline">Rejte</Button>
                    </form>
                  </div>
                </div>
              )}

              {/* AKTIF / AN RETA */}
              {isOpen && (
                <div className="space-y-3 border-t pt-3">
                  <div className="grid gap-1 sm:grid-cols-2">
                    <p>Kapital: <b>{fmt(fromCents(due.principal))} HTG</b></p>
                    <p>Enterè: <b>{fmt(fromCents(due.interest))} HTG</b></p>
                    <p className={due.weeks > 0 ? "font-medium text-destructive" : ""}>
                      Penalite: <b>{fmt(fromCents(due.penalty))} HTG</b>
                      {due.weeks > 0 && ` (${due.weeks} lendi an reta)`}
                    </p>
                    <p>Total: <b>{fmt(fromCents(due.total))} HTG</b></p>
                    <p>Peye: <b>{fmt(fromCents(due.paid))} HTG</b></p>
                    <p>Rete: <b>{fmt(fromCents(due.remaining))} HTG</b></p>
                  </div>
                  {l.dueDate && (
                    <p>
                      Dat limit: <b>{l.dueDate.toLocaleDateString("fr-FR")}</b>
                    </p>
                  )}

                  <RepaymentForm
                    loanId={l.id}
                    remaining={fromCents(due.remaining)}
                    hasPayments={l.payments.length > 0}
                    fee={INSTALLMENT_FEE}
                  />

                  {canRenew && next && (
                    <RenewForm
                      loanId={l.id}
                      pay={fromCents(due.interest + due.penalty)}
                      fee={INSTALLMENT_FEE}
                      nextLabel={next.label}
                      nextRate={next.rate}
                      left={MAX_RENEWALS - l.renewalCount}
                    />
                  )}
                  {isOpen && !canRenew && l.renewalCount >= MAX_RENEWALS && (
                    <p className="text-xs text-muted-foreground">
                      Pre sa a pa ka renouvle ankò (maksimòm {MAX_RENEWALS}).
                    </p>
                  )}
                  {isOpen && !canRenew && l.renewalCount < MAX_RENEWALS && l.payments.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Renouvèlman pa posib paske pre a gen deja peman.
                    </p>
                  )}
                </div>
              )}

              {/* RENOUVLE */}
              {l.status === "RENEWED" && (
                <p className="border-t pt-3 text-muted-foreground">
                  Enterè{l.payout && Number(l.payout.penalty) > 0 ? " ak penalite" : ""} peye. Pre a renouvle pou{" "}
                  {l.renewedTo ? `${termLabel(l.renewedTo.termDays)} (${Number(l.renewedTo.interestRate)}%)` : "yon nouvo dire"}.
                </p>
              )}

              {/* PEYE NÈT / DIVIZYON */}
              {(l.status === "PAID" || l.status === "RENEWED") && l.payout && (
                <p className="border-t pt-3 text-muted-foreground">
                  Enterè {fmt(Number(l.payout.interest))} HTG: manm ki prete a {fmt(Number(l.payout.borrowerShare))} ·
                  TSS-MK {fmt(Number(l.payout.teamShare))} · tout manm yo {fmt(Number(l.payout.poolShare))}
                  {Number(l.payout.penalty) > 0 && ` · penalite pou TSS-MK ${fmt(Number(l.payout.penalty))}`}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}