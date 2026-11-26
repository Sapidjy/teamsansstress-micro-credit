import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { displayPhone } from "@/lib/phone";
import PinForm from "./pin-form";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const instant = false;

export default async function ProfilePage() {
  const user = await requireUser();
  const back = user.role === "ADMIN" ? "/admin" : "/group";

  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <Link
        href={back}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="size-4" />
        Retounen
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Pwofil mwen</CardTitle>
          <CardDescription>Enfòmasyon kont ou a.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            Non: <b>{user.name}</b>
          </p>
          {user.code && (
            <p>
              Kòd: <b className="font-mono">{user.code}</b>
            </p>
          )}
          <p>
            Telefòn: <b>+509 {displayPhone(user.phone)}</b>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chanje PIN</CardTitle>
          <CardDescription>
            Antre PIN aktyèl ou a, epi chwazi yon nouvo. Pa pataje PIN ou ak pesonn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PinForm />
        </CardContent>
      </Card>
    </main>
  );
}