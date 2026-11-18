# Passo 04 — Tipos e schemas Zod

> **Fase:** 07 — Novos Módulos\
> **Tempo estimado:** 45 min\
> **Depende de:** [Passo 03](03-dinheiro-e-datas.md)

## Objetivo

Criar a "porta de entrada" do módulo: os **tipos** (com rótulos em português)
e os **schemas Zod** de criação, atualização parcial e filtro por mês, mais a
API pública `index.ts`.

## 💡 Por que o schema converte, além de validar

💡 O schema é a **alfândega** do módulo: tudo que entra (do formulário ou da
API) passa por ele, e só sai do outro lado no formato oficial. Depois da
alfândega, o resto do código **confia** no dado.

O Financeiro tem duas portas com formatos diferentes:

| Porta | Envia o valor como | Envia a data como |
|---|---|---|
| Formulário (Server Action) | Texto: `"1.234,56"` | Texto: `"2026-11-17"` |
| API REST (JSON) | Número em centavos: `123456` | Texto: `"2026-11-17"` |

O `z.preprocess` do `amountCents` aceita os dois e entrega **sempre
centavos**. O `.transform` do `occurredOn` entrega **sempre** um `Date` à
meia-noite UTC. Assim, repositório e serviço nunca precisam saber de onde o
dado veio.

As mesmas duas regras da Fase 04 continuam valendo:

- `create` tem padrão (`category: "OTHER"`); `update` é `.partial()` **sem
  padrão**, senão um PATCH só com a descrição voltaria a categoria para "Outros".
- `update` vazio é recusado (`refine`).

## Pré-requisitos

- Passo 03 concluído.

## Passo a passo

### 1. Criar os tipos

`src/modules/finance/types/transaction.types.ts`:

```ts
import type {
    Transaction,
    TransactionCategory,
    TransactionType,
} from "@/generated/prisma/client";

// O módulo expõe seus próprios tipos; quem usa não importa do Prisma diretamente.
export type { Transaction, TransactionCategory, TransactionType };

export const transactionTypeLabel: Record<TransactionType, string> = {
    INCOME: "Receita",
    EXPENSE: "Despesa",
};

export const transactionCategoryLabel: Record<TransactionCategory, string> = {
    SALARY: "Salário",
    HOUSING: "Moradia",
    FOOD: "Alimentação",
    TRANSPORT: "Transporte",
    HEALTH: "Saúde",
    EDUCATION: "Educação",
    LEISURE: "Lazer",
    OTHER: "Outros",
};

/** Resumo de um mês: o que o painel mostra no topo. Valores em centavos. */
export type MonthlySummary = {
    month: string;
    incomeCents: number;
    expenseCents: number;
    balanceCents: number;
    expensesByCategory: { category: TransactionCategory; totalCents: number }[];
};
```

💡 Os rótulos ficam num `Record<TransactionCategory, string>`. Se um dia você
acrescentar uma categoria no `enum`, o TypeScript **acusa erro** aqui até
você escrever o rótulo dela. O compilador vira um checklist.

### 2. Criar os schemas

`src/modules/finance/schemas/transaction.schema.ts`:

```ts
import { z } from "zod";

import { MONTH_PATTERN } from "@/lib/dates/month";
import { parseMoneyToCents } from "@/lib/money/money";

export const transactionTypeValues = ["INCOME", "EXPENSE"] as const;

export const transactionCategoryValues = [
    "SALARY",
    "HOUSING",
    "FOOD",
    "TRANSPORT",
    "HEALTH",
    "EDUCATION",
    "LEISURE",
    "OTHER",
] as const;

/** Teto por lançamento: R$ 10.000.000,00 (a coluna Int aceita até ~R$ 21 milhões). */
export const MAX_AMOUNT_CENTS = 1_000_000_000;

const transactionFields = {
    type: z.enum(transactionTypeValues, { error: "Escolha receita ou despesa." }),
    description: z
        .string({ error: "Informe a descrição." })
        .trim()
        .min(2, { error: "A descrição precisa ter pelo menos 2 caracteres." })
        .max(120, { error: "A descrição pode ter no máximo 120 caracteres." }),
    // A API envia centavos (número inteiro); o formulário envia texto ("1.234,56").
    // O preprocess aceita os dois e entrega SEMPRE centavos ao resto do código.
    amountCents: z.preprocess(
        (value) => (typeof value === "string" ? parseMoneyToCents(value) : value),
        z
            .number({ error: "Informe um valor válido, por exemplo 1.234,56." })
            .int({ error: "Informe o valor em centavos (número inteiro)." })
            .positive({ error: "O valor precisa ser maior que zero." })
            .max(MAX_AMOUNT_CENTS, { error: "O valor máximo é R$ 10.000.000,00." }),
    ),
    category: z.enum(transactionCategoryValues, { error: "Categoria inválida." }),
    // "2026-11-17" → Date à meia-noite UTC (coluna @db.Date).
    occurredOn: z
        .iso.date({ error: "Informe uma data válida." })
        .transform((value) => new Date(`${value}T00:00:00.000Z`)),
};

/** Criação: categoria opcional, com padrão OTHER. */
export const createTransactionSchema = z.object({
    ...transactionFields,
    category: transactionFields.category.default("OTHER"),
});

/** Atualização parcial (PATCH): campos opcionais, SEM padrão (mesma regra dos projetos). */
export const updateTransactionSchema = z
    .object(transactionFields)
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        error: "Informe ao menos um campo para atualizar.",
    });

/** Mês no formato "AAAA-MM" (filtro do painel e da API). */
export const monthSchema = z.string().regex(MONTH_PATTERN, { error: "Mês inválido. Use AAAA-MM." });

export type CreateTransactionInput = z.output<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.output<typeof updateTransactionSchema>;
```

