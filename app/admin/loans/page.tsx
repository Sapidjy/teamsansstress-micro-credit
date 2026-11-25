
import {
  CalendarClock,
  Calendar,
  HandCoins,
  Percent,
  Phone,
  Timer,
  Wallet,
} from "lucide-react";

import { db } from "../../../src/lib/db";
import { requireAdmin } from "../../../src/lib/auth";
import {
  LOAN_TERMS,
  loanStatusLabels,
  maxLoan,
  type TermDays,
} from "../../../src/lib/loan";
import {
  fromCents,
  interestCents,
  toCents,
  ZERO,
} from "../../../src/lib/cycle";
import { markLateLoans } from "../../../src/lib/late";

import RepaymentForm from "./repayment-form";
import { LoanActions } from "./loan-actions";
import LoanFilters from "./loan-filters";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const instant = false;

const fmt = (n: number) =>
  n.toLocaleString("fr-HT", { maximumFractionDigits: 2 });

const statusStyle: Record<string, string> = {
  PENDING: "bg-foreground/10 text-foreground",
  APPROVED: "bg-foreground/10 text-foreground",
  ACTIVE: "bg-foreground text-background",
  PAID: "border border-foreground/20 bg-background text-muted-foreground",
  LATE: "bg-primary text-primary-foreground",
  REJECTED: "bg-primary/10 text-primary",
};

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

type SearchParams = Promise<{
  q?: string;
  status?: string;
  from?: string;
  to?: string;
  limit?: string;
}>;

const validStatuses = [
  "PENDING",
  "ACTIVE",
  "LATE",
  "PAID",
  "REJECTED",
] as const;

function Info({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "tabular-nums",
          strong ? "text-base font-bold" : "text-sm font-semibold"
        )}
      >
        {value}
      </p>
    </div>
  );
}

// Verify dat yo
function validDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return undefined;
  }

  return date;
}

