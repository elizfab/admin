# Passo 09 — Componentes

> **Fase:** 07 — Novos Módulos\
> **Tempo estimado:** 1h30\
> **Depende de:** [Passo 08](08-server-actions.md)

## Objetivo

Criar os 5 componentes do Financeiro: formulário, lista, resumo do mês,
navegação entre meses e botão de exclusão. Todos com tokens de tema (sem cor
fixa) e acessíveis.

## 💡 Quem roda onde

| Componente | Tipo | 💡 Por quê |
|---|---|---|
| `TransactionForm` | Client (`"use client"`) | Usa `useActionState` (estado do envio e dos erros) |
| `DeleteTransactionButton` | Client | Abre e fecha o diálogo de confirmação |
| `TransactionList` | Server | Só exibe dados; nenhum JavaScript vai ao navegador |
| `MonthlySummary` | Server | Idem |
| `MonthNavigator` | Server | Troca de mês por **links**, sem estado no navegador |

💡 Por que o mês fica na URL (`?month=2026-11`) e não num `useState`? A URL é
a "memória" que todo mundo enxerga: dá para favoritar, compartilhar, usar o
botão voltar do navegador e recarregar sem perder o mês. E a página continua
sendo Server Component, buscando os dados no servidor.

### Acessibilidade aplicada (o axe confere no passo 12)

| Situação | Solução |
|---|---|
| Valor de receita/despesa diferenciado por cor | Também por **sinal** (`+`/`−`) e por texto oculto ("Receita:"/"Despesa:") para leitor de tela. A cor nunca é a única pista |
| Grupo de opções "Tipo" | `<fieldset>` + `<legend>`: o leitor anuncia "Tipo, Receita, botão de opção 1 de 2" |
| Cards do resumo | `<dl>`/`<dt>`/`<dd>`: pares nome → valor |
| Barras de categoria | `aria-hidden`: são decoração; o valor e o percentual estão em texto |
| Botões só com ícone | `aria-label` com o nome da transação ("Editar a transação Uber") |
| Valor no celular | `inputMode="decimal"`: abre o teclado numérico, mas aceita vírgula e ponto |

## Pré-requisitos

- Passo 08 concluído.

## Passo a passo

### 1. Formulário

