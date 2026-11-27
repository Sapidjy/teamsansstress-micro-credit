"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { recordFee } from "./actions";
import { FEE_AMOUNTS, feeLabels, type ManualFee } from "@/lib/fees";

import { AlertCircle, CheckCircle2, Coins, FileText, Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Member = { id: string; code: string | null; name: string; balance: number };

const KINDS = Object.keys(FEE_AMOUNTS) as ManualFee[];
const fmt = (n: number) => n.toLocaleString("fr-HT", { maximumFractionDigits: 2 });

export default function FeeForm({ members }: { members: Member[] }) {
  const [state, action, pending] = useActionState(recordFee, undefined);
  const ref = useRef<HTMLFormElement>(null);

  const [userId, setUserId] = useState("");
  const [kind, setKind] = useState<ManualFee>("MEMBERSHIP");
  const [source, setSource] = useState("CASH");

  const member = members.find((m) => m.id === userId);
  const amount = FEE_AMOUNTS[kind];
  const notEnough = source === "BALANCE" && member && member.balance < amount;

  useEffect(() => {
    if (state?.success) {
      ref.current?.reset();
      setUserId("");
      setKind("MEMBERSHIP");
      setSource("CASH");
    }
  }, [state]);

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="border-b bg-muted/20 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Coins className="size-5" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-base">Anrejistre yon frè oswa penalite</CardTitle>
            <CardDescription className="text-xs">
              Lajan an antre sou kont Team Sans Stress (TSS-MK).
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <form ref={ref} action={action} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Manm */}
            <div className="space-y-2">
              <Label htmlFor="userId">
                Manm <span className="text-destructive">*</span>
              </Label>
              <Select name="userId" value={userId} onValueChange={setUserId} required disabled={pending}>
                <SelectTrigger id="userId" className="h-10 w-full">
                  <SelectValue placeholder="Chwazi yon manm..." />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        {m.code && (
                          <span className="font-mono text-xs text-muted-foreground">{m.code}</span>
                        )}
                        <span className="font-medium">{m.name}</span>
                        <span className="text-xs text-muted-foreground">· {fmt(m.balance)} HTG</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tip frè */}
            <div className="space-y-2">
              <Label htmlFor="kind">
                Tip frè / penalite <span className="text-destructive">*</span>
              </Label>
              <Select
                name="kind"
                value={kind}
                onValueChange={(v) => setKind(v as ManualFee)}
                required
                disabled={pending}
              >
                <SelectTrigger id="kind" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {feeLabels[k]} · {FEE_AMOUNTS[k]} HTG
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Montan an fikse: <Badge variant="secondary">{amount} HTG</Badge>
              </p>
            </div>

            {/* Fason peman */}
            <div className="space-y-2">
              <Label htmlFor="source">
                Fason peman <span className="text-destructive">*</span>
              </Label>
              <Select name="source" value={source} onValueChange={setSource} required disabled={pending}>
                <SelectTrigger id="source" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Kach (manm nan peye sou plas)</SelectItem>
                  <SelectItem value="BALANCE">Soti nan balans manm nan</SelectItem>
                </SelectContent>
              </Select>
              {notEnough && (
                <p className="text-[11px] text-destructive">
                  Balans manm nan ({fmt(member!.balance)} HTG) pa sifi.
                </p>
              )}
            </div>

            {/* Nòt */}
            <div className="space-y-2">
              <Label htmlFor="note">
                Nòt <Badge variant="secondary" className="ml-2 text-[10px]">Opsyonèl</Badge>
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="note"
                  name="note"
                  placeholder="Egzanp: reyinyon 30 Nov"
                  maxLength={200}
                  disabled={pending}
                  className="h-10 pl-9"
                />
              </div>
            </div>
          </div>

          {state?.error && (
            <Alert variant="destructive" role="alert">
              <AlertCircle className="size-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {state?.success && (
            <Alert className="border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400">
              <CheckCircle2 className="size-4" />
              <AlertDescription>Frè a anrejistre. Lajan an antre sou kont TSS-MK.</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending || members.length === 0} className="h-10 w-full gap-2 sm:w-auto">
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Ap anrejistre...
                </>
              ) : (
                <>
                  <Coins className="size-4" />
                  Anrejistre {amount} HTG
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}