export default async function AdminLoansPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();
  await markLateLoans();

  const params = await searchParams;

  // Recherche
  const q = params.q?.trim() ?? "";

  // Estati
  const status = validStatuses.includes(
    params.status as (typeof validStatuses)[number]
  )
    ? (params.status as (typeof validStatuses)[number])
    : undefined;

  // Kantite prè
  const limitValue = Number(params.limit);

  const limit =
    Number.isInteger(limitValue) && limitValue >= 10 && limitValue <= 100
      ? limitValue
      : 20;

  // Dat
  const fromDate = validDate(params.from);
  const toDate = validDate(params.to);

  // Kondisyon Prisma
  const where = {
    ...(status && { status }),

    ...((fromDate || toDate) && {
      createdAt: {
        ...(fromDate && { gte: fromDate }),
        ...(toDate && {
          lt: new Date(
            toDate.getTime() + 24 * 60 * 60 * 1000
          ),
        }),
      },
    }),

    ...(q && {
      OR: [
        {
          user: {
            name: { contains: q },
          },
        },
        {
          user: {
            phone: { contains: q },
          },
        },
        {
          reason: { contains: q },
        },
      ],
    }),
  };

  // Rekipere prè yo dapre filtè yo
  const loans = await db.loan.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        include: {
          account: true,
        },
      },
      payments: true,
      payout: true,
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Jesyon pre
          </h1>
          <p className="text-sm text-muted-foreground">
            Apwouve, rejte, ak swiv remboursman yo.
          </p>
        </div>

        <Badge variant="outline" className="py-1">
          {loans.length} pre
        </Badge>
      </div>

      {/* Filtè */}
      <LoanFilters
        q={q}
        status={params.status}
        from={params.from}
        to={params.to}
        limit={limit}
      />

      {/* Lis prè yo */}
      {loans.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <HandCoins className="h-6 w-6 text-muted-foreground" />
            </div>

            <p className="text-sm font-medium">
              Pa gen prè ki koresponn
            </p>

            <p className="text-xs text-muted-foreground">
              Eseye modifye filtè ou yo oswa fè yon lòt rechèch.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loans.map((l) => {
            const interest = interestCents(l.amount, l.interestRate);
            const total = toCents(l.amount) + interest;

            const paid = l.payments.reduce(
              (s, p) => s + toCents(p.amount),
              ZERO
            );

            const remaining = total - paid;
            const shares = Number(l.user.account?.shares ?? 0);

            const termLabel =
              LOAN_TERMS[l.termDays as TermDays]?.label ??
              `${l.termDays} jou`;

            const totalN = fromCents(total);
            const paidN = fromCents(paid);

            const percent =
              totalN > 0
                ? Math.min(Math.round((paidN / totalN) * 100), 100)
                : 0;

            const isLate = l.status === "LATE";

            return (
              <Card
                key={l.id}
                className={cn(
                  "overflow-hidden shadow-sm",
                  isLate && "border-primary/50"
                )}
              >
                <CardContent className="space-y-4 p-4 sm:p-5">
                  {/* Manm + Estati */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-11 w-11 shrink-0">
                        <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                          {initialsOf(l.user.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 leading-tight">
                        <p className="truncate font-semibold">
                          {l.user.name}
                        </p>

                        <p className="text-xl font-bold tracking-tight tabular-nums">
                          {fmt(Number(l.amount))}{" "}
                          <span className="text-xs font-medium text-muted-foreground">
                            HTG
                          </span>
                        </p>
                      </div>
                    </div>

                    <Badge
                      className={cn(
                        "shrink-0 border-0",
                        statusStyle[l.status]
                      )}
                    >
                      {loanStatusLabels[l.status]}
                    </Badge>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {l.user.phone}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <Timer className="h-3.5 w-3.5" />
                      {termLabel}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5" />
                      {Number(l.interestRate)}%
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {l.createdAt.toLocaleDateString("fr-FR")}
                    </span>
                  </div>

                  {/* Rezon */}
                  {l.reason && (
                    <div className="rounded-lg bg-muted/60 p-3 text-sm">
                      <p className="mb-0.5 text-xs font-medium text-muted-foreground">
                        Rezon
                      </p>
                      <p className="break-words">{l.reason}</p>
                    </div>
                  )}

                  {/* An atant */}
                  {l.status === "PENDING" && (
                    <>
                      <Separator />

                      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <Info
                          label="Aksyon manm nan"
                          value={`${fmt(shares)} HTG`}
                        />
                        <Info
                          label="Maksimòm"
                          value={`${fmt(maxLoan(shares))} HTG`}
                        />
                        <Info
                          label="Enterè"
                          value={`${fmt(fromCents(interest))} HTG`}
                        />
                        <Info
                          label="Total pou remèt"
                          value={`${fmt(totalN)} HTG`}
                          strong
                        />
                      </div>

                      <LoanActions id={l.id} />
                    </>
                  )}

                  {/* Aktif / An reta */}
                  {(l.status === "ACTIVE" || l.status === "LATE") && (
                    <>
                      <Separator />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Remboursman
                          </span>
                          <span className="font-semibold tabular-nums">
                            {percent}%
                          </span>
                        </div>

                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              isLate ? "bg-primary" : "bg-foreground"
                            )}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <Info label="Total" value={fmt(totalN)} />
                        <Info label="Peye" value={fmt(paidN)} />
                        <Info
                          label="Rete"
                          value={fmt(fromCents(remaining))}
                          strong
                        />
                      </div>

                      {l.dueDate && (
                        <p
                          className={cn(
                            "flex items-center gap-2 text-sm",
                            isLate
                              ? "font-medium text-primary"
                              : "text-muted-foreground"
                          )}
                        >
                          <CalendarClock className="h-4 w-4" />
                          Dat limit:{" "}
                          <span className="font-semibold">
                            {l.dueDate.toLocaleDateString("fr-FR")}
                          </span>
                        </p>
                      )}

                      <div className="rounded-xl border bg-muted/30 p-3 sm:p-4">
                        <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                          <Wallet className="h-4 w-4 text-primary" />
                          Anrejistre yon remboursman
                        </p>

                        <RepaymentForm
                          loanId={l.id}
                          remaining={fromCents(remaining)}
                        />
                      </div>
                    </>
                  )}

                  {/* Peye nèt */}
                  {l.status === "PAID" && l.payout && (
                    <>
                      <Separator />

                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Distribisyon enterè (
                          {fmt(Number(l.payout.interest))} HTG)
                        </p>

                        <div className="grid grid-cols-3 gap-3">
                          <Info
                            label="Manm ki prete (50%)"
                            value={fmt(Number(l.payout.borrowerShare))}
                          />
                          <Info
                            label="Ekip la (25%)"
                            value={fmt(Number(l.payout.teamShare))}
                          />
                          <Info
                            label="Tout manm (25%)"
                            value={fmt(Number(l.payout.poolShare))}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
