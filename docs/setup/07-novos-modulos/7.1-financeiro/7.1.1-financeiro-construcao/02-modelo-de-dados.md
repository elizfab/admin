# Passo 02 — Modelo de dados

> **Fase:** 09 — Financeiro → Obra\
> **Tempo estimado:** 45 min\
> **Depende de:** [Passo 01](01-ficha-e-decisoes.md) (decisões confirmadas)

## Objetivo

Criar as 7 tabelas da obra, os enums de profissão e forma de pagamento, a
categoria "Obra" no Financeiro e as ligações entre pagamento e lançamento.

## 💡 O desenho, tabela por tabela

```text
User ─┬─ ConstructionProject (obra: "Lavanderia", início, fim previsto)
      │    ├── ConstructionArea   (ambientes: Geral, Banheiro, Escritório…)
      │    ├── ConstructionPhase  (Fase 01, Fase 02…)
      │    ├── ConstructionService (serviço contratado: fase, ambiente?, profissão,
      │    │      │                  profissional, descrição, valor contratado)
      │    │      └── ServicePayment (data, valor, forma) ──1:1──▶ Transaction
      │    ├── MaterialPurchase   (item, loja, data, total, forma, nº parcelas)
      │    │      └── MaterialInstallment (nº, vencimento, valor, pago em?) ──1:1──▶ Transaction
      │    └── ConstructionGoal   (meta, ambiente?, concluída em?)
      └─ Transaction (categoria CONSTRUCTION = "Obra")
```

| Decisão do modelo | 💡 Por quê |
|---|---|
| Só a obra tem `ownerId` | Uma regra de isolamento só: tudo é filtrado **pela obra da dona** (passo 05). Repetir `ownerId` em 7 tabelas abriria espaço para um esquecido |
| **Nada** de "total pago", "falta" ou "status" nas tabelas | São contas. 💡 Guardar uma conta é como escrever o saldo a lápis no extrato: na primeira correção ele fica errado. Calcular sempre é exato |
| `ServicePayment.transactionId` obrigatório e único | Todo pagamento **tem** seu lançamento no Financeiro, e um lançamento pertence a **um** pagamento |
| `MaterialInstallment.transactionId` opcional | A parcela só ganha lançamento **quando é paga** |
| `onDelete: Restrict` em pagamento → serviço | Não dá para apagar um serviço (ou a obra) que já tem dinheiro pago sem apagar os pagamentos antes |
| `onDelete: Cascade` em obra → ambientes, fases, compras, metas | São "partes" da obra |
| `onDelete: SetNull` em ambiente | Apagar o ambiente "Quartinho" não apaga os serviços dele; eles ficam sem ambiente |
| `@@unique([projectId, number])` na fase | Não existem duas "Fase 01" na mesma obra |

## Pré-requisitos

- Passo 01 concluído; banco local no ar (`npm run db:up`).
- Branch: `git checkout develop && git pull && git checkout -b feat/obra`.

## Passo a passo

### 1. `User`: a relação com as obras

```prisma
  projects             Project[]
  transactions         Transaction[]
  constructionProjects ConstructionProject[]
```

### 2. Financeiro: categoria "Obra" e ligações

No enum `TransactionCategory`, antes de `OTHER`:

```prisma
  LEISURE
  CONSTRUCTION
  OTHER
```

No modelo `Transaction`, depois da linha `owner User @relation(...)`:

```prisma
  // Preenchidos quando o lançamento foi GERADO pela obra (Fase 09).
  // Um lançamento gerado só é alterado pela página da obra.
  servicePayment      ServicePayment?
  materialInstallment MaterialInstallment?
```

### 3. As tabelas da obra (final do arquivo)

