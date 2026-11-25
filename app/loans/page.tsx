import {Suspense} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HandCoins,
  Wallet,
  XCircle,
} from "lucide-react";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { loanStatusLabels, maxLoan } from "@/lib/loan";
import LoanForm from "@app/admin/loans/loan-form";

const fmt = (value: number) =>
  value.toLocaleString("fr-HT", {
    maximumFractionDigits: 2,
  });

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  ACTIVE: "bg-blue-100 text-blue-800 border-blue-200",
  LATE: "bg-red-100 text-red-800 border-red-200",
  PAID: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-muted text-muted-foreground border-border",
};

const statusIcons: Record<string, React.ElementType> = {
  PENDING: Clock3,
  ACTIVE: HandCoins,
  LATE: XCircle,
  PAID: CheckCircle2,
  REJECTED: XCircle,
};

async function LoanContent() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: {
      id: session.userId,
    },
    include: {
      account: true,
      loans: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          payments: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.status !== "ACTIVE") {
    redirect("/dashboard");
  }

  const shares = Number(user.account?.shares ?? 0);
  const maxAmount = maxLoan(shares);

  const currentLoan = user.loans.find((loan) =>
    ["PENDING", "ACTIVE", "LATE"].includes(loan.status)
  );

  const canRequestLoan = !currentLoan;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6 sm:px-6 lg:py-10">
      {/* Header */}
      <div className="space-y-5">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 gap-2 text-muted-foreground"
        >
          <Link href="/">
            <ArrowLeft className="size-4" />
            Retounen
          </Link>
        </Button>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Badge variant="outline" className="gap-1.5">
              <HandCoins className="size-3.5" />
              Sèvis kredi TSS
            </Badge>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Demann prè
            </h1>

            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Fè demann prè ou an, kalkile enterè a epi swiv
              estati demann ou yo fasilman.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="size-4" />
            Kont manm: aktif
          </div>
        </div>
      </div>

      {/* Résumé */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
              <Wallet className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                Aksyon ou
              </p>
              <p className="text-xl font-bold tabular-nums">
                {fmt(shares)}{" "}
                <span className="text-xs font-medium text-muted-foreground">
                  HTG
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HandCoins className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                Maksimòm ou ka mande
              </p>
              <p className="text-xl font-bold tabular-nums text-primary">
                {fmt(maxAmount)}{" "}
                <span className="text-xs font-medium">HTG</span>
              </p>
              <p className="text-xs text-muted-foreground">
                2 fwa kantite aksyon ou
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demann aktyèl */}
      {currentLoan && (
        <Card className="border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock3 className="size-5 text-primary" />
              Ou gen yon demann oswa yon prè an kou
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Montan prè
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {fmt(Number(currentLoan.amount))} HTG
                </p>
              </div>

              <Badge
                variant="outline"
                className={statusStyles[currentLoan.status]}
              >
                {loanStatusLabels[currentLoan.status]}
              </Badge>
            </div>

            <Separator />

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4" />
              Dat demann:{" "}
              {currentLoan.createdAt.toLocaleDateString("fr-FR")}
            </div>

            {currentLoan.reason && (
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Rezon demann lan
                </p>
                <p className="text-sm">{currentLoan.reason}</p>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              {currentLoan.status === "PENDING"
                ? "Demann ou an ap tann administratè a trete li."
                : currentLoan.status === "ACTIVE"
                  ? "Prè ou a aktif. Kontakte administrasyon an pou enfòmasyon sou remboursman."
                  : "Prè ou a an reta. Tanpri kontakte administrasyon an."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Fòm demann */}
      {canRequestLoan ? (
        <LoanForm
          shares={shares}
          maxAmount={maxAmount}
        />
      ) : (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <HandCoins className="size-5 text-muted-foreground" />
            </div>

            <div className="space-y-1">
              <p className="font-semibold">
                Ou pa ka fè yon lòt demann pou kounye a
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                Ou dwe tann demann aktyèl ou a jwenn yon desizyon
                oswa prè ou a fin regle anvan ou fè yon lòt demann.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Istwa demann */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">
              Istwa prè mwen yo
            </h2>
            <p className="text-sm text-muted-foreground">
              Tout demann prè ou te fè yo.
            </p>
          </div>

          <Badge variant="outline">
            {user.loans.length} demann
          </Badge>
        </div>

        {user.loans.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <HandCoins className="size-5 text-muted-foreground" />
              </div>

              <p className="font-medium">
                Ou poko fè okenn demann prè
              </p>

              <p className="text-sm text-muted-foreground">
                Lè ou fè premye demann ou an, l ap parèt isit la.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {user.loans.map((loan) => {
              const Icon = statusIcons[loan.status] ?? Clock3;

              const interest =
                Number(loan.amount) *
                (Number(loan.interestRate) / 100);

              const total =
                Number(loan.amount) + interest;

              const paid = loan.payments.reduce(
                (sum, payment) => sum + Number(payment.amount),
                0
              );

              return (
                <Card key={loan.id} className="shadow-sm">
                  <CardContent className="space-y-4 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                          <Icon className="size-5" />
                        </div>

                        <div>
                          <p className="font-semibold tabular-nums">
                            {fmt(Number(loan.amount))} HTG
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {loan.termDays} jou
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={statusStyles[loan.status]}
                      >
                        {loanStatusLabels[loan.status]}
                      </Badge>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Enterè
                        </p>
                        <p className="font-semibold tabular-nums">
                          {fmt(interest)} HTG
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total pou remèt
                        </p>
                        <p className="font-semibold tabular-nums">
                          {fmt(total)} HTG
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Dat demann
                        </p>
                        <p className="font-medium">
                          {loan.createdAt.toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>

                    {loan.reason && (
                      <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                        {loan.reason}
                      </p>
                    )}

                    {loan.status === "ACTIVE" || loan.status === "LATE" ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Deja peye</span>
                          <span className="tabular-nums">
                            {fmt(paid)} HTG
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${Math.min(
                                100,
                                total > 0 ? (paid / total) * 100 : 0
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default function LoanPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground">Chajman...</main>}>
      <LoanContent />
    </Suspense>
  );
}