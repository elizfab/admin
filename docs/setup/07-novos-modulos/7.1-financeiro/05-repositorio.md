# Passo 05 — Repositório

> **Fase:** 07 — Novos Módulos\
> **Tempo estimado:** 45 min\
> **Depende de:** [Passo 04](04-tipos-e-schemas.md)

## Objetivo

Criar o `transactionRepository`: listar por dona e por mês, buscar, criar,
alterar, excluir e **somar no banco** (por tipo e por categoria), provado por
4 testes de integração contra o PostgreSQL real.

## 💡 Por que as somas ficam no banco

💡 Para saber quanto você gastou no mês, você pode trazer **todas** as notas
fiscais para casa e somar na calculadora (o JavaScript fazendo um `reduce`),
ou pedir ao caixa do banco o **total** já somado (o `groupBy`). Com 20
transações tanto faz; com 20 mil, só a segunda opção continua rápida: o
banco lê os dados onde eles estão e devolve **uma linha por grupo**.

```sql
-- O que o sumByType pede ao PostgreSQL, em SQL:
SELECT "type", SUM("amountCents")
FROM "transaction"
WHERE "ownerId" = $1 AND "occurredOn" >= $2 AND "occurredOn" < $3
GROUP BY "type";
```

A regra de ouro da Fase 04 continua: **toda** consulta filtra por `ownerId`.
Aqui ela fica numa função só (`ownerInRange`), usada por todas as consultas
do período. Uma regra num lugar só não é esquecida.

## Pré-requisitos

- Passo 04 concluído.
- Banco de teste com a migration nova aplicada (o `test:integration` usa o
  `admin_test`):

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/admin_test \
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/admin_test \
npx prisma migrate deploy
```

💡 Por que isso agora? O E2E aplica as migrations no `admin_test` sozinho
(no `globalSetup`), mas o `test:integration` não: ele assume que o banco já
está atualizado. No CI isso acontece porque o E2E roda antes da integração.

## Passo a passo

### 1. Criar o repositório

`src/modules/finance/repositories/transaction.repository.ts`:

```ts
import { prisma } from "@/lib/db/prisma";

import type {
    CreateTransactionInput,
    UpdateTransactionInput,
} from "../schemas/transaction.schema";

type DateRange = { start: Date; end: Date };

/** Filtro comum: SEMPRE pela dona e, quando houver, pelo período [start, end). */
function ownerInRange(ownerId: string, range: DateRange) {
    return { ownerId, occurredOn: { gte: range.start, lt: range.end } };
}

/**
 * Acesso a dados das transações.
 * REGRA (a mesma dos projetos): toda leitura filtra por ownerId.
 */
export const transactionRepository = {
    listByOwnerInRange(ownerId: string, range: DateRange) {
        return prisma.transaction.findMany({
            where: ownerInRange(ownerId, range),
            orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
        });
    },

    findByIdForOwner(id: string, ownerId: string) {
        return prisma.transaction.findFirst({ where: { id, ownerId } });
    },

    create(ownerId: string, data: CreateTransactionInput) {
        return prisma.transaction.create({ data: { ...data, ownerId } });
    },

    update(id: string, data: UpdateTransactionInput) {
        return prisma.transaction.update({ where: { id }, data });
    },

    delete(id: string) {
        return prisma.transaction.delete({ where: { id } });
    },

    /** Total de receitas e de despesas no período: a SOMA é feita pelo banco. */
    sumByType(ownerId: string, range: DateRange) {
        return prisma.transaction.groupBy({
            by: ["type"],
            where: ownerInRange(ownerId, range),
            _sum: { amountCents: true },
        });
    },

    /** Despesas do período agrupadas por categoria, da maior para a menor. */
    sumExpensesByCategory(ownerId: string, range: DateRange) {
        return prisma.transaction.groupBy({
            by: ["category"],
            where: { ...ownerInRange(ownerId, range), type: "EXPENSE" },
            _sum: { amountCents: true },
            orderBy: { _sum: { amountCents: "desc" } },
        });
    },
};
```

💡 Diferente de Projetos, aqui **não** há `try/catch` com
`isUniqueConstraintError`: transações não têm campo único (duas despesas
"Uber" no mesmo dia são normais, ficha do passo 01, linha 4).

### 2. Criar o teste de integração

`tests/integration/transaction.repository.test.ts`:

```ts
import { randomUUID } from "node:crypto";

import { monthRange } from "@/lib/dates/month";
import { prisma } from "@/lib/db/prisma";
import { transactionRepository } from "@/modules/finance/repositories/transaction.repository";

/**
 * Integração: repositório do Financeiro contra o PostgreSQL REAL (admin_test).
 * Prova o que os dublês não provam: filtro por dona, limites do mês
 * (coluna DATE) e as SOMAS feitas pelo banco (groupBy).
 */

