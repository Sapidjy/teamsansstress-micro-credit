"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Loader2,
  LockKeyhole,
} from "lucide-react";

import { changePin } from "./actions";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function PinField({
  id,
  label,
  autoComplete,
  disabled,
}: {
  id: string;
  label: string;
  autoComplete: string;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          name={id}
          type="password"
          inputMode="numeric"
          pattern="[0-9]{4,6}"
          minLength={4}
          maxLength={6}
          autoComplete={autoComplete}
          required
          disabled={disabled}
          className="h-11 pl-10 tracking-widest"
        />
      </div>
    </div>
  );
}

export default function PinForm() {
  const [state, action, pending] = useActionState(changePin, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-4">
      <PinField id="currentPin" label="PIN aktyèl" autoComplete="current-password" disabled={pending} />
      <PinField id="newPin" label="Nouvo PIN (4 a 6 chif)" autoComplete="new-password" disabled={pending} />
      <PinField id="confirmPin" label="Konfime nouvo PIN" autoComplete="new-password" disabled={pending} />

      {state?.error && (
        <Alert variant="destructive" role="alert">
          <AlertTriangle className="size-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state?.success && (
        <Alert className="border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400">
          <CheckCircle2 className="size-4" />
          <AlertDescription className="font-medium">
            PIN ou chanje avèk siksè.
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={pending} className="h-11 w-full gap-2 font-semibold">
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Ap chanje...
          </>
        ) : (
          <>
            <KeyRound className="size-4" />
            Chanje PIN mwen
          </>
        )}
      </Button>
    </form>
  );
}