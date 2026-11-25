"use client";

import { useActionState } from "react";
import { Check, Loader2, X } from "lucide-react";

import { approveLoan, rejectLoan } from "./actions";
import { Button } from "@/components/ui/button";

export function LoanActions({ id }: { id: string }) {
  const [approveState, approveAction, approving] = useActionState(approveLoan, undefined);
  const [rejectState, rejectAction, rejecting] = useActionState(rejectLoan, undefined);
  const busy = approving || rejecting;
  const error = approveState?.error ?? rejectState?.error;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <form action={approveAction} className="contents">
          <input type="hidden" name="id" value={id} />
          <Button type="submit" disabled={busy} className="h-10 gap-1.5 font-semibold">
            {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Apwouve
          </Button>
        </form>
        <form action={rejectAction} className="contents">
          <input type="hidden" name="id" value={id} />
          <Button type="submit" variant="outline" disabled={busy} className="h-10 gap-1.5">
            {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Rejte
          </Button>
        </form>
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-primary">
          {error}
        </p>
      )}
    </div>
  );
}