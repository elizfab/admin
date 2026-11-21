-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('SALARY', 'HOUSING', 'FOOD', 'TRANSPORT', 'HEALTH', 'EDUCATION', 'LEISURE', 'OTHER');

-- CreateTable
CREATE TABLE "transaction" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" VARCHAR(120) NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "category" "TransactionCategory" NOT NULL DEFAULT 'OTHER',
    "occurredOn" DATE NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transaction_ownerId_occurredOn_idx" ON "transaction"("ownerId", "occurredOn");

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
