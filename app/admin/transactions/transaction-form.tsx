
"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTransaction } from "./actions";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Loader2,
  LockKeyhole,
  ReceiptText,
  UserRound,
  Wallet,
  AlertCircle,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type Member = {
  id: string;
  name: string;
  phone: string;
};

export default function TransactionForm({
  members,
}: {
  members: Member[];
}) {
  const [state, action, pending] = useActionState(
    createTransaction,
    undefined
  );

  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      ref.current?.reset();
    }
  }, [state]);

  return (
    <Card className="overflow-hidden shadow-sm">
      {/* Header */}
      <CardHeader className="border-b bg-muted/20 px-4 py-4 sm:px-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CircleDollarSign className="size-5" />
            </div>

            <div className="space-y-1">
              <CardTitle className="text-base">
                Nouvo tranzaksyon
              </CardTitle>

              <CardDescription className="text-xs">
                Anrejistre yon depo oswa yon retrè sou kont yon manm.
              </CardDescription>
            </div>
          </div>

          <Badge variant="secondary" className="w-fit gap-1.5">
            <UserRound className="size-3.5" />
            {members.length} manm aktif
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-4 sm:p-6">
        {/* Information */}
        <div className="flex items-start gap-3 rounded-xl border bg-muted/20 p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary shadow-sm">
            <ReceiptText className="size-4" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold">
              Enfòmasyon sou operasyon an
            </p>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Verifye manm nan, kalite tranzaksyon an ak montan an
              anvan ou valide operasyon an.
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          ref={ref}
          action={action}
          className="space-y-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            {/* Member */}
            <div className="space-y-2">
              <Label htmlFor="userId">
                Manm
                <span className="ml-1 text-destructive">*</span>
              </Label>

              <Select name="userId" required>
                <SelectTrigger id="userId" className="h-10 w-full">
                  <SelectValue placeholder="Chwazi yon manm..." />
                </SelectTrigger>

                <SelectContent>
                  {members.map((member) => (
                    <SelectItem
                      key={member.id}
                      value={member.id}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">
                          {member.name}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {member.phone}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="text-[11px] text-muted-foreground">
                Chwazi kont manm ki konsène a.
              </p>
            </div>

            {/* Transaction type */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Kalite tranzaksyon
                <span className="ml-1 text-destructive">*</span>
              </Label>

              <Select name="type" defaultValue="DEPOSIT" required>
                <SelectTrigger id="type" className="h-10 w-full">
                  <SelectValue placeholder="Chwazi yon kalite..." />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="DEPOSIT">
                    <div className="flex items-center gap-2">
                      <ArrowDownToLine className="size-4 text-green-600" />
                      Depo
                    </div>
                  </SelectItem>

                  <SelectItem value="INITIAL_DEPOSIT">
                    <div className="flex items-center gap-2">
                      <LockKeyhole className="size-4 text-blue-600" />
                      Depo inisyal (bloke)
                    </div>
                  </SelectItem>

                  <SelectItem value="WITHDRAWAL">
                    <div className="flex items-center gap-2">
                      <ArrowUpFromLine className="size-4 text-red-600" />
                      Retrè
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <p className="text-[11px] text-muted-foreground">
                Chwazi operasyon finansye ou vle anrejistre a.
              </p>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Montan (HTG)
                <span className="ml-1 text-destructive">*</span>
              </Label>

              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  placeholder="Antre montan an"
                  required
                  className="h-10 pl-9"
                />
              </div>

              <p className="text-[11px] text-muted-foreground">
                Antre kantite lajan an an goud ayisyen.
              </p>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">
                Nòt
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  Opsyonèl
                </Badge>
              </Label>

              <div className="relative">
                <FileText className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="note"
                  name="note"
                  placeholder="Ajoute yon detay..."
                  maxLength={200}
                  className="h-10 pl-9"
                />
              </div>

              <p className="text-[11px] text-muted-foreground">
                Maksimòm 200 karaktè.
              </p>
            </div>
          </div>

          <Separator />

          {/* Feedback */}
          {state?.error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />

              <AlertDescription>
                {state.error}
              </AlertDescription>
            </Alert>
          )}

          {state?.success && (
            <Alert className="border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400">
              <CheckCircle2 className="size-4" />

              <AlertDescription>
                Tranzaksyon an anrejistre avèk siksè.
              </AlertDescription>
            </Alert>
          )}

          {/* Submit */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-muted-foreground">
              <LockKeyhole className="mr-1 inline size-3" />
              Operasyon sa a dwe verifye anvan validasyon.
            </p>

            <Button
              type="submit"
              disabled={pending || members.length === 0}
              className="h-10 w-full gap-2 sm:w-auto"
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Ap anrejistre...
                </>
              ) : (
                <>
                  <CircleDollarSign className="size-4" />
                  Anrejistre tranzaksyon
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