⚠️ Os arrays `transactionTypeValues` e `transactionCategoryValues` repetem os
valores do `enum` do Prisma. Isso é proposital: este arquivo é importado
**no navegador** (pelo formulário), e o client do Prisma não pode ir para o
navegador. Se você mudar o `enum` no `schema.prisma`, mude aqui **no mesmo
commit**. O TypeScript só protege um lado: um valor no array que **não existe**
no `enum` quebra o typecheck do repositório (passo 05); já um valor novo no
`enum` que **falta** no array passa calado (ele só não aparece no formulário).

### 3. Criar a API pública do módulo

`src/modules/finance/index.ts` (seguro para o navegador):

`src/modules/finance/index.ts`:

```ts
// API pública do módulo Financeiro — parte SEGURA para servidor e navegador
// (schemas e tipos). Serviços ficam em "./server".
export * from "./schemas/transaction.schema";
export * from "./types/transaction.types";
```

### 4. Criar os testes

`tests/unit/modules/finance/transaction.schema.test.ts`:

```ts
import {
    createTransactionSchema,
    monthSchema,
    updateTransactionSchema,
} from "@/modules/finance/schemas/transaction.schema";

const valid = {
    type: "EXPENSE",
    description: "Mercado",
    amountCents: "1.234,56",
    occurredOn: "2026-11-17",
};

describe("createTransactionSchema", () => {
    it("converte o texto do formulário em centavos e a data em Date (UTC)", () => {
        const data = createTransactionSchema.parse(valid);

        expect(data.amountCents).toBe(123456);
        expect(data.occurredOn.toISOString()).toBe("2026-11-17T00:00:00.000Z");
        expect(data.category).toBe("OTHER");
    });

    it("aceita centavos como número (contrato da API)", () => {
        expect(createTransactionSchema.parse({ ...valid, amountCents: 990 }).amountCents).toBe(990);
    });

    it.each([
        ["", "Informe um valor válido, por exemplo 1.234,56."],
        ["abc", "Informe um valor válido, por exemplo 1.234,56."],
        ["0,00", "O valor precisa ser maior que zero."],
        ["10.000.000,01", "O valor máximo é R$ 10.000.000,00."],
    ])("recusa o valor %p", (amountCents, message) => {
        const result = createTransactionSchema.safeParse({ ...valid, amountCents });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe(message);
    });

    it("recusa centavos fracionados vindos da API", () => {
        expect(createTransactionSchema.safeParse({ ...valid, amountCents: 10.5 }).success).toBe(false);
    });

    it("recusa data inválida e tipo inválido", () => {
        expect(createTransactionSchema.safeParse({ ...valid, occurredOn: "2026-02-30" }).success).toBe(
            false,
        );
        expect(createTransactionSchema.safeParse({ ...valid, type: "TRANSFER" }).success).toBe(false);
    });
});

describe("updateTransactionSchema", () => {
    it("PATCH parcial não aplica o padrão da categoria", () => {
        expect(updateTransactionSchema.parse({ description: "Feira" })).toEqual({
            description: "Feira",
        });
    });

    it("recusa corpo vazio", () => {
        expect(updateTransactionSchema.safeParse({}).success).toBe(false);
    });
});

describe("monthSchema", () => {
    it.each(["2026-11", "2027-01"])("aceita %s", (month) => {
        expect(monthSchema.safeParse(month).success).toBe(true);
    });

    it.each(["2026-13", "2026-1", "nov/2026", ""])("recusa %p", (month) => {
        expect(monthSchema.safeParse(month).success).toBe(false);
    });
});
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/modules/finance/types/transaction.types.ts` | Criado | Tipos, rótulos e `MonthlySummary` |
| `src/modules/finance/schemas/transaction.schema.ts` | Criado | `createTransactionSchema`, `updateTransactionSchema`, `monthSchema` |
| `src/modules/finance/index.ts` | Criado | API pública (schemas e tipos) |
| `tests/unit/modules/finance/transaction.schema.test.ts` | Criado | 16 testes |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npx jest tests/unit/modules/finance/transaction.schema` | `Tests: 16 passed` |
| 2 | `npm run typecheck && npm run lint` | Sem erros |

**Critério de aceite:** o mesmo schema aceita `"1.234,56"` (formulário) e
`123456` (API), e recusa valor zero, fracionado, acima do teto e data
inexistente (`2026-02-30`).

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| PATCH volta a categoria para "Outros" | `.default()` dentro do schema de update | O `default` só existe no `createTransactionSchema` |
| Mensagem em inglês ("Expected number, received NaN") | Faltou `{ error: "..." }` no `z.number` | Toda regra do schema tem mensagem em português |
| `Cannot import "@/generated/prisma"` no navegador | Importou valor (não tipo) do Prisma no `types` | Use `import type` (só tipos somem no build) |

## Commit sugerido

```bash
git add src/modules/finance/types src/modules/finance/schemas src/modules/finance/index.ts tests/unit/modules/finance/transaction.schema.test.ts
git commit -m "feat(finance): adiciona tipos e schemas Zod"
```

## Referências

- [Zod 4 — `z.preprocess` e `.transform`](https://zod.dev/api#transforms)
- [Zod 4 — ISO dates (`z.iso.date`)](https://zod.dev/api#iso-dates)

---

← [Passo anterior](03-dinheiro-e-datas.md) · [Índice da fase](README.md) · [Próximo passo](05-repositorio.md) →
