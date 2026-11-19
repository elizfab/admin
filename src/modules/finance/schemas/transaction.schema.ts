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
    occurredOn: z.iso
        .date({ error: "Informe uma data válida." })
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
