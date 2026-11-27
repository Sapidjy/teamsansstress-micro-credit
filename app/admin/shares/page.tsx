
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Coins,
  Hash,
  Phone,
  PiggyBank,
  Users,
} from "lucide-react";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { SHARE_MAX, SHARE_MIN } from "@/lib/loan";
import { displayPhone } from "@/lib/phone";
import { addDays, iso, mondayOf, todayHT } from "@/lib/week";

import ShareForm from "./share-form";
import { quickShare } from "./actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

import { cn } from "@/lib/utils";

export const instant = false;

const fmt = (n: number) =>
  n.toLocaleString("fr-HT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
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

  // Semèn aktyèl
  const currentMonday = mondayOf(todayHT());
  const currentIso = iso(currentMonday);

  // Chèche manm aktif yo
  const users = await db.user.findMany({
    where: {
      status: "ACTIVE",
      role: "MEMBER",
    },
    orderBy: {
      name: "asc",
    },
    include: {
      account: {
        include: {
          transactions: {
            where: {
              type: "SHARE",
            },
            select: {
              weekOf: true,
            },
          },
        },
      },
    },
  });

  // Prepare done manm yo
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
      if (!paid.has(iso(d))) {
        late++;
      }
    }

    return {
      id: u.id,
      code: u.code,
      name: u.name,
      phone: u.phone,
      shares: Number(u.account?.shares ?? 0),
      paidNow: paid.has(currentIso),
      late,
    };
  });

  // Estatistik
  const totalMembers = rows.length;

  const paidMembers = rows.filter((r) => r.paidNow).length;

  const unpaidMembers = totalMembers - paidMembers;

  const lateMembers = rows.filter((r) => r.late > 0).length;

  const totalShares = rows.reduce(
    (total, r) => total + r.shares,
    0
  );

  const totalLateWeeks = rows.reduce(
    (total, r) => total + r.late,
    0
  );

  const weekLabel = currentMonday.toLocaleDateString("fr-FR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

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
              Aksyon lendi
            </h1>
          </div>

          <p className="text-sm text-muted-foreground">
            Jere kontribisyon chak semèn manm TSS-MK yo.
          </p>
        </div>

        <Badge variant="outline" className="w-fit gap-1.5 py-1.5">
          <CalendarDays className="size-3.5" />
          Semèn {weekLabel}
        </Badge>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Total manm"
          value={String(totalMembers)}
          description="Manm aktif TSS-MK"
          icon={Users}
        />

        <StatCard
          label="Total aksyon"
          value={`${fmt(totalShares)} HTG`}
          description="Tout kontribisyon akimile"
          icon={Coins}
        />

        <StatCard
          label="Manm ki peye"
          value={String(paidMembers)}
          description="Kontribisyon semèn sa a"
          icon={CheckCircle2}
        />

        <StatCard
          label="Manm an reta"
          value={String(lateMembers)}
          description={`${totalLateWeeks} semèn ki poko peye`}
          icon={AlertCircle}
        />
      </div>

      {/* Weekly information */}
      <Card className="border-primary/20 shadow-sm">
        <CardContent className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="size-5" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold">
                Kontribisyon semèn aktyèl la
              </p>

              <p className="text-xs text-muted-foreground">
                Semèn ki kòmanse lendi {weekLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Minimòm: {fmt(SHARE_MIN)} HTG
            </Badge>

            <Badge variant="secondary">
              Maksimòm: {fmt(SHARE_MAX)} HTG
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Share Form */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <PiggyBank className="size-4 text-primary" />

          <h2 className="text-sm font-semibold">
            Anrejistre aksyon
          </h2>
        </div>

        <ShareForm
          members={rows.map((r) => ({
            id: r.id,
            code: r.code,
            name: r.name,
            phone: r.phone,
          }))}
          currentMonday={currentIso}
          min={SHARE_MIN}
          max={SHARE_MAX}
        />
      </section>

      {/* Members Table */}
      <section className="space-y-3">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight">
              Suivi aksyon manm yo
            </h2>

            <p className="text-xs text-muted-foreground">
              Konsilte kontribisyon, peman semèn sa a ak reta yo.
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
                  <TableHead className="min-w-[200px]">
                    Manm
                  </TableHead>

                  <TableHead className="min-w-[150px] text-right">
                    Total aksyon
                  </TableHead>

                  <TableHead className="min-w-[130px]">
                    Semèn sa a
                  </TableHead>

                  <TableHead className="min-w-[110px] text-center">
                    Semèn an reta
                  </TableHead>

                  <TableHead className="min-w-[210px] text-right">
                    Anrejistre
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
                          Pa gen kontribisyon pou anrejistre pou kounye a.
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
                            <p className="max-w-[180px] truncate text-sm font-semibold">
                              {r.name}
                            </p>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                              {r.code && (
                                <span className="flex items-center gap-1">
                                  <Hash className="size-3" />
                                  {r.code}
                                </span>
                              )}

                              <span className="flex items-center gap-1">
                                <Phone className="size-3" />
                                +509 {displayPhone(r.phone)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Total shares */}
                      <TableCell className="text-right">
                        <span className="font-semibold tabular-nums">
                          {fmt(r.shares)}
                        </span>

                        <span className="ml-1 text-xs text-muted-foreground">
                          HTG
                        </span>
                      </TableCell>

                      {/* Current week */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1.5 font-medium",
                            r.paidNow
                              ? "border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400"
                              : "border-orange-500/30 bg-orange-500/5 text-orange-700 dark:text-orange-400"
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              r.paidNow
                                ? "bg-green-500"
                                : "bg-orange-500"
                            )}
                          />

                          {r.paidNow ? "Peye" : "Poko peye"}
                        </Badge>
                      </TableCell>

                      {/* Late weeks */}
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-semibold tabular-nums",
                            r.late > 0
                              ? "border-destructive/30 bg-destructive/5 text-destructive"
                              : "text-muted-foreground"
                          )}
                        >
                          {r.late}
                        </Badge>
                      </TableCell>

                      {/* Quick share */}
                      <TableCell>
                        {!r.paidNow ? (
                          <form
                            action={quickShare}
                            className="flex items-center justify-end gap-2"
                          >
                            <input
                              type="hidden"
                              name="userId"
                              value={r.id}
                            />

                            <Input
                              name="amount"
                              type="number"
                              inputMode="numeric"
                              min={SHARE_MIN}
                              max={SHARE_MAX}
                              step={1}
                              defaultValue={SHARE_MIN}
                              required
                              aria-label={`Montan aksyon pou ${r.name}`}
                              className="h-9 w-24 text-xs"
                            />

                            <Button
                              type="submit"
                              size="sm"
                              className="h-9 gap-1.5"
                            >
                              <CheckCircle2 className="size-3.5" />
                              Anrejistre
                            </Button>
                          </form>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
                            <CheckCircle2 className="size-4" />
                            Anrejistre
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Separator />

          {/* Footer */}
          <div className="flex flex-col justify-between gap-2 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <p>
              Total: {totalMembers} manm
            </p>

            <p className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              Kontribisyon chak lendi
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
