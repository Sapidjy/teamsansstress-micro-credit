/*
  Warnings:

  - You are about to drop the column `months` on the `Loan` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[accountId,type,weekOf]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'SHARE';
ALTER TYPE "TransactionType" ADD VALUE 'DIVIDEND';

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "shares" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Loan" DROP COLUMN "months",
ADD COLUMN     "termDays" INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "weekOf" DATE;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_accountId_type_weekOf_key" ON "Transaction"("accountId", "type", "weekOf");
