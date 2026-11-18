# Passo 07 — API REST `/api/v1/finance`

> **Fase:** 07 — Novos Módulos\
> **Tempo estimado:** 40 min\
> **Depende de:** [Passo 06](06-servico.md)

## Objetivo

Expor o Financeiro em `/api/v1/finance` com o mesmo contrato dos projetos:
CRUD de transações, filtro por mês e o resumo do mês.

## 💡 As rotas do módulo

| Método | Rota | Corpo / parâmetros | Sucesso |
|---|---|---|---|
| `GET` | `/api/v1/finance/transactions?month=2026-11` | `month` opcional (padrão: mês atual) | `200 { data: Transaction[] }` |
| `POST` | `/api/v1/finance/transactions` | `{ type, description, amountCents, occurredOn, category? }` | `201 { data: Transaction }` |
| `GET` | `/api/v1/finance/transactions/:id` | — | `200 { data: Transaction }` |
| `PATCH` | `/api/v1/finance/transactions/:id` | Qualquer subconjunto dos campos | `200 { data: Transaction }` |
| `DELETE` | `/api/v1/finance/transactions/:id` | — | `204` |
| `GET` | `/api/v1/finance/summary?month=2026-11` | `month` opcional | `200 { data: MonthlySummary }` |

Exemplo de corpo para o `POST` (valor em **centavos**, data `AAAA-MM-DD`):

```json
{
  "type": "EXPENSE",
  "description": "Supermercado",
  "amountCents": 84320,
  "occurredOn": "2026-11-09",
  "category": "FOOD"
}
```

💡 **Por que o mês inválido é tratado diferente na API e na tela?** Na tela,
`/finance?month=abc` simplesmente mostra o mês atual: quem digitou errado na
barra de endereço é uma pessoa, e ela vê o resultado. Na API, quem chama é um
**programa**; se ele recebesse o mês atual em silêncio, acharia que o filtro
funcionou. Por isso a API responde **400**, e o programa descobre o erro.

💡 O `[id]/route.ts` é quase idêntico ao de projetos: só mudam o schema e as
funções do serviço. É a vantagem do roteiro: depois do primeiro módulo, cada
rota nova é "copiar, trocar os nomes, conferir".

## Pré-requisitos

- Passo 06 concluído.

## Passo a passo

### 1. Ler o parâmetro `?month=` (função compartilhada)

`src/app/api/v1/finance/month-param.ts`:

```ts
import { currentMonth } from "@/lib/dates/month";
import { ValidationError } from "@/lib/errors/app-error";
import { monthSchema } from "@/modules/finance";

/**
 * Lê ?month=AAAA-MM da URL. Ausente → mês atual.
 * Na API, mês inválido é ERRO 400 (quem chama precisa saber que errou);
 * na tela, o mesmo caso só cai no mês atual.
 */
export function readMonthParam(request: Request): string {
    const month = new URL(request.url).searchParams.get("month");

    if (month === null) return currentMonth();

    const parsed = monthSchema.safeParse(month);

    if (!parsed.success) {
        throw new ValidationError({ month: ["Mês inválido. Use AAAA-MM."] });
    }

    return parsed.data;
}
```

💡 Um arquivo que **não** se chama `route.ts` dentro de `app/api` não vira
rota: o Next.js só publica `route.ts`. Por isso ele pode morar ao lado das
rotas que o usam.

### 2. Lista e criação

`src/app/api/v1/finance/transactions/route.ts`:

```ts
import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, created, ok, readJson } from "@/lib/http/api-response";
import { toFieldErrors } from "@/lib/validations/common.schema";
import { createTransactionSchema } from "@/modules/finance";
import { createTransaction, listTransactions } from "@/modules/finance/server";

import { readMonthParam } from "../month-param";

/** GET /api/v1/finance/transactions?month=2026-11 */
export async function GET(request: Request) {
    try {
        const session = await requireApiSession();
        const transactions = await listTransactions(session.user.id, readMonthParam(request));

        return ok(transactions);
    } catch (error) {
        return apiError(error);
    }
}

/** POST /api/v1/finance/transactions */
export async function POST(request: Request) {
    try {
        const session = await requireApiSession();
        const parsed = createTransactionSchema.safeParse(await readJson(request));

        if (!parsed.success) {
            throw new ValidationError(toFieldErrors(parsed.error));
        }

        // ownerId vem da SESSÃO, nunca do corpo da requisição.
        const transaction = await createTransaction(session.user.id, parsed.data);

        return created(transaction);
    } catch (error) {
        return apiError(error);
    }
}
```

