"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Landmark, Loader2, Lock, Phone, TriangleAlert } from "lucide-react";

import { login } from "./actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  const [showPin, setShowPin] = useState(false);

  return (
    <main className="flex min-h-screen flex-col bg-muted/40">
      {/* Anlè nwa ak aksan wouj */}
      <div className="relative overflow-hidden bg-neutral-950 px-6 pb-24 pt-14 text-white">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/30 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="relative mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
          <div className="flex h-37 w-37 items-center justify-center rounded-full bg-white shadow-xl shadow-primary/50 ring-1 ring-white/10">
            {/* <Landmark className="h-7 w-7 text-primary-foreground" /> */}
            <Image src={"/logo_tss.png"} alt="Logo TSS" width={170} height={170} className="absolute" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Byenvini nan Team Sans Stress Micro-Crédit</h1>
          <p className="text-sm text-white/70">
            Konekte pou w jere kont ou an sekirite.
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-primary" />
      </div>

      {/* Kat fòm nan */}
      <div className="-mt-14 flex flex-1 justify-center px-4 pb-10">
        <Card className="h-fit w-full max-w-sm shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl">Konekte</CardTitle>
            <CardDescription>
              Antre nimewo telefòn ak PIN ou.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form action={action} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="phone">Nimewo telefòn</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    placeholder="509XXXXXXXX"
                    className="h-12 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin">PIN</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="pin"
                    name="pin"
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={6}
                    required
                    autoComplete="current-password"
                    placeholder="••••••"
                    className="h-12 pl-10 pr-11 tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((v) => !v)}
                    aria-label={showPin ? "Kache PIN" : "Montre PIN"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {state?.error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary"
                >
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{state.error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={pending}
                className="h-12 w-full text-base font-semibold"
              >
                {pending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ap konekte...
                  </>
                ) : (
                  "Konekte"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}