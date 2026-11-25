"use client";

import { useActionState } from "react";

import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  Wallet,
} from "lucide-react";

import { recordRepayment } from "./actions";

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

import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RepaymentForm({
  loanId,
  remaining,
}: {
  loanId: string;
  remaining: number;
}) {
  const [state, action, pending] = useActionState(
    recordRepayment,
    undefined
  );

  const fmt = (value: number) =>
    value.toLocaleString("fr-HT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <form action={action} className="space-y-5">
      {/* Loan ID */}
      <input type="hidden" name="loanId" value={loanId} />

      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <Wallet className="size-4 text-primary" />
        </div>

        <div>
          <p className="text-sm font-semibold">
            Nouvo remboursman
          </p>

          <p className="text-xs text-muted-foreground">
            Antre enfòmasyon peman an anba a.
          </p>
        </div>
      </div>

      {/* Montan */}
      <div className="space-y-2">
        <Label htmlFor={`amount-${loanId}`}>
          Montan pou remèt
        </Label>

        <div className="relative">
          <CircleDollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            id={`amount-${loanId}`}
            name="amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            max={remaining}
            step="0.01"
            defaultValue={remaining}
            required
            disabled={pending || remaining <= 0}
            placeholder="0.00"
            className="h-11 pl-10 pr-16 font-semibold tabular-nums"
          />

          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
            HTG
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Rès dèt manm nan
          </span>

          <span className="font-semibold tabular-nums">
            {fmt(remaining)} HTG
          </span>
        </div>
      </div>

      {/* Mwayen peman */}
      <div className="space-y-2">
        <Label htmlFor={`source-${loanId}`}>
          Mwayen peman
        </Label>

        <Select
          name="source"
          defaultValue="CASH"
          disabled={pending || remaining <= 0}
        >
          <SelectTrigger
            id={`source-${loanId}`}
            className="h-11 w-full bg-background"
          >
            <SelectValue placeholder="Chwazi mwayen peman an" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="CASH">
              <span className="flex items-center gap-2">
                <Banknote className="size-4 text-muted-foreground" />
                Kach
              </span>
            </SelectItem>

            <SelectItem value="BALANCE">
              <span className="flex items-center gap-2">
                <Wallet className="size-4 text-muted-foreground" />
                Soti nan balans manm nan
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Feedback */}
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription className="text-xs">
            {state.error}
          </AlertDescription>
        </Alert>
      )}

      {state?.success && (
        <Alert className="border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400">
          <CheckCircle2 className="size-4" />

          <AlertDescription className="text-xs font-medium">
            Remboursman an anrejistre avèk siksè.
          </AlertDescription>
        </Alert>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={pending || remaining <= 0}
        className="h-11 w-full gap-2 font-semibold"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Ap anrejistre...
          </>
        ) : (
          <>
            <Banknote className="size-4" />
            Anrejistre remboursman
            <ArrowRight className="ml-auto size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
