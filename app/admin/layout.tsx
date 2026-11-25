import Link from "next/link";
import { requireAdmin } from "../../src/lib/auth";
import { logout } from "../login/actions";
import { BottomNav } from "@/components/bottom-nav";
import { AdminNav } from "@/components/admin-nav";

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav adminName={admin.name} logoutAction={logout} />
      <div className="max-w-5xl mx-auto p-4">{children}</div>
      <BottomNav />
    </div>
  );
}