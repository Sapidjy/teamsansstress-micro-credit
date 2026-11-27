"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Check,
  HandCoins,
  Loader2,
  Send,
  PiggyBank,
  Percent,
} from "lucide-react";

import { LOAN_TERMS, MIN_LOAN, REQUEST_TERMS, calcLoan, type TermDays } from "../../../src/lib/loan";
import { requestLoan } from "./actions";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const fmt = (n: number) => n.toLocaleString("fr-HT", { maximumFractionDigits: 2 });

export default function LoanForm({
  shares,
  maxAmount,
}: {
  shares: number;
  maxAmount: number;
}) {
  const [state, action, pending] = useActionState(requestLoan, undefined);
  const ref = useRef<HTMLFormElement>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [term, setTerm] = useState<TermDays>(30);

  useEffect(() => {
    if (state?.success) {
      ref.current?.reset();
      setAmount("");
      setReason("");
    }
  }, [state]);

  const a = Number(amount);
  const rate = LOAN_TERMS[term].rate;
  const sim = a > 0 ? calcLoan(a, rate) : null;
  const canBorrow = maxAmount >= MIN_LOAN;
  const tooHigh = a > maxAmount;
  const tooLow = a > 0 && a < MIN_LOAN;
  const invalid = !canBorrow || tooHigh || tooLow;

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <HandCoins className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-base">Mande yon pre</CardTitle>
          <CardDescription>Chwazi dire a, montan an, epi voye demann lan.</CardDescription>
        </div>
      </CardHeader>
      <Separator />

      <CardContent className="p-4 sm:p-6">
        <form ref={ref} action={action} className="space-y-6">
          {/* Limit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <PiggyBank className="h-4 w-4" />
                Aksyon ou
              </div>
              <p className="font-semibold tabular-nums">{fmt(shares)} HTG</p>
            </div>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Maksimòm pre</span>
                <Badge variant="secondary" className="text-[10px]">2 × aksyon</Badge>
              </div>
              <p className="font-semibold tabular-nums text-primary">{fmt(maxAmount)} HTG</p>
            </div>
          </div>

          {!canBorrow && (
            <Alert className="border-primary/30 bg-primary/10 text-primary">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-primary">
                Ou bezwen plis aksyon pou ka prete (minimòm {fmt(MIN_LOAN)} HTG).
              </AlertDescription>
            </Alert>
          )}

          {/* Dire */}
          <div className="space-y-2">
            <Label>Dire</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(LOAN_TERMS).filter(([d]) => REQUEST_TERMS.includes(Number(d))) as [string, (typeof LOAN_TERMS)[TermDays]][]).map(
                ([days, t]) => {
                  const selected = term === Number(days);
                  return (
                    <label
                      key={days}
                      className={cn(
                        "relative cursor-pointer rounded-xl border p-3 text-center transition-all",
                        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                        selected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "hover:border-foreground/30"
                      )}
                    >
                      <input
                        type="radio"
                        name="termDays"
                        value={days}
                        checked={selected}
                        onChange={() => setTerm(Number(days) as TermDays)}
                        className="sr-only"
                      />
                      {selected && (
                        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                      <span className="block text-sm font-semibold">{t.label}</span>
                      <span
                        className={cn(
                          "mt-0.5 inline-flex items-center gap-0.5 text-xs",
                          selected ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        <Percent className="h-3 w-3" />
                        {t.rate}
                      </span>
                    </label>
                  );
                }
              )}
            </div>
          </div>

          {/* Montan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Montan</Label>
              {canBorrow && (
                <button
                  type="button"
                  onClick={() => setAmount(String(maxAmount))}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Itilize maksimòm
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                id="amount"
                name="amount"
                type="number"
                inputMode="numeric"
                min={MIN_LOAN}
                max={maxAmount}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-invalid={tooHigh || tooLow}
                className="h-12 pr-16 text-lg font-semibold tabular-nums"
                placeholder="0"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                HTG
              </span>
            </div>
            {tooHigh && (
              <p className="text-xs text-primary">Montan an depase maksimòm ou ({fmt(maxAmount)} HTG).</p>
            )}
            {tooLow && (
              <p className="text-xs text-primary">Minimòm se {fmt(MIN_LOAN)} HTG.</p>
            )}
          </div>

          {/* Rezon */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="reason">Rezon</Label>
              <span className="text-xs text-muted-foreground tabular-nums">{reason.length}/300</span>
            </div>
            <Textarea
              id="reason"
              name="reason"
              required
              maxLength={300}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Poukisa ou bezwen pre a?"
              className="resize-none"
            />
          </div>

          {/* Simulasyon */}
          {sim && !invalid && (
            <div className="space-y-2 rounded-xl bg-neutral-950 p-4 text-white">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Enterè ({rate}%)</span>
                <span className="font-semibold tabular-nums">{fmt(sim.interest)} HTG</span>
              </div>
              <Separator className="bg-white/15" />
              <div className="flex items-end justify-between">
                <span className="text-sm text-white/70">
                  Total pou remèt apre {LOAN_TERMS[term].label}
                </span>
                <span className="text-xl font-bold tabular-nums">{fmt(sim.total)} HTG</span>
              </div>
            </div>
          )}

          {state?.error && (
            <Alert role="alert" className="border-primary/30 bg-primary/10">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">{state.error}</AlertDescription>
            </Alert>
          )}
          {state?.success && (
            <Alert className="border-foreground/20 bg-foreground/5">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Demann lan voye. Ou ap wè estati li anba a.</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={pending || invalid}
            className="h-12 w-full gap-2 text-base font-semibold"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ap voye...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Voye demann lan
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}