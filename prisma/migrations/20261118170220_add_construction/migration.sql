-- CreateEnum
CREATE TYPE "ConstructionTrade" AS ENUM ('MASON', 'CARPENTER', 'TILER', 'ELECTRICIAN', 'PLUMBER', 'GUTTER_INSTALLER', 'PAINTER', 'GLAZIER', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'BANK_TRANSFER', 'BOLETO');

-- AlterEnum
ALTER TYPE "TransactionCategory" ADD VALUE 'CONSTRUCTION';

-- CreateTable
CREATE TABLE "construction_project" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "startDate" DATE,
    "plannedEndDate" DATE,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "construction_project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construction_area" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "construction_area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construction_phase" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" VARCHAR(60),
    "projectId" TEXT NOT NULL,

    CONSTRAINT "construction_phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construction_service" (
    "id" TEXT NOT NULL,
    "trade" "ConstructionTrade" NOT NULL,
    "professionalName" VARCHAR(80),
    "description" VARCHAR(120) NOT NULL,
    "contractedCents" INTEGER NOT NULL,
    "notes" VARCHAR(500),
    "projectId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "areaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "construction_service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_payment" (
    "id" TEXT NOT NULL,
    "paidOn" DATE NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "notes" VARCHAR(500),
    "serviceId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,

    CONSTRAINT "service_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_purchase" (
    "id" TEXT NOT NULL,
    "item" VARCHAR(120) NOT NULL,
    "supplier" VARCHAR(80),
    "purchasedOn" DATE NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "installmentsCount" INTEGER NOT NULL,
    "notes" VARCHAR(500),
    "projectId" TEXT NOT NULL,
    "areaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_installment" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "dueOn" DATE NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "paidOn" DATE,
    "purchaseId" TEXT NOT NULL,
    "transactionId" TEXT,

    CONSTRAINT "material_installment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construction_goal" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "doneAt" DATE,
    "position" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT NOT NULL,
    "areaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "construction_goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "construction_project_ownerId_name_key" ON "construction_project"("ownerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "construction_area_projectId_name_key" ON "construction_area"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "construction_phase_projectId_number_key" ON "construction_phase"("projectId", "number");

-- CreateIndex
CREATE INDEX "construction_service_projectId_phaseId_idx" ON "construction_service"("projectId", "phaseId");

-- CreateIndex
CREATE UNIQUE INDEX "service_payment_transactionId_key" ON "service_payment"("transactionId");

-- CreateIndex
CREATE INDEX "service_payment_serviceId_paidOn_idx" ON "service_payment"("serviceId", "paidOn");

-- CreateIndex
CREATE INDEX "material_purchase_projectId_purchasedOn_idx" ON "material_purchase"("projectId", "purchasedOn");

-- CreateIndex
CREATE UNIQUE INDEX "material_installment_transactionId_key" ON "material_installment"("transactionId");

-- CreateIndex
CREATE INDEX "material_installment_dueOn_idx" ON "material_installment"("dueOn");

-- CreateIndex
CREATE UNIQUE INDEX "material_installment_purchaseId_number_key" ON "material_installment"("purchaseId", "number");

-- CreateIndex
CREATE INDEX "construction_goal_projectId_position_idx" ON "construction_goal"("projectId", "position");

-- AddForeignKey
ALTER TABLE "construction_project" ADD CONSTRAINT "construction_project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_area" ADD CONSTRAINT "construction_area_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "construction_project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_phase" ADD CONSTRAINT "construction_phase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "construction_project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_service" ADD CONSTRAINT "construction_service_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "construction_project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_service" ADD CONSTRAINT "construction_service_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "construction_phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_service" ADD CONSTRAINT "construction_service_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "construction_area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_payment" ADD CONSTRAINT "service_payment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "construction_service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_payment" ADD CONSTRAINT "service_payment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_purchase" ADD CONSTRAINT "material_purchase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "construction_project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_purchase" ADD CONSTRAINT "material_purchase_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "construction_area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_installment" ADD CONSTRAINT "material_installment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "material_purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_installment" ADD CONSTRAINT "material_installment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_goal" ADD CONSTRAINT "construction_goal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "construction_project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_goal" ADD CONSTRAINT "construction_goal_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "construction_area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
