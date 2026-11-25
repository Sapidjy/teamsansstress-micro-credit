"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  HandCoins,
  Landmark,
  Loader2,
  Lock,
  Scale,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { previewSettlement, confirmSettlement, type SettlementPreview } from "./actions";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const fmt = (n: number) => n.toLocaleString("fr-HT", { maximumFractionDigits: 2 });

function MiniStat({
  label,
  value,
  icon: Icon,
  tone = "bg-foreground/5 text-foreground",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", tone)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export default function SettlementPanel() {
  const [preview, setPreview] = useState<SettlementPreview | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function onPreview() {
    setMessage(null);
    startTransition(async () => setPreview(await previewSettlement()));
  }

  function onConfirm() {
    setMessage(null);
    startTransition(async () => {
      const res = await confirmSettlement();
      if (res.success) {
        setMessage({ ok: true, text: "Dekesman fèt. Sik la fèmen." });
        setPreview(null);
      } else {
        setMessage({ ok: false, text: res.error ?? "Erè." });
      }
    });
  }

  const ok = preview && !("error" in preview) ? preview : null;

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Scale className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-base">Dekesman sik la</CardTitle>
            <CardDescription>
              Gade previzyon an anvan w fèmen sik la epi remèt lajan yo.
            </CardDescription>
          </div>
        </div>

        <Button
          onClick={onPreview}
          disabled={pending}
          variant={ok ? "outline" : "default"}
          className="h-11 gap-2 font-semibold"
        >
          {pending && !ok ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Ap kalkile...
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4" />
              {ok ? "Aktyalize previzyon an" : "Wè previzyon dekesman an"}
            </>
          )}
        </Button>
      </CardHeader>

      {/* Mesaj siksè / erè */}
      {(message || (preview && "error" in preview)) && (
        <div className="px-6 pb-4">
          {message && (
            <div
              role="status"
              className={cn(
                "flex items-start gap-2 rounded-lg border p-3 text-sm",
                message.ok
                  ? "border-foreground/20 bg-foreground/5 text-foreground"
                  : "border-primary/30 bg-primary/10 text-primary"
              )}
            >
              {message.ok ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <p>{message.text}</p>
            </div>
          )}
          {preview && "error" in preview && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{preview.error}</p>
            </div>
          )}
        </div>
      )}

      {ok && (
        <>
          <Separator />

          {/* Rezime total yo */}
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                Sik: <span className="font-semibold text-foreground">{ok.cycleName}</span>
              </p>
              <Badge variant="outline">Previzyon</Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MiniStat
                label="Total enterè kolekte"
                value={`${fmt(ok.totals.interest)} HTG`}
                icon={Landmark}
                tone="bg-primary/10 text-primary"
              />
              <MiniStat
                label="Pati ekip la (25%)"
                value={`${fmt(ok.totals.team)} HTG`}
                icon={Users}
              />
              <MiniStat
                label="Pot tout manm yo (25%)"
                value={`${fmt(ok.totals.pool)} HTG`}
                icon={UsersRound}
                tone="bg-muted text-muted-foreground"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Pwa total pou pot la: <span className="font-medium">{fmt(ok.totals.weight)} HTG</span>
              {ok.totals.remainder > 0 && (
                <>
                  {" · "}Rès santim ki ale nan kès ekip la:{" "}
                  <span className="font-medium">{fmt(ok.totals.remainder)} HTG</span>
                </>
              )}
            </p>
          </CardContent>

          <Separator />

          {/* Tablo manm yo */}
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Manm</TableHead>
                  <TableHead className="text-right">Aksyon</TableHead>
                  <TableHead className="text-right">Depo inisyal</TableHead>
                  <TableHead className="text-right">
                    <span className="inline-flex items-center gap-1">
                      <HandCoins className="h-3.5 w-3.5" />
                      Pati pre (50%)
                    </span>
                  </TableHead>
                  <TableHead className="text-right">Pati manm (25%)</TableHead>
                  <TableHead className="pr-4 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ok.rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="pl-4">
                      <div className="leading-tight">
                        <p className="whitespace-nowrap font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {fmt(r.shares)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {fmt(r.initial)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(r.borrowerShare)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(r.poolShare)}</TableCell>
                    <TableCell className="whitespace-nowrap pr-4 text-right font-semibold tabular-nums">
                      {fmt(r.total)} HTG
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>

          <Separator />

          {/* Konfimasyon */}
          <div className="flex flex-col gap-3 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4 shrink-0 text-primary" />
              Aksyon sa a pa ka anile.
            </p>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={pending} className="h-11 gap-2 font-semibold">
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Ap fè dekesman...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Konfime dekesman an
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    Konfime dekesman an
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Dekesman an pa ka anile. Sa ap fèmen sik la epi remèt tout lajan yo. Ou sèten
                    ou vle kontinye?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anile</AlertDialogCancel>
                  <AlertDialogAction onClick={onConfirm}>Wi, fè dekesman an</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </>
      )}
    </Card>
  );
}