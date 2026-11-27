import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Coins,
  HandCoins,
  Landmark,
  Lock,
  PiggyBank,
  Receipt,
  Users,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { db } from "../../src/lib/db";
import { requireAdmin } from "../../src/lib/auth";
import { fromCents, interestCents, toCents, ZERO } from "../../src/lib/cycle";
import { markLateLoans } from "../../src/lib/late";
import { mondayOf, todayHT } from "../../src/lib/week";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { loanDue } from "@/lib/loan-calc";

export const instant = false;

const fmt = (n: number) => n.toLocaleString("fr-HT", { maximumFractionDigits: 2 });
const DAY = 24 * 60 * 60 * 1000;

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  alert = false,
  locked = false,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  alert?: boolean;
  locked?: boolean;
  href?: string;
}) {
  const body = (
    <Card
      className={cn(
        "h-full shadow-sm transition-all",
        href && "hover:-translate-y-0.5 hover:shadow-md",
        alert && "border-primary/40"
      )}
    >
      <CardContent className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full",
              alert ? "bg-primary/10 text-primary" : "bg-foreground/5 text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          {locked && (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Lock className="h-3 w-3" />
              Bloke
            </Badge>
          )}
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p
            className={cn(
              "text-xl font-bold tracking-tight tabular-nums sm:text-2xl",
              alert && "text-primary"
            )}
          >
            {value}
          </p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
  return href ? (
    <Link href={href} className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {body}
    </Link>
  ) : (
    body
  );
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default async function AdminDashboard() {
  await requireAdmin();
  await markLateLoans();

  const monday = mondayOf(todayHT());

  const [
    activeUsers,
    inactiveUsers,
    totals,
    loanGroups,
    openCycle,
    openLoans,
    paidSharesThisWeek,
    activeAccounts,
    logs,
    team,
  ] = await Promise.all([
    db.user.count({ where: { status: "ACTIVE" } }),
    db.user.count({ where: { status: "INACTIVE", role: { not: "TEAM" } } }),
    db.account.aggregate({
      where: { user: { role: "MEMBER" } },
      _sum: { balance: true, shares: true, initialDeposit: true },
    }),
    db.loan.groupBy({ by: ["status"], _count: { _all: true } }),
    db.cycle.findFirst({ where: { status: "OPEN" }, include: { payouts: true } }),
    db.loan.findMany({
      where: { status: { in: ["ACTIVE", "LATE"] } },
      include: { user: true, payments: true },
      orderBy: { dueDate: "asc" },
    }),
    db.transaction.findMany({
      where: { type: "SHARE", weekOf: monday },
      select: { accountId: true },
    }),
    db.account.count({ where: { user: { status: "ACTIVE" } } }),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { actor: { select: { name: true } } },
    }),
    db.user.findFirst({ where: { role: "TEAM" }, include: { account: true } }),
  ]);

  const count = (s: string) => loanGroups.find((g) => g.status === s)?._count._all ?? 0;

  const balance = Number(totals._sum.balance ?? 0);
  const shares = Number(totals._sum.shares ?? 0);
  const initial = Number(totals._sum.initialDeposit ?? 0);

  // Pre an sikilasyon: kapital ak sa ki toujou dwe (kapital + enterè - peman)
  let outstanding = ZERO;
  let principal = 0;
  const lateRows: {
    id: string;
    name: string;
    phone: string;
    dueDate: Date;
    daysLate: number;
    remaining: number;
  }[] = [];

  for (const l of openLoans) {
    const due = loanDue(l, l.payments);
    outstanding += due.remaining;
    principal += Number(l.amount);

    if (l.status === "LATE" && l.dueDate) {
      lateRows.push({
        id: l.id,
        name: l.user.name,
        phone: l.user.phone,
        dueDate: l.dueDate,
        daysLate: Math.max(Math.floor((Date.now() - l.dueDate.getTime()) / DAY), 0),
        remaining: fromCents(due.remaining),
      });
    }
  }

  const sum = (key: "interest" | "borrowerShare" | "teamShare" | "poolShare") =>
    (openCycle?.payouts ?? []).reduce((s, p) => s + Number(p[key]), 0);

  const unpaidThisWeek = Math.max(
    activeAccounts - new Set(paidSharesThisWeek.map((t) => t.accountId)).size,
    0
  );

  const total = balance + shares + initial + Number(team?.account?.balance ?? 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Rezime gwoupman an</p>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5 py-1">
          <CalendarClock className="h-3.5 w-3.5" />
          Semèn lendi {monday.toLocaleDateString("fr-FR", { timeZone: "UTC" })}
        </Badge>
      </div>

      {/* Gwo kat: lajan total */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-red-700 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 right-16 h-36 w-36 rounded-full bg-white/5" />
        <CardContent className="relative grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Landmark className="h-4 w-4" />
              Lajan total nan gwoupman an
            </div>
            <p className="text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
              {fmt(total)}
              <span className="ml-2 text-lg font-medium text-white/70">HTG</span>
            </p>
            <p className="text-xs text-white/60">Balans + aksyon + depo inisyal</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm sm:gap-6">
            <div>
              <p className="text-xs text-white/60">Balans</p>
              <p className="font-semibold tabular-nums">{fmt(balance)}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Aksyon</p>
              <p className="font-semibold tabular-nums">{fmt(shares)}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Depo inisyal</p>
              <p className="font-semibold tabular-nums">{fmt(initial)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manm ak lajan */}
      <section className="space-y-3">
        <SectionTitle>Manm ak kont</SectionTitle>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Manm aktif"
            value={String(activeUsers)}
            sub={`${inactiveUsers} inaktif`}
            icon={Users}
            href="/admin/members"
          />
          <StatCard
            label="Aksyon"
            value={`${fmt(shares)} HTG`}
            icon={PiggyBank}
            locked
            href="/admin/shares"
          />
          <StatCard label="Depo inisyal" value={`${fmt(initial)} HTG`} icon={Landmark} locked />
          <StatCard
            label="Balans manm yo"
            value={`${fmt(balance)} HTG`}
            sub="Lajan lib sou kont yo"
            icon={Wallet}
          />
        </div>
      </section>

      {/* Pre */}
      <section className="space-y-3">
        <SectionTitle
          action={
            <Link
              href="/admin/loans"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Wè tout <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          Aksyon ak pre
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Aksyon lendi sa a"
            value={String(unpaidThisWeek)}
            sub="manm poko peye"
            icon={Receipt}
            alert={unpaidThisWeek > 0}
            href="/admin/shares"
          />
          <StatCard
            label="Pre an atant"
            value={String(count("PENDING"))}
            icon={Clock}
            alert={count("PENDING") > 0}
            href="/admin/loans"
          />
          <StatCard
            label="Pre aktif"
            value={String(count("ACTIVE"))}
            sub={`Kapital: ${fmt(principal)} HTG`}
            icon={HandCoins}
            href="/admin/loans"
          />
          <StatCard
            label="Pre an reta"
            value={String(count("LATE"))}
            icon={AlertTriangle}
            alert={count("LATE") > 0}
            href="/admin/loans"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Toujou dwe"
            value={`${fmt(fromCents(outstanding))} HTG`}
            sub="Kapital + enterè, apre peman"
            icon={Wallet}
          />
          <StatCard label="Pre peye nèt" value={String(count("PAID"))} icon={CheckCircle2} />
          <StatCard label="Pre rejte" value={String(count("REJECTED"))} icon={XCircle} />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Toujou dwe"
            value={`${fmt(fromCents(outstanding))} HTG`}
            sub="Kapital + enterè, apre peman"
            icon={Wallet}
          />
          <StatCard label="Pre peye nèt" value={String(count("PAID"))} icon={CheckCircle2} />
          <StatCard label="Pre rejte" value={String(count("REJECTED"))} icon={XCircle} />
          <StatCard
            label="Kès ekip la (TSS-MK)"
            value={`${fmt(Number(team?.account?.balance ?? 0))} HTG`}
            sub="Frè, penalite ak 25% enterè"
            icon={Coins}
            href="/admin/fees"
          />
        </div>
      </section>

      {/* Sik */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {openCycle ? openCycle.name : "Pa gen sik ouvri"}
            </CardTitle>
            {openCycle && (
              <p className="text-xs text-muted-foreground">
                {openCycle.startDate.toLocaleDateString("fr-FR", { timeZone: "UTC" })} →{" "}
                {openCycle.endDate.toLocaleDateString("fr-FR", { timeZone: "UTC" })}
                {" · "}
                {openCycle.payouts.length} pre peye nèt
              </p>
            )}
          </div>
          <Link
            href="/admin/cycle"
            className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {openCycle ? "Sik / dekesman" : "Kreye yon sik"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <Separator />
        <CardContent className="p-4">
          {openCycle ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs text-muted-foreground">Enterè kolekte</p>
                <p className="text-2xl font-bold tracking-tight tabular-nums">
                  {fmt(sum("interest"))}{" "}
                  <span className="text-sm font-medium text-muted-foreground">HTG</span>
                </p>
              </div>

              {/* Bar distribisyon 50 / 25 / 25 */}
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-1/2 bg-primary" />
                <div className="h-full w-1/4 bg-foreground" />
                <div className="h-full w-1/4 bg-muted-foreground/40" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { label: "Manm ki prete yo", pct: "50%", key: "borrowerShare", dot: "bg-primary" },
                  { label: "Ekip la", pct: "25%", key: "teamShare", dot: "bg-foreground" },
                  { label: "Tout manm yo", pct: "25%", key: "poolShare", dot: "bg-muted-foreground/40" },
                ].map((p) => (
                  <div key={p.key} className="rounded-lg border p-3">
                    <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={cn("h-2 w-2 rounded-full", p.dot)} />
                      {p.label} ({p.pct})
                    </div>
                    <p className="font-semibold tabular-nums">
                      {fmt(sum(p.key as "borrowerShare" | "teamShare" | "poolShare"))} HTG
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <CalendarClock className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Kreye yon sik pou manm yo ka kòmanse prete.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pre an reta */}
      {lateRows.length > 0 && (
        <Card className="overflow-hidden border-primary/40 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 bg-primary/5 pb-3">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <CardTitle className="text-base text-primary">
              Pre an reta ({lateRows.length})
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Manm</TableHead>
                  <TableHead>Dat limit</TableHead>
                  <TableHead className="text-center">Jou reta</TableHead>
                  <TableHead className="pr-4 text-right">Rete pou peye</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lateRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                            {initialsOf(r.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="leading-tight">
                          <p className="font-medium">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {r.dueDate.toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="destructive">{r.daysLate} j</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap pr-4 text-right font-semibold tabular-nums">
                      {fmt(r.remaining)} HTG
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Jounal */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">Dènye aktivite</CardTitle>
          {logs.length > 0 && <Badge variant="outline">{logs.length}</Badge>}
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Activity className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Pa gen aktivite ankò</p>
            </div>
          ) : (
            <ul>
              {logs.map((l, i) => (
                <li key={l.id}>
                  <div className="flex items-start gap-3 px-4 py-3">
                    <Avatar className="mt-0.5 h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-foreground/5 text-xs font-semibold">
                        {initialsOf(l.actor.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-sm">
                        <span className="font-semibold">{l.actor.name}</span>
                        <span className="text-muted-foreground"> · </span>
                        <Badge variant="secondary" className="align-middle text-[10px]">
                          {l.action}
                        </Badge>
                      </p>
                      {l.details && (
                        <p className="break-words text-xs text-muted-foreground">{l.details}</p>
                      )}
                    </div>
                    <time className="shrink-0 text-right text-[11px] text-muted-foreground">
                      {l.createdAt.toLocaleString("fr-FR")}
                    </time>
                  </div>
                  {i < logs.length - 1 && <Separator className="ml-16" />}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}