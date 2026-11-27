"use client";

import { useActionState, useEffect, useRef } from "react";
import { recordShares } from "./actions";

type Member = { id: string; code: string | null; name: string; phone: string };

export default function ShareForm({
  members,
  currentMonday,
  min,
  max,
}: {
  members: Member[];
  currentMonday: string;
  min: number;
  max: number;
}) {
  const [state, action, pending] = useActionState(recordShares, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) ref.current?.reset();
  }, [state]);

  return (
    <form
      ref={ref}
      action={action}
      className="bg-white rounded-xl shadow p-4 grid gap-3 sm:grid-cols-5"
    >
      <select name="userId" required className="border rounded-lg p-2 sm:col-span-2">
        <option value="">Chwazi yon manm</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.code ? `${m.code} · ` : ""}
            {m.name}
          </option>
        ))}
      </select>

      <div>
        <label className="block text-xs text-gray-500">Montan (HTG)</label>
        <input
          name="amount"
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          defaultValue={min}
          required
          className="border rounded-lg p-2 w-full"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500">Premye lendi</label>
        <input
          name="weekOf"
          type="date"
          defaultValue={currentMonday}
          required
          className="border rounded-lg p-2 w-full"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500">Kantite semèn</label>
        <input
          name="weeks"
          type="number"
          min={1}
          max={12}
          defaultValue={1}
          required
          className="border rounded-lg p-2 w-full"
        />
      </div>

      <button
        disabled={pending}
        className="bg-blue-600 text-white rounded-lg p-2 font-semibold disabled:opacity-50 sm:col-span-5"
      >
        {pending ? "Ap anrejistre..." : "Anrejistre aksyon an"}
      </button>

      <p className="text-xs text-gray-500 sm:col-span-5">
        Montan chak semèn: ant {min.toLocaleString("fr-HT")} ak {max.toLocaleString("fr-HT")} HTG.
        Si w chwazi plizyè semèn, montan an menm pou tout semèn yo.
      </p>

      {state?.error && <p className="text-red-600 text-sm sm:col-span-5">{state.error}</p>}
      {state?.success && <p className="text-green-600 text-sm sm:col-span-5">Aksyon yo anrejistre.</p>}
    </form>
  );
}