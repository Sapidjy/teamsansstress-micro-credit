"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { recordRepayment } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RepaymentForm({
  loanId,
  remaining,
  hasPayments,
  fee,
}: {
  loanId: string;
  remaining: number;
  hasPayments: boolean;
  fee: number;
}) {
  const [state, action, pending] = useActionState(recordRepayment, undefined);
  const [amount, setAmount] = useState(String(remaining));

  const n = Number(amount);
  const feeApplies = n > 0 && (hasPayments || n < remaining);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="loanId" value={loanId} />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          name="amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          disabled={pending}
          className="h-9 w-32"
          aria-label="Montan remboursman"
        />

        <Select name="source" defaultValue="CASH" disabled={pending}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CASH">Kach</SelectItem>
            <SelectItem value="BALANCE">Soti nan balans</SelectItem>
          </SelectContent>
        </Select>

        <Button type="submit" size="sm" disabled={pending} className="gap-2">
          {pending && <Loader2 className="size-4 animate-spin" />}
          Anrejistre rambousman
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {feeApplies
          ? `+ ${fee} HTG frè vèsman (pou TSS-MK).`
          : "Peman konplè an yon sèl fwa: pa gen frè vèsman."}
      </p>

      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state?.success && <p className="text-xs text-green-600">Remboursman anrejistre.</p>}
    </form>
  );
}