### 3. Leitura, alteração e exclusão por id

`src/app/api/v1/finance/transactions/[id]/route.ts`:

```ts
import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, noContent, ok, readJson } from "@/lib/http/api-response";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import { updateTransactionSchema } from "@/modules/finance";
import { deleteTransaction, getTransaction, updateTransaction } from "@/modules/finance/server";

type Context = RouteContext<"/api/v1/finance/transactions/[id]">;

async function parseId(ctx: Context) {
    const { id } = await ctx.params;
    const parsed = idSchema.safeParse(id);

    if (!parsed.success) {
        throw new ValidationError({ id: ["Identificador inválido."] });
    }

    return parsed.data;
}

export async function GET(_request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const transaction = await getTransaction(session.user.id, await parseId(ctx));

        return ok(transaction);
    } catch (error) {
        return apiError(error);
    }
}

export async function PATCH(request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const id = await parseId(ctx);
        const parsed = updateTransactionSchema.safeParse(await readJson(request));

        if (!parsed.success) {
            throw new ValidationError(toFieldErrors(parsed.error));
        }

        const transaction = await updateTransaction(session.user.id, id, parsed.data);

        return ok(transaction);
    } catch (error) {
        return apiError(error);
    }
}

export async function DELETE(_request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        await deleteTransaction(session.user.id, await parseId(ctx));

        return noContent();
    } catch (error) {
        return apiError(error);
    }
}
```

### 4. Resumo do mês

`src/app/api/v1/finance/summary/route.ts`:

```ts
import { requireApiSession } from "@/lib/auth/session";
import { apiError, ok } from "@/lib/http/api-response";
import { getMonthlySummary } from "@/modules/finance/server";

import { readMonthParam } from "../month-param";

/** GET /api/v1/finance/summary?month=2026-11 */
export async function GET(request: Request) {
    try {
        const session = await requireApiSession();
        const summary = await getMonthlySummary(session.user.id, readMonthParam(request));

        return ok(summary);
    } catch (error) {
        return apiError(error);
    }
}
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/app/api/v1/finance/month-param.ts` | Criado | Lê e valida `?month=` |
| `src/app/api/v1/finance/transactions/route.ts` | Criado | `GET` (lista do mês) e `POST` |
| `src/app/api/v1/finance/transactions/[id]/route.ts` | Criado | `GET`, `PATCH` e `DELETE` |
| `src/app/api/v1/finance/summary/route.ts` | Criado | `GET` do resumo |

## ✅ Como testar

Com `npm run dev` e logada no navegador, abra o **DevTools → Console** na
aba do Admin (os cookies da sessão vão junto):

```js
await fetch("/api/v1/finance/transactions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ type: "EXPENSE", description: "Teste", amountCents: 1990, occurredOn: "2026-11-17" }),
}).then((r) => r.status);
```

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | O `fetch` acima | `201` |
| 2 | `/api/v1/finance/transactions?month=2026-11` (na barra de endereço) | `{ "data": [ ... "Teste" ... ] }` |
| 3 | `/api/v1/finance/summary?month=2026-11` | `expenseCents` com 1990 a mais |
| 4 | `/api/v1/finance/transactions?month=2026-13` | `400` com `fieldErrors.month` |
| 5 | Numa janela anônima, `/api/v1/finance/summary` | `401` |

**Critério de aceite:** os 5 testes respondem como na tabela. (Os testes
automáticos destas rotas estão no passo 12.)

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `404` em `/api/v1/finance/...` | Arquivo chamado `routes.ts` ou fora da pasta | O nome é exatamente `route.ts` |
| `400` com `amountCents` "precisa ser inteiro" | Enviou reais (`19.9`) em vez de centavos (`1990`) | A API recebe **centavos** |
| `Cannot find name 'RouteContext'` | Tipos de rota não gerados | `npm run typecheck` (roda o `next typegen`) |

## Commit sugerido

```bash
git add src/app/api/v1/finance
git commit -m "feat(finance): adiciona API REST"
```

## Referências

- [Next.js — Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [MDN — `URLSearchParams`](https://developer.mozilla.org/pt-BR/docs/Web/API/URLSearchParams)

---

← [Passo anterior](06-servico.md) · [Índice da fase](README.md) · [Próximo passo](08-server-actions.md) →
