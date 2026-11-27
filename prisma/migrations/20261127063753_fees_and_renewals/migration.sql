/*
  Warnings:

  - A unique constraint covering the columns `[parentLoanId]` on the table `Loan` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "FeeKind" AS ENUM ('MEMBERSHIP', 'LATE_MEETING', 'PROXY_SHARE', 'MISSED_SHARE', 'INSTALLMENT', 'LOAN_PENALTY', 'LOAN_INTEREST');

-- AlterEnum
ALTER TYPE "LoanStatus" ADD VALUE 'RENEWED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'FEE_PAID';
ALTER TYPE "TransactionType" ADD VALUE 'TEAM_INCOME';

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "parentLoanId" TEXT,
ADD COLUMN     "renewalCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LoanPayout" ADD COLUMN     "penalty" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "feeKind" "FeeKind";

-- CreateIndex
CREATE UNIQUE INDEX "Loan_parentLoanId_key" ON "Loan"("parentLoanId");

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_parentLoanId_fkey" FOREIGN KEY ("parentLoanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
