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
