
"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  Users,
  UserRound,
  CalendarDays,
  Coins,
  Hash,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  PiggyBank,
  CalendarClock,
} from "lucide-react";

import { recordShares } from "./actions";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Member = {
  id: string;
  code: string | null;
  name: string;
  phone: string;
};

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

  const formatAmount = (amount: number) =>
    amount.toLocaleString("fr-HT");

  return (
    <Card className="overflow-hidden shadow-sm">
      {/* Header */}
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4 sm:p-6">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <PiggyBank className="size-5" />
        </div>

        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">
            Anrejistre aksyon manm
          </CardTitle>

          <CardDescription className="text-xs sm:text-sm">
            Anrejistre kontribisyon yon manm pou youn oswa plizyè semèn.
          </CardDescription>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="p-4 sm:p-6">
        <form
          ref={ref}
          action={action}
          className="space-y-5"
        >
          {/* Enfòmasyon sou kontribisyon */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />

              <h3 className="text-sm font-semibold">
                Enfòmasyon kontribisyon an
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Manm */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="userId">
                  Chwazi yon manm
                </Label>

                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />

                  <select
                    id="userId"
                    name="userId"
                    required
                    disabled={pending || members.length === 0}
                    defaultValue=""
                    className="flex h-11 w-full appearance-none rounded-md border border-input bg-background pl-10 pr-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>
                      Chwazi yon manm
                    </option>

                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.code ? `${member.code} · ` : ""}
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-xs text-muted-foreground">
                  Chwazi manm ou vle anrejistre kontribisyon li a.
                </p>
              </div>

              {/* Montan */}
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Montan chak semèn (HTG)
                </Label>

                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    inputMode="numeric"
                    min={min}
                    max={max}
                    step={1}
                    defaultValue={min}
                    required
                    disabled={pending}
                    className="h-11 pl-10"
                    placeholder="Antre montan an"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Ant {formatAmount(min)} ak {formatAmount(max)} HTG.
                </p>
              </div>

              {/* Premye lendi */}
              <div className="space-y-2">
                <Label htmlFor="weekOf">
                  Premye lendi
                </Label>

                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />

                  <Input
                    id="weekOf"
                    name="weekOf"
                    type="date"
                    defaultValue={currentMonday}
                    required
                    disabled={pending}
                    className="h-11 pl-10"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Chwazi dat premye semèn kontribisyon an.
                </p>
              </div>

              {/* Kantite semèn */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="weeks">
                  Kantite semèn
                </Label>

                <div className="relative">
                  <CalendarClock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="weeks"
                    name="weeks"
                    type="number"
                    min={1}
                    max={12}
                    step={1}
                    defaultValue={1}
                    required
                    disabled={pending}
                    className="h-11 pl-10"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Ou ka anrejistre ant 1 ak 12 semèn an menm tan.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Règ kontribisyon */}
          <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Hash className="size-4" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold">
                Règ kontribisyon
              </p>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Montan chak semèn dwe ant{" "}
                <span className="font-semibold text-foreground">
                  {formatAmount(min)} HTG
                </span>{" "}
                ak{" "}
                <span className="font-semibold text-foreground">
                  {formatAmount(max)} HTG
                </span>
                . Si ou chwazi plizyè semèn, menm montan an ap aplike pou chak semèn.
              </p>
            </div>
          </div>

          {/* Feedback */}
          {state?.error && (
            <Alert variant="destructive" role="alert">
              <AlertTriangle className="size-4" />

              <AlertDescription className="text-sm">
                {state.error}
              </AlertDescription>
            </Alert>
          )}

          {state?.success && (
            <Alert className="border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400">
              <CheckCircle2 className="size-4" />

              <AlertDescription className="text-sm font-medium">
                Aksyon yo anrejistre avèk siksè!
              </AlertDescription>
            </Alert>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={pending || members.length === 0}
            className="h-11 w-full gap-2 font-semibold"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Ap anrejistre aksyon yo...
              </>
            ) : (
              <>
                <PiggyBank className="size-4" />
                Anrejistre aksyon an
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Verifye manm nan, montan an ak kantite semèn yo anvan ou anrejistre.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
