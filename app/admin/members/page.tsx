
import { db } from "../../../src/lib/db";
import { requireAdmin } from "../../../src/lib/auth";

import MemberForm from "./member-form";
import { toggleStatus, resetPin } from "./actions";

import {
  Users,
  UserCheck,
  UserX,
  Wallet,
  ShieldCheck,
  Phone,
  KeyRound,
  UserRound,
  RefreshCw,
  UserPlus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

import { cn } from "@/lib/utils";

export const instant = false;

const fmt = (n: number) =>
  n.toLocaleString("fr-HT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function StatCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            {label}
          </p>

          <p className="text-xl font-bold tracking-tight tabular-nums">
            {value}
          </p>

          <p className="text-[11px] text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default async function MembersPage() {
  const admin = await requireAdmin();

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { account: true },
  });

  const activeMembers = users.filter(
    (u) => u.status === "ACTIVE"
  ).length;

  const inactiveMembers = users.length - activeMembers;

  const totalBalance = users.reduce(
    (total, u) =>
      total + Number(u.account?.balance ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="size-5" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight">
              Jesyon manm
            </h1>
          </div>

          <p className="text-sm text-muted-foreground">
            Jere manm yo, kont yo, balans yo ak aksè yo.
          </p>
        </div>

        <Badge variant="outline" className="w-fit gap-1.5 py-1.5">
          <Users className="size-3.5" />
          {users.length} manm anrejistre
        </Badge>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Total manm"
          value={String(users.length)}
          description="Tout manm anrejistre"
          icon={Users}
        />

        <StatCard
          label="Manm aktif"
          value={String(activeMembers)}
          description="Kont ki disponib"
          icon={UserCheck}
        />

        <StatCard
          label="Manm inaktif"
          value={String(inactiveMembers)}
          description="Kont ki dezaktive"
          icon={UserX}
        />

        <StatCard
          label="Balans total"
          value={`${fmt(totalBalance)} HTG`}
          description="Total lajan nan kont manm yo"
          icon={Wallet}
        />
      </div>

      {/* Add Member */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <UserPlus className="size-4 text-primary" />

          <h2 className="text-sm font-semibold">
            Nouvo manm
          </h2>
        </div>

        <MemberForm />
      </section>

      {/* Members Table */}
      <section className="space-y-3">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight">
              Lis manm yo
            </h2>

            <p className="text-xs text-muted-foreground">
              Tout enfòmasyon ak aksyon ki disponib pou chak manm.
            </p>
          </div>

          <Badge variant="secondary" className="w-fit">
            {users.length} rezilta
          </Badge>
        </div>

        <Card className="overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="min-w-[200px]">
                    Manm
                  </TableHead>

                  <TableHead className="min-w-[140px]">
                    Telefòn
                  </TableHead>

                  <TableHead>Wòl</TableHead>

                  <TableHead className="text-right">
                    Balans
                  </TableHead>

                  <TableHead>Estati</TableHead>

                  <TableHead className="min-w-[280px] text-right">
                    Aksyon
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-40 text-center"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Users className="size-8 text-muted-foreground" />

                        <p className="text-sm font-medium">
                          Pa gen manm ankò
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Ajoute premye manm nan avèk fòm ki anlè a.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => {
                    const isActive = u.status === "ACTIVE";
                    const isAdmin = u.id === admin.id;

                    return (
                      <TableRow key={u.id}>
                        {/* Manm */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9 shrink-0">
                              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                {initialsOf(u.name)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 space-y-0.5">
                              <p className="max-w-[180px] truncate text-sm font-semibold">
                                {u.name}
                              </p>

                              <p className="text-[11px] text-muted-foreground">
                                Manm TSS-MK
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Telefòn */}
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="size-3.5 shrink-0" />

                            {u.phone}
                          </div>
                        </TableCell>

                        {/* Wòl */}
                        <TableCell>
                          <Badge
                            variant={
                              u.role === "ADMIN"
                                ? "default"
                                : "secondary"
                            }
                            className="font-medium"
                          >
                            {u.role}
                          </Badge>
                        </TableCell>

                        {/* Balans */}
                        <TableCell className="text-right">
                          <span className="font-semibold tabular-nums">
                            {fmt(
                              Number(u.account?.balance ?? 0)
                            )}
                          </span>

                          <span className="ml-1 text-xs text-muted-foreground">
                            HTG
                          </span>
                        </TableCell>

                        {/* Estati */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "gap-1.5 font-medium",
                              isActive
                                ? "border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400"
                                : "border-destructive/30 bg-destructive/5 text-destructive"
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                isActive
                                  ? "bg-green-500"
                                  : "bg-destructive"
                              )}
                            />

                            {isActive ? "Aktif" : "Inaktif"}
                          </Badge>
                        </TableCell>

                        {/* Aksyon */}
                        <TableCell>
                          <div className="flex flex-col items-end gap-2">
                            {/* Reset PIN */}
                            <form
                              action={resetPin}
                              className="flex w-full items-center justify-end gap-1.5"
                            >
                              <input
                                type="hidden"
                                name="id"
                                value={u.id}
                              />

                              <Input
                                name="pin"
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]{4,6}"
                                minLength={4}
                                maxLength={6}
                                placeholder="Nouvo PIN"
                                autoComplete="new-password"
                                required
                                className="h-8 w-28 text-xs"
                              />

                              <Button
                                type="submit"
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 px-2.5 text-xs"
                              >
                                <KeyRound className="size-3.5" />

                                Chanje PIN
                              </Button>
                            </form>

                            {/* Toggle Status */}
                            {!isAdmin && (
                              <form action={toggleStatus}>
                                <input
                                  type="hidden"
                                  name="id"
                                  value={u.id}
                                />

                                <Button
                                  type="submit"
                                  size="sm"
                                  variant="ghost"
                                  className={cn(
                                    "h-8 gap-1.5 px-2.5 text-xs",
                                    isActive
                                      ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                                      : "text-green-700 hover:bg-green-500/10 hover:text-green-700 dark:text-green-400"
                                  )}
                                >
                                  {isActive ? (
                                    <>
                                      <UserX className="size-3.5" />
                                      Dezaktive
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="size-3.5" />
                                      Aktive
                                    </>
                                  )}
                                </Button>
                              </form>
                            )}

                            {isAdmin && (
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <ShieldCheck className="size-3.5" />
                                Kont administratè
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <Separator />

          <div className="flex flex-col justify-between gap-2 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <p>
              Total: {users.length} manm
            </p>

            <p className="flex items-center gap-1.5">
              <RefreshCw className="size-3" />
              Dènye manm yo parèt an premye
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
