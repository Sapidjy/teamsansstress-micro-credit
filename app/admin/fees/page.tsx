import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { feeLabels } from "@/lib/fees";
import FeeForm from "./fee-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const instant = false;

const fmt = (n: number) => n.toLocaleString("fr-HT", { maximumFractionDigits: 2 });

export default async function FeesPage() {
  await requireAdmin();

  const [team, members, totals, recent] = await Promise.all([
    db.user.findFirst({ where: { role: "TEAM" }, include: { account: true } }),
    db.user.findMany({
      where: { role: { not: "TEAM" }, status: "ACTIVE" },
      orderBy: { name: "asc" },
      include: { account: true },
    }),
    db.transaction.groupBy({
      by: ["feeKind"],
      where: { type: "TEAM_INCOME" },
      _sum: { amount: true },
    }),
    db.transaction.findMany({
      where: { type: "TEAM_INCOME" },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const sumByKind = new Map(totals.map((t) => [t.feeKind, Number(t._sum.amount ?? 0)]));
  const totalIncome = [...sumByKind.values()].reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Frè ak penalite</h1>
        <p className="text-sm text-muted-foreground">
          Tout frè, penalite ak pati 25% sou enterè yo se pou Team Sans Stress.
        </p>
      </div>

      {!team?.account && (
        <p className="text-sm text-destructive">
          Kont ekip la (TSS-MK) pa egziste. Kouri <code>pnpm tsx prisma/create-team.ts</code> dabò.
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Balans kont TSS-MK</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(Number(team?.account?.balance ?? 0))} HTG</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total revni ekip la</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(totalIncome)} HTG</p>
          </CardContent>
        </Card>
      </section>

      <FeeForm
        members={members.map((m) => ({
          id: m.id,
          code: m.code,
          name: m.name,
          balance: Number(m.account?.balance ?? 0),
        }))}
      />

      <section className="space-y-2">
        <h2 className="font-semibold">Revni ekip la pa tip</h2>
        <div className="overflow-x-auto rounded-xl bg-card shadow">
          <table className="w-full text-sm">
            <tbody>
              {(Object.keys(feeLabels) as (keyof typeof feeLabels)[]).map((k) => (
                <tr key={k} className="border-t first:border-t-0">
                  <td className="p-3">{feeLabels[k]}</td>
                  <td className="p-3 text-right font-semibold">{fmt(sumByKind.get(k) ?? 0)} HTG</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Dènye revni yo</h2>
        <div className="overflow-x-auto rounded-xl bg-card shadow">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-3">Dat</th>
                <th className="p-3">Tip</th>
                <th className="p-3">Detay</th>
                <th className="p-3 text-right">Montan</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-muted-foreground">Pa gen revni ankò.</td>
                </tr>
              )}
              {recent.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="whitespace-nowrap p-3">{t.createdAt.toLocaleString("fr-FR")}</td>
                  <td className="p-3">{t.feeKind ? feeLabels[t.feeKind] : "—"}</td>
                  <td className="p-3">{t.note ?? "—"}</td>
                  <td className="p-3 text-right font-semibold text-green-600">
                    +{fmt(Number(t.amount))} HTG
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}