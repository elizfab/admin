import { monthRange } from "@/lib/dates/month";
import { NotFoundError } from "@/lib/errors/app-error";
import { CreateTransactionInput, MonthlySummary, UpdateTransactionInput } from "..";
import { transactionRepository } from "../repositories/transaction.repository";


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
