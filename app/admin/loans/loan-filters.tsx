"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LoanFiltersProps = {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
  limit: number;
};

export default function LoanFilters({
  q = "",
  status = "ALL",
  from = "",
  to = "",
  limit,
}: LoanFiltersProps) {
  const [amount, setAmount] = useState(limit);

  return (
    <form
      method="GET"
      className="space-y-4 rounded-xl border bg-card p-4 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-semibold">Filtre ak rechèch</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Recherche */}
        <div className="space-y-2 lg:col-span-2">
          <label htmlFor="q" className="text-sm font-medium">
            Chèche yon prè
          </label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Non, telefòn, rezon..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">
            Estati prè
          </label>

          <select
            id="status"
            name="status"
            defaultValue={status}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="ALL">Tout estati</option>
            <option value="PENDING">An atant</option>
            <option value="ACTIVE">Aktif</option>
            <option value="LATE">An reta</option>
            <option value="PAID">Peye</option>
            <option value="REJECTED">Refize</option>
          </select>
        </div>

        {/* Date debut */}
        <div className="space-y-2">
          <label htmlFor="from" className="text-sm font-medium">
            Depi dat
          </label>

          <Input
            id="from"
            name="from"
            type="date"
            defaultValue={from}
          />
        </div>

        {/* Date fin */}
        <div className="space-y-2">
          <label htmlFor="to" className="text-sm font-medium">
            Jiska dat
          </label>

          <Input
            id="to"
            name="to"
            type="date"
            defaultValue={to}
          />
        </div>
      </div>

      {/* Nombre de prêts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="limit" className="text-sm font-medium">
            Kantite prè pou afiche
          </label>

          <span className="rounded-md bg-muted px-3 py-1 text-sm font-bold tabular-nums">
            {amount} prè
          </span>
        </div>

        <input
          id="limit"
          name="limit"
          type="range"
          min="10"
          max="100"
          step="10"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full cursor-pointer accent-primary"
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>10 prè</span>
          <span>50 prè</span>
          <span>100 prè</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="gap-2">
          <Search className="h-4 w-4" />
          Aplike filtè
        </Button>

        <Button variant="outline" asChild>
          <a href="/admin/loans" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reyajiste
          </a>
        </Button>
      </div>
    </form>
  );
}
