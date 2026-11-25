"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  HandCoins,
  Home,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  Receipt,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/", label: "Akèy", icon: Home, exact: true },
  // { href: "/admin/members", label: "Manm", icon: Users },
  // { href: "/admin/shares", label: "Aksyon lendi", icon: PiggyBank },
  // { href: "/admin/loans", label: "Pre", icon: HandCoins },
  // { href: "/admin/cycle", label: "Sik / Dekesman", icon: CalendarClock },
];

type Props = {
  adminName: string;
  logoutAction: () => void | Promise<void>;
};

export function AdminNav({ adminName, logoutAction }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const initials = adminName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b bg-neutral-950 text-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
        {/* Meni mobil */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Louvri meni"
              className="text-white hover:bg-white/10 hover:text-white lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b p-4 text-left">
              <SheetTitle className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Landmark className="h-4 w-4" />
                </span>
                Admin
              </SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col gap-1 p-3">
              {links.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <Separator />
            <form action={logoutAction} className="p-3">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground hover:text-primary"
              >
                <LogOut className="h-5 w-5" />
                Dekonekte
              </Button>
            </form>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/admin" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Landmark className="h-4 w-4" />
          </span>
          <span className="font-bold tracking-tight">Admin</span>
        </Link>

        {/* Lyen desktop */}
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {links.map(({ href, label, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-white" : "text-white/60 hover:text-white"
                )}
              >
                {label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Itilizatè */}
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-xs font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-white/80">{adminName}</span>
          </div>
          <form action={logoutAction} className="hidden lg:block">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Dekonekte
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}