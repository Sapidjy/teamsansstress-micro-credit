import { db } from "./db";

export async function markLateLoans() {
  await db.loan.updateMany({
    where: { status: "ACTIVE", dueDate: { lt: new Date() } },
    data: { status: "LATE" },
  });
}