`src/modules/finance/components/TransactionForm/TransactionForm.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, buttonClassName } from "@/components/ui/Button/Button";
import { dayToInput } from "@/lib/dates/month";
import { centsToInput } from "@/lib/money/money";

import type { TransactionFormState } from "../../actions/transaction.actions";
import {
    transactionCategoryValues,
    transactionTypeValues,
} from "../../schemas/transaction.schema";
import {
    transactionCategoryLabel,
    transactionTypeLabel,
    type Transaction,
} from "../../types/transaction.types";
import styles from "./TransactionForm.module.scss";

type TransactionFormProps = {
    action: (state: TransactionFormState, formData: FormData) => Promise<TransactionFormState>;
    transaction?: Pick<
        Transaction,
        "type" | "description" | "amountCents" | "category" | "occurredOn"
    >;
    /** Data inicial ("AAAA-MM-DD") quando é uma transação nova. */
    defaultDate: string;
    cancelHref: string;
    submitLabel: string;
};

export function TransactionForm({
    action,
    transaction,
    defaultDate,
    cancelHref,
    submitLabel,
}: TransactionFormProps) {
    const [state, formAction, pending] = useActionState(action, null);
    const errors = state?.fieldErrors;
    // Depois de um erro, mostra o que foi enviado; senão, os dados atuais (edição).
    const values = state?.values ?? {
        type: transaction?.type ?? "EXPENSE",
        description: transaction?.description ?? "",
        amountCents: transaction ? centsToInput(transaction.amountCents) : "",
        category: transaction?.category ?? "OTHER",
        occurredOn: transaction ? dayToInput(transaction.occurredOn) : defaultDate,
    };

    return (
        <form action={formAction} className={styles.form} noValidate>
            {state?.message && (
                <p className={styles.formError} role="alert">
                    {state.message}
                </p>
            )}

            {/* fieldset + legend: o leitor de tela anuncia "Tipo" ao entrar nas opções. */}
            <fieldset className={styles.field}>
                <legend>Tipo *</legend>
                <div className={styles.radioGroup}>
                    {transactionTypeValues.map((type) => (
                        <label key={type} className={styles.radio}>
                            <input
                                type="radio"
                                name="type"
                                value={type}
                                defaultChecked={values.type === type}
                            />
                            {transactionTypeLabel[type]}
                        </label>
                    ))}
                </div>
                {errors?.type && <p className={styles.fieldError}>{errors.type[0]}</p>}
            </fieldset>

            <div className={styles.field}>
                <label htmlFor="description">Descrição *</label>
                <input
                    id="description"
                    name="description"
                    defaultValue={values.description}
                    required
                    maxLength={120}
                    aria-invalid={Boolean(errors?.description)}
                    aria-describedby={errors?.description ? "description-error" : undefined}
                />
                {errors?.description && (
                    <p id="description-error" className={styles.fieldError}>
                        {errors.description[0]}
                    </p>
                )}
            </div>

            <div className={styles.row}>
                <div className={styles.field}>
                    <label htmlFor="amountCents">Valor (R$) *</label>
                    {/* text + inputMode: aceita "1.234,56" e abre o teclado numérico no celular. */}
                    <input
                        id="amountCents"
                        name="amountCents"
                        inputMode="decimal"
                        placeholder="0,00"
                        defaultValue={values.amountCents}
                        required
                        aria-invalid={Boolean(errors?.amountCents)}
                        aria-describedby={errors?.amountCents ? "amountCents-error" : undefined}
                    />
                    {errors?.amountCents && (
                        <p id="amountCents-error" className={styles.fieldError}>
                            {errors.amountCents[0]}
                        </p>
                    )}
                </div>

                <div className={styles.field}>
                    <label htmlFor="occurredOn">Data *</label>
                    <input
                        id="occurredOn"
                        name="occurredOn"
                        type="date"
                        defaultValue={values.occurredOn}
                        required
                        aria-invalid={Boolean(errors?.occurredOn)}
                        aria-describedby={errors?.occurredOn ? "occurredOn-error" : undefined}
                    />
                    {errors?.occurredOn && (
                        <p id="occurredOn-error" className={styles.fieldError}>
                            {errors.occurredOn[0]}
                        </p>
                    )}
                </div>
            </div>

            <div className={styles.field}>
                <label htmlFor="category">Categoria</label>
                <select id="category" name="category" defaultValue={values.category}>
                    {transactionCategoryValues.map((category) => (
                        <option key={category} value={category}>
                            {transactionCategoryLabel[category]}
                        </option>
                    ))}
                </select>
            </div>

            <div className={styles.actions}>
                <Link href={cancelHref} className={buttonClassName("secondary")}>
                    Cancelar
                </Link>
                <Button type="submit" disabled={pending}>
                    {pending ? "Salvando…" : submitLabel}
                </Button>
            </div>
        </form>
    );
}
```

`src/modules/finance/components/TransactionForm/TransactionForm.module.scss`:

```scss
@use "@/styles/abstracts" as *;

// Mesma base visual do ProjectForm, mais o grupo de rádios e a linha de 2 campos.
.form {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  max-width: 640px;
  padding: $space-5;
  background: var(--card-background);
  border: 1px solid var(--border);
  border-radius: $radius-lg;
}

.field {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: $space-1;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;

  > label,
  legend {
    padding: 0;
    font-size: $font-size-sm;
    font-weight: 600;
  }

  input:not([type="radio"]),
  select {
    padding: $space-3;
    font: inherit;
    color: var(--text-color);
    background: var(--card-background);
    border: 1px solid var(--border);
    border-radius: $radius-sm;

    &:focus-visible {
      @include focus-ring;
    }

    &[aria-invalid="true"] {
      border-color: var(--red);
    }
  }
}

.row {
  display: flex;
  flex-direction: column;
  gap: $space-4;

  @include up("md") {
    flex-direction: row;
  }
}

.radioGroup {
  display: flex;
  gap: $space-4;
  margin-top: $space-1;
}

.radio {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  cursor: pointer;

  input {
    accent-color: var(--accent-color);

    &:focus-visible {
      @include focus-ring;
    }
  }
}

.fieldError {
  margin: 0;
  font-size: $font-size-sm;
  color: var(--red);
}

.formError {
  margin: 0;
  padding: $space-2 $space-3;
  color: var(--red);
  background: color-mix(in srgb, var(--red) 10%, transparent);
  border-radius: $radius-sm;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
}
```

