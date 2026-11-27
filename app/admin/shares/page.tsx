import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { SHARE_MAX, SHARE_MIN } from "@/lib/loan";
import { displayPhone } from "@/lib/phone";
import { addDays, iso, mondayOf, todayHT } from "@/lib/week";
import ShareForm from "./share-form";
import { quickShare } from "./actions";

export const instant = false;

const fmt = (n: number) => n.toLocaleString("fr-HT", { maximumFractionDigits: 2 });

export default async function SharesPage() {
  await requireAdmin();

  const currentMonday = mondayOf(todayHT());
  const currentIso = iso(currentMonday);

  const users = await db.user.findMany({
    where: { status: "ACTIVE", role: "MEMBER" },
    orderBy: { name: "asc" },
    include: {
      account: {
        include: {
          transactions: { where: { type: "SHARE" }, select: { weekOf: true } },
        },
      },
    },
  });

  const rows = users.map((u) => {
    const paid = new Set(
      (u.account?.transactions ?? []).map((t) => (t.weekOf ? iso(t.weekOf) : ""))
    );
    let late = 0;
    for (let d = mondayOf(u.createdAt); d < currentMonday; d = addDays(d, 7)) {
      if (!paid.has(iso(d))) late++;
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Aksyon lendi</h1>
        <p className="text-sm text-gray-500">
          Semèn ki kòmanse lendi {currentMonday.toLocaleDateString("fr-FR", { timeZone: "UTC" })} ·
          chak manm bay ant {fmt(SHARE_MIN)} ak {fmt(SHARE_MAX)} HTG pa semèn
        </p>
      </div>

      <ShareForm
        members={rows.map((r) => ({ id: r.id, code: r.code, name: r.name, phone: r.phone }))}
        currentMonday={currentIso}
        min={SHARE_MIN}
        max={SHARE_MAX}
      />

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Manm</th>
              <th className="p-3">Total aksyon</th>
              <th className="p-3">Semèn sa a</th>
              <th className="p-3">Semèn an reta</th>
              <th className="p-3">Anrejistre</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">
                  {r.name}
                  <span className="block text-xs text-gray-500">
                    {r.code ? `${r.code} · ` : ""}+509 {displayPhone(r.phone)}
                  </span>
                </td>
                <td className="p-3">{fmt(r.shares)} HTG</td>
                <td className="p-3">
                  <span className={r.paidNow ? "text-green-600" : "text-orange-600"}>
                    {r.paidNow ? "Peye" : "Poko peye"}
                  </span>
                </td>
                <td className="p-3">
                  <span className={r.late > 0 ? "text-red-600 font-semibold" : "text-gray-500"}>
                    {r.late}
                  </span>
                </td>
                <td className="p-3">
                  {!r.paidNow && (
                    <form action={quickShare} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={r.id} />
                      <input
                        name="amount"
                        type="number"
                        inputMode="numeric"
                        min={SHARE_MIN}
                        max={SHARE_MAX}
                        step={1}
                        defaultValue={SHARE_MIN}
                        required
                        aria-label={`Montan pou ${r.name}`}
                        className="border rounded p-1 w-24"
                      />
                      <button className="text-blue-600">Anrejistre</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}