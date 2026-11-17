# Passo 10 — Telas do Financeiro

> **Fase:** 07 — Novos Módulos\
> **Tempo estimado:** 45 min\
> **Depende de:** [Passo 09](09-componentes.md)

## Objetivo

Substituir o "Em breve" de `/finance` pelo painel do mês e criar as telas de
nova transação e de edição.

## 💡 As três rotas

| Rota | O que mostra | Busca no servidor |
|---|---|---|
| `/finance?month=AAAA-MM` | Navegação de mês, resumo e lançamentos | `getMonthlySummary` + `listTransactions` (em paralelo) |
| `/finance/transactions/new` | Formulário vazio (data = hoje) | Nada |
| `/finance/transactions/[id]/edit` | Formulário preenchido | `getTransaction` (404 se não for da dona) |

💡 Por que `transactions/new` e não `/finance/new`? O módulo é **Financeiro**;
o recurso é **transação**. Quando o PDI ou o próprio Financeiro ganhar outro
recurso (por exemplo, `budgets`), cada um terá sua pasta, sem disputar o
mesmo `/new`. A URL da tela espelha a da API (`/api/v1/finance/transactions`).

Hierarquia de títulos da página (o leitor de tela navega por ela):

```text
h1 Financeiro
└── h2 Novembro de 2026         (MonthNavigator)
    ├── h3 Despesas por categoria (MonthlySummary)
    └── h3 Lançamentos
```

## Pré-requisitos

- Passo 09 concluído.
- `npm run dev` rodando e você logada.

## Passo a passo

### 1. Substituir o painel `/finance`

`src/app/(private)/finance/page.tsx` (substitua o conteúdo inteiro):

`src/app/(private)/finance/page.tsx`:

```tsx
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { buttonClassName } from "@/components/ui/Button/Button";
import { requireSession } from "@/lib/auth/session";
import { currentMonth } from "@/lib/dates/month";
import { monthSchema } from "@/modules/finance";
import { MonthlySummary } from "@/modules/finance/components/MonthlySummary/MonthlySummary";
import { MonthNavigator } from "@/modules/finance/components/MonthNavigator/MonthNavigator";
import { TransactionList } from "@/modules/finance/components/TransactionList/TransactionList";
import { getMonthlySummary, listTransactions } from "@/modules/finance/server";

import styles from "./page.module.scss";

export const metadata: Metadata = {
    title: "Financeiro",
};

export default async function FinancePage({ searchParams }: PageProps<"/finance">) {
    const session = await requireSession();

    // ?month=2026-11 — mês ausente ou inválido cai no mês atual (sem erro na tela).
    const parsedMonth = monthSchema.safeParse((await searchParams).month);
    const month = parsedMonth.success ? parsedMonth.data : currentMonth();

    // As duas consultas não dependem uma da outra: rodam em paralelo.
    const [summary, transactions] = await Promise.all([
        getMonthlySummary(session.user.id, month),
        listTransactions(session.user.id, month),
    ]);

    return (
        <div className={styles.page}>
            <PageHeader
                title="Financeiro"
                description="Receitas, despesas e saldo do mês."
                action={
                    <Link href="/finance/transactions/new" className={buttonClassName("primary")}>
                        <Plus size={16} aria-hidden="true" />
                        Nova transação
                    </Link>
                }
            />

            <MonthNavigator month={month} />
            <MonthlySummary summary={summary} />

            <section aria-labelledby="transactions-title" className={styles.transactions}>
                <h3 id="transactions-title">Lançamentos</h3>
                {transactions.length > 0 ? (
                    <TransactionList transactions={transactions} />
                ) : (
                    <p className={styles.empty}>Nenhuma transação neste mês.</p>
                )}
            </section>
        </div>
    );
}
```

`src/app/(private)/finance/page.module.scss`:

```scss
@use "@/styles/abstracts" as *;

.page {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.transactions {
  display: flex;
  flex-direction: column;
  gap: $space-3;

  h3 {
    margin: 0;
    font-size: $font-size-md;
  }
}

.empty {
  margin: 0;
  padding: $space-5;
  text-align: center;
  color: var(--text-color-secondary);
  background: var(--card-background);
  border: 1px dashed var(--border);
  border-radius: $radius-lg;
}
```

💡 `searchParams` é uma **Promise** no Next.js 16 (por isso o `await`). O
tipo `PageProps<"/finance">` vem do `next typegen` e já sabe disso.

### 2. Nova transação

`src/app/(private)/finance/transactions/new/page.tsx`:

```tsx
import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { today } from "@/lib/dates/month";
import { createTransactionAction } from "@/modules/finance/actions/transaction.actions";
import { TransactionForm } from "@/modules/finance/components/TransactionForm/TransactionForm";

export const metadata: Metadata = {
    title: "Nova transação",
};

export default function NewTransactionPage() {
    return (
        <>
            <PageHeader title="Nova transação" />
            <TransactionForm
                action={createTransactionAction}
                defaultDate={today()}
                cancelHref="/finance"
                submitLabel="Salvar transação"
            />
        </>
    );
}
```

### 3. Editar transação

`src/app/(private)/finance/transactions/[id]/edit/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { requireSession } from "@/lib/auth/session";
import { today } from "@/lib/dates/month";
import { NotFoundError } from "@/lib/errors/app-error";
import { idSchema } from "@/lib/validations/common.schema";
import { updateTransactionAction } from "@/modules/finance/actions/transaction.actions";
import { TransactionForm } from "@/modules/finance/components/TransactionForm/TransactionForm";
import { getTransaction } from "@/modules/finance/server";

export const metadata: Metadata = {
    title: "Editar transação",
};

export default async function EditTransactionPage({
    params,
}: PageProps<"/finance/transactions/[id]/edit">) {
    const session = await requireSession();
    const parsedId = idSchema.safeParse((await params).id);

    if (!parsedId.success) notFound();

    const transaction = await getTransaction(session.user.id, parsedId.data).catch((error) => {
        if (error instanceof NotFoundError) notFound();
        throw error;
    });

    // bind fixa o id como 1º argumento da action, no servidor.
    const action = updateTransactionAction.bind(null, transaction.id);
    const month = transaction.occurredOn.toISOString().slice(0, 7);

    return (
        <>
            <PageHeader title="Editar transação" />
            <TransactionForm
                action={action}
                transaction={transaction}
                defaultDate={today()}
                cancelHref={`/finance?month=${month}`}
                submitLabel="Salvar alterações"
            />
        </>
    );
}
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/app/(private)/finance/page.tsx` | Substituído | Painel do mês |
| `src/app/(private)/finance/page.module.scss` | Criado | Espaçamentos do painel |
| `src/app/(private)/finance/transactions/new/page.tsx` | Criado | Nova transação |
| `src/app/(private)/finance/transactions/[id]/edit/page.tsx` | Criado | Edição |

## ✅ Como testar

Teste manual, na ordem:

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Sidebar → **Financeiro** | Painel do mês atual, cards zerados, "Nenhuma transação neste mês." |
| 2 | **Nova transação** → Salvar sem preencher | Erros em Descrição e Valor; nada é perdido |
| 3 | Descrição "Salário", tipo **Receita**, valor `6.500,00`, categoria Salário → Salvar | Volta ao painel; Receitas **R$ 6.500,00** e Saldo **R$ 6.500,00** |
| 4 | Nova despesa "Aluguel", `1.800,00`, Moradia | Despesas R$ 1.800,00; Saldo R$ 4.700,00; barra de Moradia em 100% |
| 5 | Nova despesa com data de **outro mês** | O painel abre **naquele** mês, com a despesa |
| 6 | Seta **‹** e **›** | Troca o mês; a URL muda para `?month=…` |
| 7 | Lápis de uma transação → mudar o valor → Salvar | Valor e totais atualizados |
| 8 | Lixeira → **Esc** | Diálogo fecha; nada é excluído |
| 9 | Lixeira → **Excluir** | Some da lista; totais recalculados |
| 10 | Alternar o tema (sol/lua) | Cores legíveis nos dois temas |
| 11 | Janela com 390 px de largura | Cards empilhados; botões abaixo de cada lançamento |

**Critério de aceite:** os 11 testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `/finance` ainda mostra "Em breve" | Arquivo antigo não substituído, ou cache do dev | Confira o conteúdo; reinicie o `npm run dev` |
| Edição abre "Página não encontrada" | Id inválido ou transação de outra conta | Esperado (isolamento) |
| O mês "pula" um dia ao editar | Data formatada no fuso local | Use `dayToInput`/`formatDay` (UTC) |

## Commit sugerido

```bash
git add "src/app/(private)/finance"
git commit -m "feat(finance): adiciona telas do Financeiro"
```

## Referências

- [Next.js — `page.js` (`searchParams`)](https://nextjs.org/docs/app/api-reference/file-conventions/page)

---

← [Passo anterior](09-componentes.md) · [Índice da fase](README.md) · [Próximo passo](11-registrar-modulo.md) →