💡 Por que não `type="number"` no valor? Ele não aceita "1.234,56" (vírgula
brasileira) em vários navegadores, troca o valor ao girar a roda do mouse e
mostra setinhas sem sentido para dinheiro. `inputMode="decimal"` dá o teclado
certo sem essas armadilhas; quem valida é o schema.

### 2. Exclusão com confirmação

É o `DeleteProjectButton` da Fase 04 com os nomes trocados:

`src/modules/finance/components/DeleteTransactionButton/DeleteTransactionButton.tsx`:

```tsx
"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/AlertDialog/AlertDialog";
import { Button } from "@/components/ui/Button/Button";

import { deleteTransactionAction } from "../../actions/transaction.actions";

type DeleteTransactionButtonProps = {
    transactionId: string;
    description: string;
};

export function DeleteTransactionButton({ transactionId, description }: DeleteTransactionButtonProps) {
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function handleConfirm() {
        startTransition(async () => {
            const result = await deleteTransactionAction(transactionId);

            if (result?.message) {
                setError(result.message);
                return;
            }

            setOpen(false);
        });
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="secondary" aria-label={`Excluir a transação ${description}`}>
                    <Trash2 size={16} aria-hidden="true" />
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                <AlertDialogDescription>
                    A transação “{description}” será excluída permanentemente. Esta ação não pode ser
                    desfeita.
                </AlertDialogDescription>

                {error && <p role="alert">{error}</p>}

                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                        <Button variant="secondary">Cancelar</Button>
                    </AlertDialogCancel>
                    {/* Botão comum (e não AlertDialogAction) para o diálogo só fechar após o sucesso. */}
                    <Button variant="danger" onClick={handleConfirm} disabled={pending}>
                        {pending ? "Excluindo…" : "Excluir"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
```

### 3. Lista

`src/modules/finance/components/TransactionList/TransactionList.tsx`:

```tsx
import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/Button/Button";
import { formatDay } from "@/lib/dates/month";
import { formatCents } from "@/lib/money/money";
import { cn } from "@/lib/utils/cn";

import {
    transactionCategoryLabel,
    transactionTypeLabel,
    type Transaction,
} from "../../types/transaction.types";
import { DeleteTransactionButton } from "../DeleteTransactionButton/DeleteTransactionButton";
import styles from "./TransactionList.module.scss";

type TransactionListProps = {
    transactions: Transaction[];
};

export function TransactionList({ transactions }: TransactionListProps) {
    return (
        <ul className={styles.list}>
            {transactions.map((transaction) => {
                const isIncome = transaction.type === "INCOME";

                return (
                    <li key={transaction.id} className={styles.item}>
                        <div className={styles.info}>
                            <p className={styles.description}>{transaction.description}</p>
                            <p className={styles.meta}>
                                {formatDay(transaction.occurredOn)} ·{" "}
                                {transactionCategoryLabel[transaction.category]}
                            </p>
                        </div>

                        {/* A cor não é a única pista: há sinal (+/−) e o tipo para leitores de tela. */}
                        <p className={cn(styles.amount, isIncome ? styles.income : styles.expense)}>
                            <span className="visually-hidden">
                                {transactionTypeLabel[transaction.type]}:{" "}
                            </span>
                            <span aria-hidden="true">{isIncome ? "+ " : "− "}</span>
                            {formatCents(transaction.amountCents)}
                        </p>

                        <div className={styles.actions}>
                            <Link
                                href={`/finance/transactions/${transaction.id}/edit`}
                                className={buttonClassName("secondary")}
                                aria-label={`Editar a transação ${transaction.description}`}
                            >
                                <Pencil size={16} aria-hidden="true" />
                            </Link>
                            <DeleteTransactionButton
                                transactionId={transaction.id}
                                description={transaction.description}
                            />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
```

