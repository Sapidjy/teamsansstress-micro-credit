import {
  Archive,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  HandCoins,
  Landmark,
  Plus,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { db } from "../../../src/lib/db";
import { requireAdmin } from "../../../src/lib/auth";
import { createCycle } from "./actions";
import SettlementPanel from "./settlement-panel";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const instant = false;

const fmt = (n: number) => n.toLocaleString("fr-HT", { maximumFractionDigits: 2 });
const fmtDate = (d: Date) => d.toLocaleDateString("fr-FR", { timeZone: "UTC" });

type ShareKey = "borrowerShare" | "teamShare" | "poolShare";

const shareCards: {
  key: ShareKey;
  label: string;
  pct: string;
  icon: LucideIcon;
  dot: string;
  iconTone: string;
}[] = [
  {
    key: "borrowerShare",
    label: "Manm ki prete yo",
    pct: "50%",
    icon: HandCoins,
    dot: "bg-primary",
    iconTone: "bg-primary/10 text-primary",
  },
  {
    key: "teamShare",
    label: "Ekip la",
    pct: "25%",
    icon: Users,
    dot: "bg-foreground",
    iconTone: "bg-foreground/10 text-foreground",
  },
  {
    key: "poolShare",
    label: "Pot tout manm yo",
    pct: "25%",
    icon: UsersRound,
    dot: "bg-muted-foreground/40",
    iconTone: "bg-muted text-muted-foreground",
  },
];

export default async function CyclePage() {
  await requireAdmin();

  const [open, past] = await Promise.all([
    db.cycle.findFirst({ where: { status: "OPEN" }, include: { payouts: true } }),
    db.cycle.findMany({ where: { status: "CLOSED" }, orderBy: { closedAt: "desc" }, take: 10 }),
  ]);

  const sum = (key: "interest" | "borrowerShare" | "teamShare" | "poolShare") =>
    (open?.payouts ?? []).reduce((s, p) => s + Number(p[key]), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sik ak dekesman</h1>
          <p className="text-sm text-muted-foreground">
            Jere sik gwoupman an ak distribisyon enterè yo.
          </p>
        </div>
        <Badge
          variant={open ? "default" : "outline"}
          className="w-fit gap-1.5 py-1"
        >
          {open ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Sik ouvri
            </>
          ) : (
            <>
              <CalendarClock className="h-3.5 w-3.5" />
              Pa gen sik ouvri
            </>
          )}
        </Badge>
      </div>

      {/* Kreye yon sik */}
      {!open && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CalendarPlus className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base">Kreye yon nouvo sik</CardTitle>
              <CardDescription>
                Sik la dire 1 an. Manm yo ka kòmanse prete lè li kreye.
              </CardDescription>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-4 sm:p-6">
            <form action={createCycle} className="grid gap-4 sm:grid-cols-[1fr_200px_auto] sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="name">Non sik la</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="Egzanp: Sik 2026-2027"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Dat kòmansman</Label>
                <Input id="startDate" name="startDate" type="date" required className="h-11" />
              </div>
              <Button type="submit" className="h-11 gap-2 font-semibold">
                <Plus className="h-4 w-4" />
                Kreye sik la
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Sik ouvri */}
      {open && (
        <>
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-red-700 text-white shadow-lg">
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-16 right-16 h-36 w-36 rounded-full bg-white/5" />
            <CardContent className="relative space-y-6 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-lg font-semibold">{open.name}</p>
                  <p className="flex items-center gap-2 text-sm text-white/70">
                    <CalendarClock className="h-4 w-4" />
                    {fmtDate(open.startDate)} → {fmtDate(open.endDate)}
                  </p>
                </div>
                <Badge className="gap-1.5 border-0 bg-white/15 text-white hover:bg-white/15">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {open.payouts.length} pre peye nèt
                </Badge>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Landmark className="h-4 w-4" />
                  Enterè kolekte
                </div>
                <p className="text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
                  {fmt(sum("interest"))}
                  <span className="ml-2 text-lg font-medium text-white/70">HTG</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Distribisyon 50 / 25 / 25 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold tracking-tight">Distribisyon enterè yo</h2>

            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/2 bg-primary" />
              <div className="h-full w-1/4 bg-foreground" />
              <div className="h-full w-1/4 bg-muted-foreground/40" />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {shareCards.map(({ key, label, pct, icon: Icon, dot, iconTone }) => (
                <Card key={key} className="shadow-sm">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full",
                          iconTone
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <Badge variant="secondary" className="gap-1.5 text-[10px]">
                        <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
                        {pct}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-xl font-bold tracking-tight tabular-nums">
                        {fmt(sum(key))}{" "}
                        <span className="text-xs font-medium text-muted-foreground">HTG</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <SettlementPanel />
        </>
      )}

      {/* Sik ki fèmen */}
      {past.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Archive className="h-4 w-4 text-muted-foreground" />
              Sik ki fèmen
            </CardTitle>
            <Badge variant="outline">{past.length}</Badge>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ul>
              {past.map((c, i) => (
                <li key={c.id}>
                  <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                        <CalendarClock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="truncate text-sm font-medium">{c.name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] text-muted-foreground">Kès ekip</p>
                      <p className="text-sm font-semibold tabular-nums">
                        {fmt(Number(c.teamFund))} HTG
                      </p>
                    </div>
                  </div>
                  {i < past.length - 1 && <Separator className="ml-16" />}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}