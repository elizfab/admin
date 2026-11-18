# Passo 06 — Serviço

> **Fase:** 07 — Novos Módulos\
> **Tempo estimado:** 30 min\
> **Depende de:** [Passo 05](05-repositorio.md)

## Objetivo

Criar o serviço do Financeiro (as regras) e a API **de servidor** do módulo
(`server.ts`), com 4 testes unitários usando um dublê do repositório.

## 💡 O que é regra de negócio aqui

💡 O repositório é o estoquista (busca e guarda); o serviço é o **contador**:
ele sabe que "saldo = receitas − despesas", que um mês sem receitas tem
receita **zero** (e não "vazio") e que a transação de outra pessoa
"não existe" para você.

| Regra | Onde está |
|---|---|
| Transação alheia = `NotFoundError` (404) | `getTransaction`, usado por `update` e `delete` |
| Mês vira intervalo de datas | `listTransactions` e `getMonthlySummary` chamam `monthRange` |
| Tipo sem lançamentos = 0 | `totalOf(...) ?? 0` |
| Saldo pode ser negativo | `incomeCents - expenseCents`, sem `Math.max` |

💡 O `Promise.all` em `getMonthlySummary` dispara as duas somas **ao mesmo
tempo**: como pedir duas coisas a dois atendentes em vez de esperar um
terminar para pedir ao outro.

## Pré-requisitos

- Passo 05 concluído.

## Passo a passo

### 1. Criar o serviço

`src/modules/finance/services/transaction.service.ts`:

```ts
import { monthRange } from "@/lib/dates/month";
import { NotFoundError } from "@/lib/errors/app-error";

import { transactionRepository } from "../repositories/transaction.repository";
import type {
    CreateTransactionInput,
    UpdateTransactionInput,
} from "../schemas/transaction.schema";
import type { MonthlySummary } from "../types/transaction.types";

/**
 * Regras de negócio do Financeiro.
 * Recebe dados JÁ validados (Zod) e o ownerId vindo da SESSÃO — nunca do cliente.
 */

const NOT_FOUND = "Transação não encontrada.";

export async function listTransactions(ownerId: string, month: string) {
    return transactionRepository.listByOwnerInRange(ownerId, monthRange(month));
}

export async function getTransaction(ownerId: string, id: string) {
    const transaction = await transactionRepository.findByIdForOwner(id, ownerId);

    // Transação de outra pessoa = "não encontrada" (não revela que ela existe).
    if (!transaction) throw new NotFoundError(NOT_FOUND);

    return transaction;
}

export async function createTransaction(ownerId: string, input: CreateTransactionInput) {
    return transactionRepository.create(ownerId, input);
}

export async function updateTransaction(
    ownerId: string,
    id: string,
    input: UpdateTransactionInput,
) {
    await getTransaction(ownerId, id);

    return transactionRepository.update(id, input);
}

export async function deleteTransaction(ownerId: string, id: string) {
    await getTransaction(ownerId, id);
    await transactionRepository.delete(id);
}

export async function getMonthlySummary(ownerId: string, month: string): Promise<MonthlySummary> {
    const range = monthRange(month);
    const [totals, byCategory] = await Promise.all([
        transactionRepository.sumByType(ownerId, range),
        transactionRepository.sumExpensesByCategory(ownerId, range),
    ]);

    // Sem lançamentos de um tipo, o groupBy não traz a linha: o total é 0.
    const totalOf = (type: "INCOME" | "EXPENSE") =>
        totals.find((row) => row.type === type)?._sum.amountCents ?? 0;

    const incomeCents = totalOf("INCOME");
    const expenseCents = totalOf("EXPENSE");

    return {
        month,
        incomeCents,
        expenseCents,
        balanceCents: incomeCents - expenseCents,
        expensesByCategory: byCategory.map((row) => ({
            category: row.category,
            totalCents: row._sum.amountCents ?? 0,
        })),
    };
}
```

### 2. Criar a API de servidor do módulo

`src/modules/finance/server.ts`:

`src/modules/finance/server.ts`:

```ts
import "server-only";

// API pública do módulo Financeiro — SOMENTE servidor (acessa o banco).
// Importar este arquivo num Client Component gera erro de build.
export * from "./services/transaction.service";
```

### 3. Criar os testes

`tests/unit/modules/finance/transaction.service.test.ts`:

```ts
import { NotFoundError } from "@/lib/errors/app-error";
import { transactionRepository } from "@/modules/finance/repositories/transaction.repository";
import {
    deleteTransaction,
    getMonthlySummary,
    getTransaction,
    listTransactions,
    updateTransaction,
} from "@/modules/finance/services/transaction.service";

// O repositório (banco) é substituído por um dublê: testamos só as REGRAS.
jest.mock("@/modules/finance/repositories/transaction.repository", () => ({
    transactionRepository: {
        listByOwnerInRange: jest.fn(),
        findByIdForOwner: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        sumByType: jest.fn(),
        sumExpensesByCategory: jest.fn(),
    },
}));

const repo = jest.mocked(transactionRepository);
const OWNER = "owner-1";

beforeEach(() => jest.resetAllMocks());

describe("listTransactions", () => {
    it("filtra pela dona e pelo intervalo do mês", async () => {
        repo.listByOwnerInRange.mockResolvedValue([]);

        await listTransactions(OWNER, "2026-11");

        expect(repo.listByOwnerInRange).toHaveBeenCalledWith(OWNER, {
            start: new Date("2026-11-01T00:00:00.000Z"),
            end: new Date("2026-12-01T00:00:00.000Z"),
        });
    });
});

describe("getTransaction / update / delete", () => {
    it("transação de outra pessoa = NotFoundError, e nada é alterado", async () => {
        repo.findByIdForOwner.mockResolvedValue(null);

        await expect(getTransaction("outra", "t1")).rejects.toBeInstanceOf(NotFoundError);
        await expect(updateTransaction("outra", "t1", { description: "x" })).rejects.toBeInstanceOf(
            NotFoundError,
        );
        await expect(deleteTransaction("outra", "t1")).rejects.toBeInstanceOf(NotFoundError);

        expect(repo.update).not.toHaveBeenCalled();
        expect(repo.delete).not.toHaveBeenCalled();
    });
});

describe("getMonthlySummary", () => {
    it("calcula receitas, despesas e saldo", async () => {
        repo.sumByType.mockResolvedValue([
            { type: "INCOME", _sum: { amountCents: 500000 } },
            { type: "EXPENSE", _sum: { amountCents: 123456 } },
        ] as never);
        repo.sumExpensesByCategory.mockResolvedValue([
            { category: "FOOD", _sum: { amountCents: 123456 } },
        ] as never);

        await expect(getMonthlySummary(OWNER, "2026-11")).resolves.toEqual({
            month: "2026-11",
            incomeCents: 500000,
            expenseCents: 123456,
            balanceCents: 376544,
            expensesByCategory: [{ category: "FOOD", totalCents: 123456 }],
        });
    });

    it("mês sem lançamentos dá tudo zero (e saldo negativo é possível)", async () => {
        repo.sumByType.mockResolvedValue([] as never);
        repo.sumExpensesByCategory.mockResolvedValue([] as never);

        const empty = await getMonthlySummary(OWNER, "2026-11");
        expect(empty).toMatchObject({ incomeCents: 0, expenseCents: 0, balanceCents: 0 });

        repo.sumByType.mockResolvedValue([{ type: "EXPENSE", _sum: { amountCents: 100 } }] as never);
        expect((await getMonthlySummary(OWNER, "2026-11")).balanceCents).toBe(-100);
    });
});
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/modules/finance/services/transaction.service.ts` | Criado | Regras e resumo do mês |
| `src/modules/finance/server.ts` | Criado | Exporta o serviço (`server-only`) |
| `tests/unit/modules/finance/transaction.service.test.ts` | Criado | 4 testes |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npx jest tests/unit/modules/finance` | `Tests: 20 passed` (16 do schema + 4 do serviço) |
| 2 | `npm run typecheck && npm run lint` | Sem erros |

**Critério de aceite:** o serviço nunca chama `update`/`delete` para uma
transação que não é da dona, e o resumo de um mês vazio é tudo zero.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `server-only` quebra o Jest | O teste importou `server.ts` | Nos testes, importe direto de `services/transaction.service` |
| Mock não intercepta | Caminho do `jest.mock` diferente do import do serviço | Use o mesmo caminho com alias `@/modules/finance/repositories/...` |

## Commit sugerido

```bash
git add src/modules/finance/services src/modules/finance/server.ts tests/unit/modules/finance/transaction.service.test.ts
git commit -m "feat(finance): adiciona serviço"
```

## Referências

- [Jest — `jest.mock`](https://jestjs.io/docs/jest-object#jestmockmodulename-factory-options)
- [MDN — `Promise.all`](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)

---

← [Passo anterior](05-repositorio.md) · [Índice da fase](README.md) · [Próximo passo](07-api-rest.md) →
