
import { db } from "../../../src/lib/db";
import { requireAdmin } from "../../../src/lib/auth";
import TransactionForm from "./transaction-form";
import { txLabels } from "../../../src/lib/loan";

import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  History,
  ReceiptText,
  Users,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { cn } from "@/lib/utils";

export const instant = false;

const fmt = (value: number) =>
  value.toLocaleString("fr-HT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const isExpense = (type: string) =>
  type === "WITHDRAWAL" || type === "LOAN_REPAYMENT";

function StatCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            {label}
          </p>

          <p className="text-xl font-bold tracking-tight tabular-nums">
            {value}
          </p>

          <p className="text-[11px] text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AdminTransactionsPage() {
  await requireAdmin();

  const [members, transactions] = await Promise.all([
    db.user.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    }),

    db.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        account: {
          include: {
            user: true,
          },
        },
      },
    }),
  ]);

  // Chèche non admin ki te fè chak tranzaksyon
  const creatorIds = [
    ...new Set(
      transactions
        .map((t) => t.createdById)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const creators = await db.user.findMany({
    where: { id: { in: creatorIds } },
    select: {
      id: true,
      name: true,
    },
  });

  const creatorName = new Map(
    creators.map((c) => [c.id, c.name])
  );

  // Statistiques sou 50 dènye tranzaksyon yo
  const totalTransactions = transactions.length;

  const totalIncome = transactions
    .filter((t) => !isExpense(t.type))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => isExpense(t.type))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalMovement = transactions.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

  const today = new Date();

  const todayTransactions = transactions.filter((t) => {
    const date = t.createdAt;

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ArrowLeftRight className="size-5" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight">
              Jesyon tranzaksyon
            </h1>
          </div>

          <p className="text-sm text-muted-foreground">
            Kontwole tout mouvman finansye ak aktivite kont manm yo.
          </p>
        </div>

        <Badge variant="outline" className="w-fit gap-1.5 py-1.5">
          <History className="size-3.5" />
          50 dènye tranzaksyon
        </Badge>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total tranzaksyon"
          value={String(totalTransactions)}
          description="Tranzaksyon ki parèt nan lis la"
          icon={ReceiptText}
        />

        <StatCard
          label="Antre"
          value={`${fmt(totalIncome)} HTG`}
          description="Lajan antre nan 50 dènye yo"
          icon={ArrowDownLeft}
        />

        <StatCard
          label="Sòti"
          value={`${fmt(totalExpense)} HTG`}
          description="Lajan soti nan 50 dènye yo"
          icon={ArrowUpRight}
        />

        <StatCard
          label="Aktivite jodi a"
          value={String(todayTransactions)}
          description="Tranzaksyon anrejistre jodi a"
          icon={CalendarDays}
        />
      </div>

      {/* Movement summary */}
      <Card className="shadow-sm">
        <CardContent className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wallet className="size-5" />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Total mouvman finansye
              </p>

              <p className="text-xl font-bold tabular-nums">
                {fmt(totalMovement)} HTG
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[300px]">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">
                Total antre
              </p>

              <p className="mt-1 font-semibold tabular-nums text-green-600">
                +{fmt(totalIncome)}
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">
                Total sòti
              </p>

              <p className="mt-1 font-semibold tabular-nums text-red-600">
                -{fmt(totalExpense)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction form */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CircleDollarSign className="size-4 text-primary" />

          <h2 className="text-sm font-semibold">
            Nouvo tranzaksyon
          </h2>
        </div>

        <TransactionForm members={members} />
      </section>

      {/* Transaction history */}
      <section className="space-y-3">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight">
              Istorik tranzaksyon
            </h2>

            <p className="text-xs text-muted-foreground">
              Lis 50 dènye operasyon finansye yo.
            </p>
          </div>

          <Badge variant="secondary" className="w-fit gap-1.5">
            <ClipboardList className="size-3.5" />
            {totalTransactions} operasyon
          </Badge>
        </div>

        <Card className="overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="min-w-[155px]">
                    Dat
                  </TableHead>

                  <TableHead className="min-w-[180px]">
                    Manm
                  </TableHead>

                  <TableHead className="min-w-[160px]">
                    Tip
                  </TableHead>

                  <TableHead className="min-w-[140px] text-right">
                    Montan
                  </TableHead>

                  <TableHead className="min-w-[180px]">
                    Nòt
                  </TableHead>

                  <TableHead className="min-w-[150px]">
                    Anrejistre pa
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ReceiptText className="size-8 text-muted-foreground" />

                        <p className="text-sm font-medium">
                          Pa gen tranzaksyon ankò
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Premye tranzaksyon yo ap parèt isit la.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((t) => {
                    const expense = isExpense(t.type);

                    const creator = t.createdById
                      ? creatorName.get(t.createdById) ?? "—"
                      : "—";

                    return (
                      <TableRow key={t.id}>
                        {/* Date */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="whitespace-nowrap text-sm font-medium">
                              {t.createdAt.toLocaleDateString("fr-FR")}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {t.createdAt.toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </TableCell>

                        {/* Member */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="size-8 shrink-0">
                              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                {initialsOf(t.account.user.name)}
                              </AvatarFallback>
                            </Avatar>

                            <span className="max-w-[140px] truncate text-sm font-medium">
                              {t.account.user.name}
                            </span>
                          </div>
                        </TableCell>

                        {/* Type */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="whitespace-nowrap"
                          >
                            {txLabels[t.type]}
                          </Badge>
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="text-right">
                          <div
                            className={cn(
                              "inline-flex items-center justify-end gap-1 whitespace-nowrap font-semibold tabular-nums",
                              expense
                                ? "text-red-600"
                                : "text-green-600"
                            )}
                          >
                            {expense ? (
                              <ArrowUpRight className="size-3.5" />
                            ) : (
                              <ArrowDownLeft className="size-3.5" />
                            )}

                            {expense ? "-" : "+"}
                            {fmt(Number(t.amount))}
                          </div>

                          <p className="text-[10px] text-muted-foreground">
                            HTG
                          </p>
                        </TableCell>

                        {/* Note */}
                        <TableCell>
                          <p className="max-w-[180px] truncate text-sm text-muted-foreground">
                            {t.note ?? "—"}
                          </p>
                        </TableCell>

                        {/* Creator */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                              <Users className="size-3.5 text-muted-foreground" />
                            </div>

                            <span className="max-w-[120px] truncate text-sm">
                              {creator}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <Separator />

          <div className="flex flex-col justify-between gap-2 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <p>
              Ap montre {totalTransactions} dènye tranzaksyon.
            </p>

            <p className="flex items-center gap-1.5">
              <History className="size-3.5" />
              Pi resan yo parèt an premye.
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