const ownerA = `it-fin-a-${randomUUID()}`;
const ownerB = `it-fin-b-${randomUUID()}`;
const november = monthRange("2026-11");
const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

beforeAll(async () => {
    await prisma.user.createMany({
        data: [ownerA, ownerB].map((id) => ({ id, name: id, email: `${id}@example.com` })),
    });

    // Atalho para montar os lançamentos de teste em uma linha cada.
    const tx = (
        ownerId: string,
        type: "INCOME" | "EXPENSE",
        amountCents: number,
        isoDay: string,
        category: "SALARY" | "FOOD" | "HOUSING" | "OTHER" = "OTHER",
    ) => ({ ownerId, type, amountCents, occurredOn: day(isoDay), category, description: "Teste" });

    await prisma.transaction.createMany({
        data: [
            tx(ownerA, "INCOME", 500000, "2026-11-05", "SALARY"),
            tx(ownerA, "EXPENSE", 12345, "2026-11-01", "FOOD"),
            tx(ownerA, "EXPENSE", 20000, "2026-11-30", "HOUSING"),
            tx(ownerA, "EXPENSE", 655, "2026-11-15", "FOOD"),
            // Fora do mês (limites): 31/10 e 01/12 não podem entrar em novembro.
            tx(ownerA, "EXPENSE", 99999, "2026-10-31"),
            tx(ownerA, "EXPENSE", 99999, "2026-12-01"),
            // De outra dona, no mesmo mês.
            tx(ownerB, "EXPENSE", 77777, "2026-11-10"),
        ],
    });
});

afterAll(async () => {
    await prisma.transaction.deleteMany({ where: { ownerId: { in: [ownerA, ownerB] } } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerA, ownerB] } } });
    await prisma.$disconnect();
});

describe("transactionRepository (banco real)", () => {
    it("lista só a dona e só o mês, incluindo o 1º e o último dia", async () => {
        const list = await transactionRepository.listByOwnerInRange(ownerA, november);

        expect(list).toHaveLength(4);
        expect(list.every((t) => t.ownerId === ownerA)).toBe(true);
        // Ordem: mais recente primeiro.
        expect(list.map((t) => t.occurredOn.toISOString().slice(0, 10))).toEqual([
            "2026-11-30",
            "2026-11-15",
            "2026-11-05",
            "2026-11-01",
        ]);
    });

    it("sumByType soma no banco, por tipo", async () => {
        const totals = await transactionRepository.sumByType(ownerA, november);
        const byType = Object.fromEntries(totals.map((row) => [row.type, row._sum.amountCents]));

        expect(byType).toEqual({ INCOME: 500000, EXPENSE: 33000 });
    });

    it("sumExpensesByCategory agrupa só despesas, da maior para a menor", async () => {
        const rows = await transactionRepository.sumExpensesByCategory(ownerA, november);

        expect(rows.map((row) => [row.category, row._sum.amountCents])).toEqual([
            ["HOUSING", 20000],
            ["FOOD", 13000],
        ]);
    });

    it("findByIdForOwner não encontra transação de outra dona", async () => {
        const [fromB] = await transactionRepository.listByOwnerInRange(ownerB, november);

        await expect(transactionRepository.findByIdForOwner(fromB.id, ownerA)).resolves.toBeNull();
    });
});
```

💡 Os dados de teste incluem **31/10** e **01/12** de propósito: são os
vizinhos de novembro. Se o filtro usasse `lte` (menor **ou igual**) no fim do
mês, o dia 01/12 entraria em novembro, e o teste pegaria o erro.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/modules/finance/repositories/transaction.repository.ts` | Criado | Acesso a dados + somas |
| `tests/integration/transaction.repository.test.ts` | Criado | 4 testes (banco real) |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run test:integration` | `Tests: 8 passed` (4 de projetos + 4 do Financeiro) |
| 2 | `npm run typecheck && npm run lint` | Sem erros |

**Critério de aceite:** a lista de novembro tem exatamente 4 itens (nem
31/10, nem 01/12, nem a transação da outra dona) e as somas batem.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `relation "transaction" does not exist` | Migration não aplicada no `admin_test` | Rode o comando dos pré-requisitos |
| `_sum.amountCents` é `null` | Não há linhas daquele tipo no período | O serviço trata com `?? 0` (passo 06) |
| `Foreign key constraint violated` no `afterAll` | Apagou o usuário antes das transações | Apague as transações primeiro (`Restrict`) |

## Commit sugerido

```bash
git add src/modules/finance/repositories tests/integration/transaction.repository.test.ts
git commit -m "feat(finance): adiciona repositório"
```

## Referências

- [Prisma — Aggregation, grouping, and summarizing](https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing)

---

← [Passo anterior](04-tipos-e-schemas.md) · [Índice da fase](README.md) · [Próximo passo](06-servico.md) →
