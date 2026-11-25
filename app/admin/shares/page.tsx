
import { db } from "../../../src/lib/db";
import { requireAdmin } from "../../../src/lib/auth";
import { SHARE_AMOUNT } from "../../../src/lib/loan";
import { addDays, iso, mondayOf, todayHT } from "../../../src/lib/week";

import ShareForm from "./share-form";
import { quickShare } from "./actions";

import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wallet,
  CalendarDays,
  Phone,
  PiggyBank,
  ArrowUpRight,
  HandCoins,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

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

const fmt = (n: number) =>
  n.toLocaleString("fr-HT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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

export default async function SharesPage() {
  await requireAdmin();

  const currentMonday = mondayOf(todayHT());
  const currentIso = iso(currentMonday);

  const users = await db.user.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    include: {
      account: {
        include: {
          transactions: {
            where: { type: "SHARE" },
            select: { weekOf: true },
          },
        },
      },
    },
  });

  const rows = users.map((u) => {
    const paid = new Set(
      (u.account?.transactions ?? []).map((t) =>
        t.weekOf ? iso(t.weekOf) : ""
      )
    );

    let late = 0;

    for (
      let d = mondayOf(u.createdAt);
      d < currentMonday;
      d = addDays(d, 7)
    ) {
      if (!paid.has(iso(d))) late++;
    }

    return {
      id: u.id,
      name: u.name,
      phone: u.phone,
      shares: Number(u.account?.shares ?? 0),
      paidNow: paid.has(currentIso),
      late,
    };
  });

  // Statistiques
  const totalMembers = rows.length;

  const paidMembers = rows.filter((r) => r.paidNow).length;

  const unpaidMembers = totalMembers - paidMembers;

  const lateMembers = rows.filter((r) => r.late > 0).length;

  const totalShares = rows.reduce(
    (sum, r) => sum + r.shares,
    0
  );

  const expectedAmount = totalMembers * SHARE_AMOUNT;

  const collectedAmount = paidMembers * SHARE_AMOUNT;

  const paymentRate =
    totalMembers > 0
      ? Math.round((paidMembers / totalMembers) * 100)
      : 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PiggyBank className="size-5" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight">
              Aksyon Lendi
            </h1>
          </div>

          <p className="text-sm text-muted-foreground">
            Jere kontribisyon chak semèn ak swivi peman manm yo.
          </p>
        </div>

        <Badge variant="outline" className="w-fit gap-1.5 py-1.5">
          <CalendarDays className="size-3.5" />

          Semèn:
          {" "}
          {currentMonday.toLocaleDateString("fr-FR", {
            timeZone: "UTC",
          })}
        </Badge>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Total manm aktif"
          value={String(totalMembers)}
          description="Manm ki dwe kontribye"
          icon={Users}
        />

        <StatCard
          label="Peye semèn sa a"
          value={String(paidMembers)}
          description="Kontribisyon anrejistre"
          icon={CheckCircle2}
        />

        <StatCard
          label="Poko peye"
          value={String(unpaidMembers)}
          description="Kontribisyon ki poko fèt"
          icon={Clock}
        />

        <StatCard
          label="Manm an reta"
          value={String(lateMembers)}
          description="Omwen yon semèn san peman"
          icon={AlertTriangle}
        />
      </div>

      {/* Collection overview */}
      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Wallet className="size-4" />
              </div>

              <div>
                <h2 className="text-sm font-semibold">
                  Rezime kontribisyon semèn nan
                </h2>

                <p className="text-xs text-muted-foreground">
                  {SHARE_AMOUNT.toLocaleString("fr-HT")} HTG pa manm
                </p>
              </div>
            </div>

            <Badge variant="secondary">
              {paymentRate}% kolekte
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">
                Montan espere
              </p>

              <p className="mt-1 text-base font-bold tabular-nums">
                {fmt(expectedAmount)}{" "}
                <span className="text-xs font-medium text-muted-foreground">
                  HTG
                </span>
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">
                Montan kolekte
              </p>

              <p className="mt-1 text-base font-bold tabular-nums text-green-600">
                {fmt(collectedAmount)}{" "}
                <span className="text-xs font-medium text-muted-foreground">
                  HTG
                </span>
              </p>
            </div>

            <div className="col-span-2 rounded-lg border p-3 sm:col-span-1">
              <p className="text-xs text-muted-foreground">
                Montan ki rete
              </p>

              <p className="mt-1 text-base font-bold tabular-nums">
                {fmt(expectedAmount - collectedAmount)}{" "}
                <span className="text-xs font-medium text-muted-foreground">
                  HTG
                </span>
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Pwogrè koleksyon
              </span>

              <span className="font-semibold tabular-nums">
                {paymentRate}%
              </span>
            </div>

            <div
              className="h-2.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={paymentRate}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-foreground transition-all"
                style={{ width: `${paymentRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Form */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <HandCoins className="size-4 text-primary" />

          <h2 className="text-sm font-semibold">
            Anrejistre kontribisyon
          </h2>
        </div>

        <ShareForm
          members={rows.map((r) => ({
            id: r.id,
            name: r.name,
            phone: r.phone,
          }))}
          currentMonday={currentIso}
          amount={SHARE_AMOUNT}
        />
      </section>

      {/* Members table */}
      <section className="space-y-3">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight">
              Swivi aksyon manm yo
            </h2>

            <p className="text-xs text-muted-foreground">
              Verifye peman chak manm ak semèn li an reta.
            </p>
          </div>

          <Badge variant="secondary" className="w-fit">
            {totalMembers} manm
          </Badge>
        </div>

        <Card className="overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="min-w-[190px]">
                    Manm
                  </TableHead>

                  <TableHead className="min-w-[140px] text-right">
                    Total aksyon
                  </TableHead>

                  <TableHead className="text-center">
                    Semèn sa a
                  </TableHead>

                  <TableHead className="text-center">
                    Semèn an reta
                  </TableHead>

                  <TableHead className="min-w-[190px] text-right">
                    Aksyon
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="size-8 text-muted-foreground" />

                        <p className="text-sm font-medium">
                          Pa gen manm aktif
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Manm aktif yo ap parèt isit la.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      {/* Member */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                              {initialsOf(r.name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 space-y-0.5">
                            <p className="max-w-[170px] truncate text-sm font-semibold">
                              {r.name}
                            </p>

                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="size-3" />
                              {r.phone}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Shares */}
                      <TableCell className="text-right">
                        <p className="font-semibold tabular-nums">
                          {fmt(r.shares)}
                        </p>

                        <p className="text-[11px] text-muted-foreground">
                          HTG
                        </p>
                      </TableCell>

                      {/* Current week */}
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1.5",
                            r.paidNow
                              ? "border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400"
                              : "border-orange-500/30 bg-orange-500/5 text-orange-700 dark:text-orange-400"
                          )}
                        >
                          {r.paidNow ? (
                            <CheckCircle2 className="size-3.5" />
                          ) : (
                            <Clock className="size-3.5" />
                          )}

                          {r.paidNow ? "Peye" : "Poko peye"}
                        </Badge>
                      </TableCell>

                      {/* Late weeks */}
                      <TableCell className="text-center">
                        <Badge
                          variant={r.late > 0 ? "destructive" : "secondary"}
                          className="tabular-nums"
                        >
                          {r.late} semèn
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex justify-end">
                          {!r.paidNow ? (
                            <form action={quickShare}>
                              <input
                                type="hidden"
                                name="userId"
                                value={r.id}
                              />

                              <Button
                                type="submit"
                                size="sm"
                                className="h-9 gap-2"
                              >
                                <HandCoins className="size-3.5" />

                                Anrejistre
                                {" "}
                                {SHARE_AMOUNT} HTG

                                <ArrowUpRight className="size-3.5" />
                              </Button>
                            </form>
                          ) : (
                            <Badge
                              variant="outline"
                              className="gap-1.5 border-green-500/30 text-green-700 dark:text-green-400"
                            >
                              <CheckCircle2 className="size-3.5" />
                              Konplete
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Separator />

          <div className="flex flex-col justify-between gap-2 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <p>
              {paidMembers} sou {totalMembers} manm peye semèn sa a.
            </p>

            <p className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              Semèn kòmanse {currentMonday.toLocaleDateString("fr-FR", {
                timeZone: "UTC",
              })}
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
