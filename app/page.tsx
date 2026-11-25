import { redirect } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  HandCoins,
  Landmark,
  Lock,
  LogOut,
  PiggyBank,
  Receipt,
  Wallet,
  ArrowRight,
  type LucideIcon,
  LayoutDashboard,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { logout } from "./login/actions";
import { txLabels } from "@/lib/loan";

export const instant = false;

const fmt = (value: unknown) =>
  Number(value ?? 0).toLocaleString("fr-HT", {
    maximumFractionDigits: 2,
  });

const txStyle: Record<
  string,
  { icon: LucideIcon; sign: "+" | "-"; tone: string }
> = {
  DEPOSIT: {
    icon: ArrowDownLeft,
    sign: "+",
    tone: "bg-emerald-50 text-emerald-700",
  },
  WITHDRAWAL: {
    icon: ArrowUpRight,
    sign: "-",
    tone: "bg-red-50 text-red-700",
  },
  LOAN_DISBURSEMENT: {
    icon: HandCoins,
    sign: "+",
    tone: "bg-blue-50 text-blue-700",
  },
  LOAN_REPAYMENT: {
    icon: Landmark,
    sign: "-",
    tone: "bg-orange-50 text-orange-700",
  },
};

function AccountCard({
  label,
  amount,
  icon: Icon,
  description,
}: {
  label: string;
  amount: unknown;
  icon: LucideIcon;
  description: string;
}) {
  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {label}
          </p>
          <p className="text-xl font-bold tracking-tight tabular-nums">
            {fmt(amount)}
            <span className="ml-1 text-xs font-medium text-muted-foreground">
              HTG
            </span>
          </p>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      account: {
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      },
    },
  });

  if (!user) redirect("/login");

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const transactions = user.account?.transactions ?? [];

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-24 pt-6 md:px-6 md:pb-10">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white flex items-center justify-between w-full gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-11 w-11 border">
            <AvatarFallback className="bg-primary/10 font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 leading-tight">
            <p className="text-xs text-muted-foreground">
              Byenvini ankò,
            </p>
            <h1 className="truncate text-lg font-bold tracking-tight">
              {user.name}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Espas pèsonèl TSS-MK
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user.role === "ADMIN" && (
            <Button
              asChild
              variant="outline"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-primary"
            >
              <Link href="/admin" aria-label="Ale nan administrasyon">
                <LayoutDashboard className="h-4 w-4" />
              </Link>
            </Button>
          )}

          <form action={logout}>
            <Button
              variant="outline"
              size="icon"
              aria-label="Dekonekte"
              className="shrink-0 text-muted-foreground cursor-pointer hover:border-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </header>

      {/* Balans prensipal */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-red-800 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-16 right-16 h-40 w-40 rounded-full bg-white/5" />

        <CardContent className="relative space-y-5 p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-white/75">
              <Wallet className="h-4 w-4" />
              Balans disponib
            </div>
            <Badge className="border border-white/20 bg-white/10 text-white hover:bg-white/10">
              Kont aktif
            </Badge>
          </div>

          <div>
            <p className="text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
              {fmt(user.account?.balance)}
              <span className="ml-2 text-base font-medium text-white/70">
                HTG
              </span>
            </p>
            <p className="mt-2 text-xs text-white/60">
              Montan ki disponib nan kont ou
            </p>
          </div>

          <Separator className="bg-white/15" />

          <div className="flex items-center gap-2 text-xs text-white/70">
            <Lock className="h-3.5 w-3.5" />
            Aksyon ak depo inisyal ou rete separe ak balans disponib la.
          </div>
        </CardContent>
      </Card>

      {/* Lòt montan yo */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Ekonomi ou</h2>
          <p className="text-xs text-muted-foreground">
            Lòt montan ki asosye ak kont ou
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <AccountCard
            label="Aksyon"
            amount={user.account?.shares}
            icon={PiggyBank}
            description="Montan sa a bloke"
          />

          <AccountCard
            label="Depo inisyal"
            amount={user.account?.initialDeposit}
            icon={Landmark}
            description="Montan sa a bloke"
          />
        </div>
      </section>

      <Card className="overflow-hidden border-primary/20 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HandCoins className="h-5 w-5" />
            </div>

            <div className="space-y-1">
              <h2 className="font-semibold">Ou bezwen yon prè?</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Fè yon demann prè fasilman. Chwazi montan an ak dire a,
                epi swiv demann ou an sou kont ou.
              </p>
            </div>
          </div>

          <Button asChild className="w-full gap-2 sm:w-auto">
            <Link href="/loans" prefetch={false}>
              Fè yon demann prè
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Tranzaksyon */}
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
          <div>
            <CardTitle className="text-base">Dènye tranzaksyon</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Aktivite resan nan kont ou
            </p>
          </div>

          {transactions.length > 0 && (
            <Badge variant="outline" className="tabular-nums">
              {transactions.length}
            </Badge>
          )}
        </CardHeader>

        <Separator />

        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Receipt className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">
                Pa gen tranzaksyon ankò
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Lè kont ou gen aktivite, tranzaksyon yo ap parèt isit la.
              </p>
            </div>
          ) : (
            <ul>
              {transactions.map((t, i) => {
                const style = txStyle[t.type] ?? txStyle.DEPOSIT;
                const Icon = style.icon;

                return (
                  <li key={t.id}>
                    <div className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          style.tone
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {txLabels[t.type]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.createdAt.toLocaleDateString("fr-FR")}
                        </p>
                      </div>

                      <p
                        className={cn(
                          "shrink-0 text-sm font-bold tabular-nums",
                          style.sign === "+"
                            ? "text-emerald-700"
                            : "text-foreground"
                        )}
                      >
                        {style.sign}
                        {fmt(t.amount)}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          HTG
                        </span>
                      </p>
                    </div>

                    {i < transactions.length - 1 && (
                      <Separator className="ml-16" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
