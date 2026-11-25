
"use client";

import { useActionState, useEffect, useRef } from "react";
import { recordShares } from "./actions";

import {
  CalendarDays,
  CheckCircle2,
  Clock,
  HandCoins,
  Loader2,
  Phone,
  Users,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Input,
} from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Member = {
  id: string;
  name: string;
  phone: string;
};

export default function ShareForm({
  members,
  currentMonday,
  amount,
}: {
  members: Member[];
  currentMonday: string;
  amount: number;
}) {
  const [state, action, pending] = useActionState(
    recordShares,
    undefined
  );

  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      ref.current?.reset();
    }
  }, [state]);

  const formattedAmount = amount.toLocaleString("fr-HT");

  return (
    <Card className="overflow-hidden shadow-sm">
      {/* Header */}
      <CardHeader className="border-b bg-muted/20 px-4 py-4 sm:px-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HandCoins className="size-5" />
            </div>

            <div className="space-y-1">
              <CardTitle className="text-base">
                Nouvo kontribisyon
              </CardTitle>

              <CardDescription className="text-xs">
                Anrejistre aksyon yon manm pou youn oswa plizyè semèn.
              </CardDescription>
            </div>
          </div>

          <Badge variant="secondary" className="w-fit gap-1.5">
            <Users className="size-3.5" />
            {members.length} manm aktif
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-4 sm:p-6">
        {/* Amount information */}
        <div className="flex flex-col justify-between gap-3 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-background text-primary shadow-sm">
              <Wallet className="size-4" />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Kontribisyon obligatwa pa semèn
              </p>

              <p className="text-lg font-bold tabular-nums">
                {formattedAmount} HTG
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            <span>Semèn aktyèl: {currentMonday}</span>
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
                Chwazi manm
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
                <Users className="mr-1 inline size-3" />
                Chwazi manm ki pral fè kontribisyon an.
              </p>
            </div>

            {/* Week date */}
            <div className="space-y-2">
              <Label htmlFor="weekOf">
                Premye lendi
                <span className="ml-1 text-destructive">*</span>
              </Label>

              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="weekOf"
                  name="weekOf"
                  type="date"
                  defaultValue={currentMonday}
                  required
                  className="h-10 pl-9"
                />
              </div>

              <p className="text-[11px] text-muted-foreground">
                Dat premye semèn kontribisyon an.
              </p>
            </div>

            {/* Number of weeks */}
            <div className="space-y-2">
              <Label htmlFor="weeks">
                Kantite semèn
                <span className="ml-1 text-destructive">*</span>
              </Label>

              <div className="relative">
                <Clock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="weeks"
                  name="weeks"
                  type="number"
                  min={1}
                  max={12}
                  defaultValue={1}
                  required
                  className="h-10 pl-9"
                />
              </div>

              <p className="text-[11px] text-muted-foreground">
                Ou ka anrejistre jiska 12 semèn alafwa.
              </p>
            </div>

            {/* Amount preview */}
            <div className="space-y-2">
              <Label>Montan total</Label>

              <div className="flex h-10 items-center justify-between rounded-md border bg-muted/30 px-3">
                <span className="text-xs text-muted-foreground">
                  Selon kantite semèn
                </span>

                <span className="font-bold tabular-nums">
                  {formattedAmount} HTG
                </span>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Montan an ap depann de kantite semèn ou chwazi.
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
                Aksyon yo anrejistre avèk siksè.
              </AlertDescription>
            </Alert>
          )}

          {/* Submit */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-muted-foreground">
              <Phone className="mr-1 inline size-3" />
              Verifye enfòmasyon manm nan anvan ou valide.
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
                  <HandCoins className="size-4" />
                  Anrejistre kontribisyon
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