`src/modules/finance/components/TransactionList/TransactionList.module.scss`:

```scss
@use "@/styles/abstracts" as *;

.list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  margin: 0;
  padding: 0;
  list-style: none;
}

.item {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: $space-2 $space-4;
  padding: $space-3 $space-4;
  background: var(--card-background);
  border: 1px solid var(--border);
  border-radius: $radius-md;

  @include up("md") {
    grid-template-columns: 1fr auto auto;
  }
}

.info {
  min-width: 0;
}

.description {
  margin: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.meta {
  margin: 0;
  font-size: $font-size-xs;
  color: var(--text-color-secondary);
}

.amount {
  margin: 0;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.income {
  color: var(--green);
}

.expense {
  color: var(--red);
}

.actions {
  display: flex;
  grid-column: 1 / -1;
  justify-content: flex-end;
  gap: $space-2;

  @include up("md") {
    grid-column: auto;
  }
}
```

### 4. Resumo do mês

`src/modules/finance/components/MonthlySummary/MonthlySummary.tsx`:

```tsx
import { formatCents } from "@/lib/money/money";
import { cn } from "@/lib/utils/cn";

import { transactionCategoryLabel, type MonthlySummary as Summary } from "../../types/transaction.types";
import styles from "./MonthlySummary.module.scss";

type MonthlySummaryProps = {
    summary: Summary;
};

export function MonthlySummary({ summary }: MonthlySummaryProps) {
    const { incomeCents, expenseCents, balanceCents, expensesByCategory } = summary;
    const cards = [
        { label: "Receitas", value: incomeCents, tone: styles.income },
        { label: "Despesas", value: expenseCents, tone: styles.expense },
        { label: "Saldo", value: balanceCents, tone: balanceCents < 0 ? styles.expense : undefined },
    ];

    return (
        <section aria-label="Resumo do mês" className={styles.summary}>
            {/* <dl>: pares "nome → valor", o leitor de tela lê "Receitas, R$ 5.000,00". */}
            <dl className={styles.cards}>
                {cards.map((card) => (
                    <div key={card.label} className={styles.card}>
                        <dt>{card.label}</dt>
                        <dd className={cn(styles.value, card.tone)}>{formatCents(card.value)}</dd>
                    </div>
                ))}
            </dl>

            {expensesByCategory.length > 0 && (
                <div className={styles.categories}>
                    <h3>Despesas por categoria</h3>
                    <ul>
                        {expensesByCategory.map(({ category, totalCents }) => {
                            const percent = Math.round((totalCents / expenseCents) * 100);

                            return (
                                <li key={category}>
                                    <span className={styles.categoryName}>
                                        {transactionCategoryLabel[category]}
                                    </span>
                                    <span className={styles.categoryValue}>
                                        {formatCents(totalCents)} ({percent}%)
                                    </span>
                                    {/* Barra só decorativa: o número acima já diz tudo. */}
                                    <span className={styles.bar} aria-hidden="true">
                                        <span style={{ width: `${percent}%` }} />
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </section>
    );
}
```

`src/modules/finance/components/MonthlySummary/MonthlySummary.module.scss`:

```scss
@use "@/styles/abstracts" as *;

.summary {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-3;
  margin: 0;

  @include up("md") {
    grid-template-columns: repeat(3, 1fr);
  }
}

.card {
  padding: $space-4;
  background: var(--card-background);
  border: 1px solid var(--border);
  border-radius: $radius-lg;

  dt {
    font-size: $font-size-sm;
    color: var(--text-color-secondary);
  }

  dd {
    margin: $space-1 0 0;
  }
}

.value {
  font-size: $font-size-xl;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.income {
  color: var(--green);
}

.expense {
  color: var(--red);
}

.categories {
  padding: $space-4;
  background: var(--card-background);
  border: 1px solid var(--border);
  border-radius: $radius-lg;

  h3 {
    margin: 0 0 $space-3;
    font-size: $font-size-md;
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: $space-3;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: $space-1;
  }
}

.categoryName {
  font-size: $font-size-sm;
}

.categoryValue {
  font-size: $font-size-sm;
  font-variant-numeric: tabular-nums;
  color: var(--text-color-secondary);
}

.bar {
  grid-column: 1 / -1;
  height: 6px;
  overflow: hidden;
  background: var(--background);
  border-radius: 999px;

  span {
    display: block;
    height: 100%;
    background: var(--red);
    border-radius: inherit;
  }
}
```

