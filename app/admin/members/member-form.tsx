
"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  UserPlus,
  UserRound,
  Phone,
  LockKeyhole,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Users,
  Hash,
} from "lucide-react";

import { createMember } from "./actions";

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

export default function MemberForm({ nextCode }: { nextCode: string }) {
  const [state, action, pending] = useActionState(
    createMember,
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
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4 sm:p-6">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UserPlus className="size-5" />
        </div>

        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">
            Ajoute yon nouvo manm
          </CardTitle>

          <CardDescription className="text-xs sm:text-sm">
            Ranpli enfòmasyon yo pou kreye kont manm nan.
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
          {/* Enfòmasyon pèsonèl */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />

              <h3 className="text-sm font-semibold">
                Enfòmasyon pèsonèl
              </h3>
            </div>

            {/* Kòd */}
            <div className="space-y-2">
              <Label htmlFor="code">Kòd (opsyonèl)</Label>

              <div className="relative">
                <Hash className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="code"
                  name="code"
                  type="text"
                  placeholder={`Otomatik: ${nextCode}`}
                  autoComplete="off"
                  disabled={pending}
                  className="h-11 pl-10 uppercase placeholder:normal-case"
                  readOnly
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Kite l vid pou sistèm nan bay <span className="font-mono">{nextCode}</span> otomatikman.
              </p>
            </div>

            {/* Non konplè */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Non konplè
              </Label>

              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Antre non konplè manm nan"
                  autoComplete="name"
                  required
                  disabled={pending}
                  className="h-11 pl-10"
                />
              </div>
            </div>

            {/* Telefòn */}
            <div className="space-y-2">
              <Label htmlFor="phone">Nimewo telefòn</Label>

              <div className="flex items-center gap-2">
                <span className="flex h-11 items-center gap-1.5 rounded-md border bg-muted px-3 text-sm text-muted-foreground select-none">
                  <Phone className="size-4" />
                  +509
                </span>

                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="XXXX XXXX"
                  maxLength={16}
                  required
                  disabled={pending}
                  className="h-11"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Antre sèlman 8 chif yo, san +509 (egzanp: 4114 9129).
              </p>
            </div>
          </div>

          <Separator />

          {/* Sekirite kont */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />

              <h3 className="text-sm font-semibold">
                Sekirite kont
              </h3>
            </div>

            {/* PIN */}
            <div className="space-y-2">
              <Label htmlFor="pin">
                Kòd PIN
              </Label>

              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="pin"
                  name="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{4,6}"
                  minLength={4}
                  maxLength={6}
                  placeholder="Antre yon PIN 4 a 6 chif"
                  autoComplete="new-password"
                  required
                  disabled={pending}
                  className="h-11 pl-10 tracking-widest"
                />
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                <p className="text-xs leading-relaxed text-muted-foreground">
                  PIN sa a ap sèvi pou sekirize kont manm nan.
                  Li dwe genyen ant 4 ak 6 chif.
                </p>
              </div>
            </div>
          </div>

          {/* Feedback */}
          {state?.error && (
            <Alert
              variant="destructive"
              role="alert"
            >
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
                Manm nan ajoute avèk siksè!
              </AlertDescription>
            </Alert>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={pending}
            className="h-11 w-full gap-2 font-semibold"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Ap ajoute manm nan...
              </>
            ) : (
              <>
                <UserPlus className="size-4" />
                Ajoute manm
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Verifye enfòmasyon yo anvan ou kreye kont manm nan.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
