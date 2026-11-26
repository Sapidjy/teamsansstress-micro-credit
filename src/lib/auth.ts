import { redirect } from "next/navigation";
import { db } from "./db";
import { getSession } from "./session";

export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || user.status !== "ACTIVE") redirect("/login");
  if (user.role !== "ADMIN") redirect("/group");

  return user;
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || user.status !== "ACTIVE") redirect("/login");
  if (user.role === "TEAM") redirect("/");
  return user;
}