"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Plus, HandCoins, PiggyBank, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/admin/members", label: "Manm", icon: Users, exact: true },
  { href: "/admin/shares", label: "Aksyon", icon: PiggyBank },
  { href: "/admin/transactions", label: "Tranzaksyon", icon: Plus, center: true },
  { href: "/admin/loans", label: "Pre", icon: HandCoins },
  { href: "/admin/cycle", label: "Dekesman", icon: CalendarClock },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex h-14 max-w-md items-center justify-around">
        {tabs.map(({ href, label, icon: Icon, center, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");

          if (center) {
            return (
              <li key={href} className="flex flex-1 justify-center">
                <Link
                  href={href}
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform active:scale-90"
                >
                  <Icon className="h-6 w-6" strokeWidth={2.5} />
                </Link>
              </li>
            );
          }

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 text-[10px] transition-transform active:scale-90",
                  active ? "font-semibold text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}