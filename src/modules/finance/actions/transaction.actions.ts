"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireApiSession } from "@/lib/auth/session";
import { AppError, ValidationError, type FieldErrors } from "@/lib/errors/app-error";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import { createTransactionSchema, updateTransactionSchema } from "@/modules/finance";
import { createTransaction, deleteTransaction, updateTransaction } from "@/modules/finance/server";

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
    return `/finance/transactions?month=${occurredOn.toISOString().slice(0, 7)}`;
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
