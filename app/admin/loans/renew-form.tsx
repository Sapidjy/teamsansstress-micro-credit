"use client";

import { useActionState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { renewLoan } from "./actions";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fmt = (n: number) => n.toLocaleString("fr-HT", { maximumFractionDigits: 2 });

export default function RenewForm({
  loanId,
  pay,
  fee,
  nextLabel,
  nextRate,
  left,
}: {
  loanId: string;
  pay: number;
  fee: number;
  nextLabel: string;
  nextRate: number;
  left: number;
}) {
  const [state, action, pending] = useActionState(renewLoan, undefined);

  return (
    <form action={action} className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <input type="hidden" name="loanId" value={loanId} />

      <p className="text-sm font-medium">Renouvle pre a</p>
      <p className="text-xs text-muted-foreground">
        Manm nan peye <b>{fmt(pay)} HTG</b> (enterè + penalite) + <b>{fee} HTG</b> frè vèsman. Kapital la
        repran pou <b>{nextLabel}</b> ({nextRate}%). Renouvèlman ki rete: {left}.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Select name="source" defaultValue="CASH" disabled={pending}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CASH">Kach</SelectItem>
            <SelectItem value="BALANCE">Soti nan balans</SelectItem>
          </SelectContent>
        </Select>

        <Button type="submit" size="sm" variant="outline" disabled={pending} className="gap-2">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Renouvle pou {nextLabel}
        </Button>
      </div>

      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state?.success && <p className="text-xs text-green-600">Pre a renouvle.</p>}
    </form>
  );
}