# Passo 08 — Server Actions

> **Fase:** 07 — Novos Módulos\
> **Tempo estimado:** 30 min\
> **Depende de:** [Passo 07](07-api-rest.md)

## Objetivo

Criar as Server Actions de criar, editar e excluir transações: a porta de
entrada usada pelos formulários da tela.

## 💡 O que muda em relação a Projetos

O contrato é o mesmo da Fase 04 (sessão → Zod → serviço; `redirect` fora do
`try`; valores devolvidos em caso de erro). Só há uma diferença, e ela é de
experiência de uso:

💡 Depois de salvar, a pessoa volta para o painel **no mês da transação**.
Se você lançar hoje uma despesa de março, voltar para novembro esconderia o
que acabou de salvar e daria a impressão de que "não salvou". Por isso a
action calcula `redirectTo` a partir do `occurredOn` **já gravado**.

⚠️ `redirectTo` é declarado **antes** do `try` (`let redirectTo: string`) e
preenchido dentro dele. O `redirect()` continua **fora** do `try`, porque ele
funciona lançando uma exceção especial; se estivesse dentro, o `catch` a
engoliria e o redirecionamento nunca aconteceria.

## Pré-requisitos

- Passo 07 concluído.

## Passo a passo

### 1. Criar as actions

`src/modules/finance/actions/transaction.actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireApiSession } from "@/lib/auth/session";
import { AppError, ValidationError, type FieldErrors } from "@/lib/errors/app-error";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import { createTransactionSchema, updateTransactionSchema } from "@/modules/finance";
import {
    createTransaction,
    deleteTransaction,
    updateTransaction,
} from "@/modules/finance/server";

/**
 * Server Actions do Financeiro: mesmo contrato das de Projetos
 * (sessão → validação → serviço). TODA action valida sessão e dados.
 */

export type TransactionFormValues = {
    type: string;
    description: string;
    amountCents: string;
    category: string;
    occurredOn: string;
};

export type TransactionFormState = {
    message?: string;
    fieldErrors?: FieldErrors;
    /** Valores enviados: o React 19 limpa o formulário após a action. */
    values?: TransactionFormValues;
} | null;

function readTransactionForm(formData: FormData): TransactionFormValues {
    const text = (key: string) => String(formData.get(key) ?? "");

    return {
        type: text("type"),
        description: text("description"),
        amountCents: text("amountCents"),
        category: text("category"),
        occurredOn: text("occurredOn"),
    };
}

function toFormState(error: unknown, values?: TransactionFormValues): TransactionFormState {
    if (error instanceof AppError) {
        return { message: error.message, fieldErrors: error.fieldErrors, values };
    }

    console.error("[finance] erro inesperado na action:", error);
    return { message: "Erro inesperado. Tente novamente.", values };
}

/** Depois de salvar, volta para o painel NO MÊS da transação. */
function financeUrlFor(occurredOn: Date) {
    return `/finance?month=${occurredOn.toISOString().slice(0, 7)}`;
}

export async function createTransactionAction(
    _previousState: TransactionFormState,
    formData: FormData,
): Promise<TransactionFormState> {
    const values = readTransactionForm(formData);
    let redirectTo: string;

    try {
        const session = await requireApiSession();
        const parsed = createTransactionSchema.safeParse(values);

        if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));

        const transaction = await createTransaction(session.user.id, parsed.data);
        redirectTo = financeUrlFor(transaction.occurredOn);
    } catch (error) {
        return toFormState(error, values);
    }

    // redirect() fica FORA do try: ele funciona lançando uma exceção especial.
    revalidatePath("/finance");
    redirect(redirectTo);
}

export async function updateTransactionAction(
    id: string,
    _previousState: TransactionFormState,
    formData: FormData,
): Promise<TransactionFormState> {
    const values = readTransactionForm(formData);
    let redirectTo: string;

    try {
        const session = await requireApiSession();
        const transactionId = idSchema.parse(id);
        const parsed = updateTransactionSchema.safeParse(values);

        if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));

        const transaction = await updateTransaction(session.user.id, transactionId, parsed.data);
        redirectTo = financeUrlFor(transaction.occurredOn);
    } catch (error) {
        return toFormState(error, values);
    }

    revalidatePath("/finance");
    redirect(redirectTo);
}

export async function deleteTransactionAction(id: string): Promise<TransactionFormState> {
    try {
        const session = await requireApiSession();

        await deleteTransaction(session.user.id, idSchema.parse(id));
    } catch (error) {
        return toFormState(error);
    }

    revalidatePath("/finance");
    return null;
}
```

💡 O campo do formulário se chama `amountCents`, mas recebe o **texto**
digitado ("1.234,56"). Quem converte é o schema (passo 04). Assim o nome do
campo, o `fieldErrors.amountCents` e o `aria-describedby` do passo 09 usam a
mesma chave, sem tradução no meio do caminho.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/modules/finance/actions/transaction.actions.ts` | Criado | `createTransactionAction`, `updateTransactionAction`, `deleteTransactionAction` |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run typecheck && npm run lint` | Sem erros |

**Critério de aceite:** o typecheck passa. As actions são testadas pela tela
nos passos 10 e 12 (elas precisam do formulário para serem chamadas).

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Variable 'redirectTo' is used before being assigned` | `let` sem atribuição em todos os caminhos | Todo caminho que não preenche `redirectTo` termina em `return` dentro do `catch` |
| Salvar não redireciona | `redirect()` dentro do `try` | Mova para depois do `try/catch` |
| Lista não atualiza depois de salvar | Faltou `revalidatePath("/finance")` | Toda action que altera dados revalida a rota |

## Commit sugerido

```bash
git add src/modules/finance/actions
git commit -m "feat(finance): adiciona Server Actions"
```

## Referências

- [Next.js — Mutating data (Server Functions)](https://nextjs.org/docs/app/getting-started/mutating-data)
- [Next.js — `redirect`](https://nextjs.org/docs/app/api-reference/functions/redirect)

---

← [Passo anterior](07-api-rest.md) · [Índice da fase](README.md) · [Próximo passo](09-componentes.md) →