```prisma
// ─── Obra (Financeiro → Obra, Fase 09) ───────────────────────

enum ConstructionTrade {
  MASON // Pedreiro
  CARPENTER // Carpinteiro
  TILER // Azulejista
  ELECTRICIAN // Eletricista
  PLUMBER // Encanador
  GUTTER_INSTALLER // Calheiro
  PAINTER // Pintor
  GLAZIER // Vidraceiro (blindex)
  OTHER
}

enum PaymentMethod {
  PIX
  CASH
  DEBIT_CARD
  CREDIT_CARD
  BANK_TRANSFER
  BOLETO
}

/// Uma obra: "Lavanderia". Só ela tem ownerId; o resto herda a dona por ela.
model ConstructionProject {
  id             String    @id @default(cuid())
  name           String    @db.VarChar(80)
  startDate      DateTime? @db.Date
  plannedEndDate DateTime? @db.Date
  ownerId        String
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  owner     User                  @relation(fields: [ownerId], references: [id], onDelete: Restrict)
  areas     ConstructionArea[]
  phases    ConstructionPhase[]
  services  ConstructionService[]
  purchases MaterialPurchase[]
  goals     ConstructionGoal[]

  @@unique([ownerId, name])
  @@map("construction_project")
}

/// Ambiente da obra: "Geral", "Banheiro", "Escritório", "Área gourmet"…
model ConstructionArea {
  id        String @id @default(cuid())
  name      String @db.VarChar(60)
  projectId String

  project   ConstructionProject   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  services  ConstructionService[]
  purchases MaterialPurchase[]
  goals     ConstructionGoal[]

  @@unique([projectId, name])
  @@map("construction_area")
}

/// Fase da obra: número (01, 02…) e nome opcional ("Estrutura").
model ConstructionPhase {
  id        String  @id @default(cuid())
  number    Int
  name      String? @db.VarChar(60)
  projectId String

  project  ConstructionProject   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  services ConstructionService[]

  @@unique([projectId, number])
  @@map("construction_phase")
}

/// Serviço contratado (mão de obra). Pago, falta e status são CALCULADOS.
model ConstructionService {
  id               String            @id @default(cuid())
  trade            ConstructionTrade
  professionalName String?           @db.VarChar(80)
  description      String            @db.VarChar(120)
  contractedCents  Int
  notes            String?           @db.VarChar(500)
  projectId        String
  phaseId          String
  areaId           String?
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  project  ConstructionProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  phase    ConstructionPhase   @relation(fields: [phaseId], references: [id], onDelete: Restrict)
  area     ConstructionArea?   @relation(fields: [areaId], references: [id], onDelete: SetNull)
  payments ServicePayment[]

  @@index([projectId, phaseId])
  @@map("construction_service")
}

/// Pagamento a um profissional. Gera 1 lançamento (Transaction) no Financeiro.
model ServicePayment {
  id            String        @id @default(cuid())
  paidOn        DateTime      @db.Date
  amountCents   Int
  method        PaymentMethod
  notes         String?       @db.VarChar(500)
  serviceId     String
  transactionId String        @unique

  service     ConstructionService @relation(fields: [serviceId], references: [id], onDelete: Restrict)
  transaction Transaction         @relation(fields: [transactionId], references: [id], onDelete: Restrict)

  @@index([serviceId, paidOn])
  @@map("service_payment")
}

/// Compra de material. As parcelas são geradas na criação.
model MaterialPurchase {
  id                String        @id @default(cuid())
  item              String        @db.VarChar(120)
  supplier          String?       @db.VarChar(80)
  purchasedOn       DateTime      @db.Date
  totalCents        Int
  method            PaymentMethod
  installmentsCount Int
  notes             String?       @db.VarChar(500)
  projectId         String
  areaId            String?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  project      ConstructionProject   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  area         ConstructionArea?     @relation(fields: [areaId], references: [id], onDelete: SetNull)
  installments MaterialInstallment[]

  @@index([projectId, purchasedOn])
  @@map("material_purchase")
}

/// Parcela de uma compra. Paga = tem paidOn e um lançamento no Financeiro.
model MaterialInstallment {
  id            String    @id @default(cuid())
  number        Int
  dueOn         DateTime  @db.Date
  amountCents   Int
  paidOn        DateTime? @db.Date
  purchaseId    String
  transactionId String?   @unique

  purchase    MaterialPurchase @relation(fields: [purchaseId], references: [id], onDelete: Cascade)
  transaction Transaction?     @relation(fields: [transactionId], references: [id], onDelete: Restrict)

  @@unique([purchaseId, number])
  @@index([dueOn])
  @@map("material_installment")
}

/// Meta da obra (checklist), opcionalmente ligada a um ambiente.
model ConstructionGoal {
  id        String    @id @default(cuid())
  title     String    @db.VarChar(160)
  doneAt    DateTime? @db.Date
  position  Int       @default(0)
  projectId String
  areaId    String?
  createdAt DateTime  @default(now())

  project ConstructionProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  area    ConstructionArea?   @relation(fields: [areaId], references: [id], onDelete: SetNull)

  @@index([projectId, position])
  @@map("construction_goal")
}
```

### 4. Migration e client

```bash
npx prisma format
npx prisma migrate dev --name add_construction
npm run db:generate
```

O SQL gerado (o nome da pasta terá outra data):

`prisma/migrations/20261118162418_add_construction/migration.sql`:

```sql
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
```

### 5. Rótulo da categoria nova

O `Record<TransactionCategory, string>` do Financeiro agora **exige** o rótulo
(o TypeScript acusa a falta). Em `src/modules/finance/types/transaction.types.ts`:

```ts
    LEISURE: "Lazer",
    CONSTRUCTION: "Obra",
    OTHER: "Outros",
```

⚠️ **Não** acrescente `CONSTRUCTION` ao `transactionCategoryValues` do schema
do Financeiro. Assim o formulário e a API comuns **não** criam lançamentos
"Obra" soltos: eles nascem só pela Obra (passos 05 e 09).

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `prisma/schema.prisma` | Alterado | 7 modelos, 2 enums, `CONSTRUCTION`, ligações em `Transaction` |
| `prisma/migrations/<data>_add_construction/migration.sql` | Criado | SQL |
| `src/modules/finance/types/transaction.types.ts` | Alterado | Rótulo "Obra" |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npx prisma migrate status` | `Database schema is up to date!` |
| 2 | `npm run typecheck && npm test` | Sem erros; 94 testes |
| 3 | Nova transação no Financeiro | A categoria "Obra" **não** aparece na lista |

**Critério de aceite:** os 3 testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Property 'CONSTRUCTION' is missing` | Rótulo não acrescentado | Item 5 |
| `unsafe use of new value "CONSTRUCTION"` | Usar o valor novo do enum na **mesma** migration | Não insira dados nesta migration; ela só cria estrutura |
| `Property 'transaction' does not exist` ou modelos novos sem tipo | Client não regenerado | `npm run db:generate` |

## Commit sugerido

```bash
git add prisma/ src/modules/finance/types/transaction.types.ts
git commit -m "feat(obra): modelo de dados e migration da Obra"
```

## Referências

- [Prisma — Referential actions](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions)
- [Prisma — One-to-one relations](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/one-to-one-relations)

---

← [Passo anterior](01-ficha-e-decisoes.md) · [Índice da fase](README.md) · [Próximo passo](03-regras.md) →
