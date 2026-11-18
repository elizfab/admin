# Passo 02 — Modelo `Transaction` e migration

> **Fase:** 07 — Novos Módulos\
> **Tempo estimado:** 30 min\
> **Depende de:** [Passo 01](01-roteiro-de-um-modulo.md)

## Objetivo

Criar a tabela `transaction` no banco local, com dona, tipo, valor em
centavos, categoria e data, e gerar o Prisma Client atualizado.

## 💡 Por que estes tipos de coluna

| Coluna | Tipo | 💡 Por quê |
|---|---|---|
| `amountCents` | `Int` (centavos) | Dinheiro **nunca** em número com vírgula (float): `0.1 + 0.2` dá `0.30000000000000004`. Com centavos inteiros a conta fecha sempre. O `Int` do PostgreSQL vai até 2.147.483.647 centavos (≈ R$ 21 milhões), muito acima do teto de R$ 10 milhões que o schema vai impor |
| `occurredOn` | `DateTime @db.Date` | Uma despesa acontece **num dia**, não num horário. `DATE` guarda só o dia e evita a pergunta "a compra das 23h30 é de hoje ou de amanhã em UTC?" |
| `type` e `category` | `enum` | Lista fechada: o banco recusa qualquer valor fora dela |
| `ownerId` | FK com `onDelete: Restrict` | Mesma regra dos projetos: não se apaga uma usuária que ainda tem dados |
| `@@index([ownerId, occurredOn])` | Índice composto | Toda consulta do módulo é "da dona X **no mês** Y". 💡 Como um arquivo de pastas ordenado por pessoa e depois por data: o banco vai direto ao trecho certo |

💡 **Por que `Decimal` não foi usado?** O PostgreSQL tem `NUMERIC`, e o Prisma
o expõe como `Decimal`. Ele também é exato, mas chega ao código como um
**objeto** (`Prisma.Decimal`), que não pode ser passado direto para um Client
Component nem somado com `+`. Centavos em `Int` são exatos **e** são um
`number` comum.

## Pré-requisitos

- Banco local no ar: `npm run db:up`.
- `git status` limpo, na branch do módulo:

```bash
git checkout develop && git pull
git checkout -b feat/finance
```

## Passo a passo

### 1. Acrescentar o modelo ao `schema.prisma`

No modelo `User`, acrescente a relação (alinhada com a de projetos):

```prisma
  projects     Project[]
  transactions Transaction[]
```

No final do arquivo, acrescente a seção do Financeiro:

```prisma
// ─── Financeiro ──────────────────────────────────────────────

enum TransactionType {
  INCOME
  EXPENSE
}

enum TransactionCategory {
  SALARY
  HOUSING
  FOOD
  TRANSPORT
  HEALTH
  EDUCATION
  LEISURE
  OTHER
}

model Transaction {
  id          String              @id @default(cuid())
  type        TransactionType
  description String              @db.VarChar(120)
  // Dinheiro em CENTAVOS (inteiro): R$ 12,34 = 1234. Sem erro de arredondamento.
  amountCents Int
  category    TransactionCategory @default(OTHER)
  // Só a data (sem hora): o dia em que a receita/despesa aconteceu.
  occurredOn  DateTime            @db.Date
  ownerId     String
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  owner User @relation(fields: [ownerId], references: [id], onDelete: Restrict)

  // As consultas sempre filtram por dona + período (resumo do mês).
  @@index([ownerId, occurredOn])
  @@map("transaction")
}
```

### 2. Formatar, criar a migration e gerar o client

```bash
npx prisma format
npx prisma migrate dev --name add_finance_transactions
npm run db:generate
```

⚠️ No **Prisma 7**, o `migrate dev` **não** gera mais o client sozinho. Sem o
`db:generate`, o TypeScript reclama que `prisma.transaction` não existe.

A migration gerada deve ter este conteúdo:

`prisma/migrations/20261117190429_add_finance_transactions/migration.sql`:

```sql
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
```

💡 A pasta da sua migration terá **outra data** no nome; é normal. O que
importa é o conteúdo.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `prisma/schema.prisma` | Alterado | 2 enums, modelo `Transaction`, relação em `User` |
| `prisma/migrations/<data>_add_finance_transactions/migration.sql` | Criado | SQL da tabela, do índice e da FK |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npx prisma migrate status` | `Database schema is up to date!` |
| 2 | `docker compose exec postgres psql -U postgres -d admin_dev -c '\d transaction'` | Colunas com `amountCents integer` e `occurredOn date`, e o índice `transaction_ownerId_occurredOn_idx` |
| 3 | `npm run typecheck` | Sem erros |

**Critério de aceite:** a tabela existe no banco local e o typecheck passa.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Property 'transaction' does not exist on type 'PrismaClient'` | Client não regenerado | `npm run db:generate` |
| O CLI sugere `npm i prisma@latest` | Aviso de versão nova (8, ainda RC) | **Ignore.** O projeto fixa `prisma@7` |
| `Drift detected` | Banco local alterado à mão | `npx prisma migrate reset` (apaga os dados **locais**) e rode o seed de novo |
| Confusão entre `prisma.transaction` e `prisma.$transaction` | Nomes parecidos | `prisma.transaction` é a **tabela**; `prisma.$transaction` (com `$`) é a **transação de banco** (várias operações juntas) |

## Commit sugerido

```bash
git add prisma/
git commit -m "feat(finance): adiciona modelo Transaction e migration"
```

## Referências

- [Prisma — Native types (`@db.Date`)](https://www.prisma.io/docs/orm/reference/prisma-schema-reference#date)
- [Prisma — Indexes](https://www.prisma.io/docs/orm/prisma-schema/data-model/indexes)

---

← [Passo anterior](01-roteiro-de-um-modulo.md) · [Índice da fase](README.md) · [Próximo passo](03-dinheiro-e-datas.md) →
