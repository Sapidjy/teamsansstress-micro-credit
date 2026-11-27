"use client";

import { useActionState } from "react";
import { Check, Loader2, X } from "lucide-react";

import { approveLoan, rejectLoan, type DecisionState } from "./actions";
import { Button } from "@/components/ui/button";

async function decide(prev: DecisionState, formData: FormData): Promise<DecisionState> {
  return formData.get("intent") === "reject"
    ? rejectLoan(prev, formData)
    : approveLoan(prev, formData);
}

export function LoanActions({ id }: { id: string }) {
  const [state, action, pending] = useActionState(decide, undefined);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button
          type="submit"
          name="intent"
          value="approve"
          disabled={pending}
          className="h-10 gap-1.5 font-semibold"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Apwouve
        </Button>
        <Button
          type="submit"
          name="intent"
          value="reject"
          variant="outline"
          disabled={pending}
          className="h-10 gap-1.5"
        >
          <X className="h-4 w-4" />
          Rejte
        </Button>
      </div>
      {state?.error && (
        <p role="alert" className="text-xs font-medium text-primary">
          {state.error}
        </p>
      )}
    </form>
  );
}

// "use client";

// import { useActionState } from "react";
// import { Check, Loader2, X } from "lucide-react";

// import { approveLoan, rejectLoan } from "./actions";
// import { Button } from "@/components/ui/button";

// export function LoanActions({ id }: { id: string }) {
//   const [approveState, approveAction, approving] = useActionState(approveLoan, undefined);
//   const [rejectState, rejectAction, rejecting] = useActionState(rejectLoan, undefined);
//   const busy = approving || rejecting;
//   const error = approveState?.error ?? rejectState?.error;

//   return (
//     <div className="space-y-2">
//       <div className="grid grid-cols-2 gap-2 sm:flex">
//         <form action={approveAction} className="contents">
//           <input type="hidden" name="id" value={id} />
//           <Button type="submit" disabled={busy} className="h-10 gap-1.5 font-semibold">
//             {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
//             Apwouve
//           </Button>
//         </form>
//         <form action={rejectAction} className="contents">
//           <input type="hidden" name="id" value={id} />
//           <Button type="submit" variant="outline" disabled={busy} className="h-10 gap-1.5">
//             {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
//             Rejte
//           </Button>
//         </form>
//       </div>
//       {error && (
//         <p role="alert" className="text-xs font-medium text-primary">
//           {error}
//         </p>
//       )}
//     </div>
//   );
// }