💡 O `style={{ width: ... }}` é o único estilo inline do módulo. Ele não
fere a regra do `AGENTS.md` (que proíbe **cores** fixas): define um
**tamanho calculado** a cada render, algo que um arquivo SCSS não sabe. As
cores continuam vindo dos tokens (`var(--red)`, `var(--green)`).

### 5. Navegação entre meses

`src/modules/finance/components/MonthNavigator/MonthNavigator.tsx`:

```tsx
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/Button/Button";
import { formatMonth, shiftMonth } from "@/lib/dates/month";

import styles from "./MonthNavigator.module.scss";

type MonthNavigatorProps = {
    month: string;
};

/**
 * Troca de mês por LINKS (?month=AAAA-MM), e não por estado no navegador:
 * a página continua Server Component, o mês fica na URL (dá para favoritar
 * ou compartilhar) e o botão "voltar" do navegador funciona.
 */
export function MonthNavigator({ month }: MonthNavigatorProps) {
    const previous = shiftMonth(month, -1);
    const next = shiftMonth(month, 1);

    return (
        <nav aria-label="Navegar entre meses" className={styles.navigator}>
            <Link
                href={`/finance?month=${previous}`}
                className={buttonClassName("secondary")}
                aria-label={`Mês anterior: ${formatMonth(previous)}`}
            >
                <ChevronLeft size={16} aria-hidden="true" />
            </Link>
            <h2 className={styles.label}>{formatMonth(month)}</h2>
            <Link
                href={`/finance?month=${next}`}
                className={buttonClassName("secondary")}
                aria-label={`Próximo mês: ${formatMonth(next)}`}
            >
                <ChevronRight size={16} aria-hidden="true" />
            </Link>
        </nav>
    );
}
```

`src/modules/finance/components/MonthNavigator/MonthNavigator.module.scss`:

```scss
@use "@/styles/abstracts" as *;

.navigator {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.label {
  min-width: 12ch;
  margin: 0;
  font-size: $font-size-lg;
  text-align: center;
  // "novembro de 2026" → "Novembro de 2026"
  &::first-letter {
    text-transform: uppercase;
  }
}
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/modules/finance/components/TransactionForm/*` | Criado | Formulário de criar/editar |
| `src/modules/finance/components/DeleteTransactionButton/*` | Criado | Exclusão com diálogo |
| `src/modules/finance/components/TransactionList/*` | Criado | Lista do mês |
| `src/modules/finance/components/MonthlySummary/*` | Criado | Cards e despesas por categoria |
| `src/modules/finance/components/MonthNavigator/*` | Criado | Mês anterior/próximo |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run typecheck && npm run lint` | Sem erros |
| 2 | `grep -rnE "#[0-9a-fA-F]{3,6}\b" src/modules/finance` | Nenhuma cor fixa |

**Critério de aceite:** typecheck e lint passam e não há cor fixa no módulo.
Os componentes aparecem na tela no passo 10.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `useActionState is not a function` | Faltou `"use client"` no formulário | Primeira linha do arquivo |
| `You're importing a component that needs "server-only"` | Componente client importou `@/modules/finance/server` | Client só importa de `@/modules/finance` (index) e das actions |
| Data do campo de edição um dia antes | Converteu com fuso local | Use `dayToInput()` (UTC), do passo 03 |

## Commit sugerido

```bash
git add src/modules/finance/components
git commit -m "feat(finance): adiciona componentes"
```

## Referências

- [React — `useActionState`](https://react.dev/reference/react/useActionState)
- [WCAG 2.1 — 1.4.1 Uso de cor](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html)
- [MDN — `inputmode`](https://developer.mozilla.org/pt-BR/docs/Web/HTML/Global_attributes/inputmode)

---

← [Passo anterior](08-server-actions.md) · [Índice da fase](README.md) · [Próximo passo](10-telas.md) →
