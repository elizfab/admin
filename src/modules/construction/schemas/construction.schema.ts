import { z } from "zod";

import { parseMoneyToCents } from "@/lib/money/money";

import { OBRA_CATEGORIAS, obraCategoriaIds } from "../constants/categories";

/*
 * Listas fechadas espelhadas do schema.prisma (este arquivo vai ao navegador
 * pelos formulários; o client do Prisma não pode ir). Mude as duas juntas.
 */
export const constructionTradeValues = [
    "MASON",
    "CARPENTER",
    "TILER",
    "ELECTRICIAN",
    "PLUMBER",
    "GUTTER_INSTALLER",
    "PAINTER",
    "GLAZIER",
    "OTHER",
] as const;

export const paymentMethodValues = [
    "PIX",
    "CASH",
    "DEBIT_CARD",
    "CREDIT_CARD",
    "BANK_TRANSFER",
    "BOLETO",
] as const;

/** Teto por valor: R$ 10.000.000,00 (igual ao Financeiro). */
export const MAX_CENTS = 1_000_000_000;

/** Aceita centavos (API) ou texto "1.234,56" (formulário) e entrega centavos. */
const moneyCents = z.preprocess(
    (value) => (typeof value === "string" ? parseMoneyToCents(value) : value),
    z
        .number({ error: "Informe um valor válido, por exemplo 1.234,56." })
        .int({ error: "Informe o valor em centavos (número inteiro)." })
        .positive({ error: "O valor precisa ser maior que zero." })
        .max(MAX_CENTS, { error: "O valor máximo é R$ 10.000.000,00." }),
);

const isoDay = z.iso
    .date({ error: "Informe uma data válida." })
    .transform((value) => new Date(`${value}T00:00:00.000Z`));

/** Texto opcional do formulário: "" vira undefined. */
const optionalText = (max: number) =>
    z.preprocess(
        (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
        z
            .string()
            .trim()
            .max(max, { error: `Máximo de ${max} caracteres.` })
            .optional(),
    );

/** Id opcional vindo de um <select> ("" = nenhum). */
const optionalId = z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(1).optional(),
);

const requiredId = (message: string) => z.string({ error: message }).min(1, { error: message });

// ─── Obra, ambientes e fases ──────────────────────────────────

export const createProjectSchema = z.object({
    name: z.string().trim().min(2, { error: "Informe o nome da obra." }).max(80),
    startDate: isoDay.optional(),
    plannedEndDate: isoDay.optional(),
    categoryIds: z.array(z.enum(obraCategoriaIds)).max(OBRA_CATEGORIAS.length).optional(),
});

export const updateProjectSchema = z
    .object({
        name: z.string().trim().min(2, { error: "Informe o nome da obra." }).max(80),
        startDate: isoDay.nullable(),
        plannedEndDate: isoDay.nullable(),
        categoryIds: z.array(z.enum(obraCategoriaIds)).max(OBRA_CATEGORIAS.length),
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        error: "Informe ao menos um campo para atualizar.",
    });

export const createAreaSchema = z.object({
    name: z.string().trim().min(2, { error: "Informe o nome do ambiente." }).max(60),
});

export const createPhaseSchema = z.object({
    number: z.coerce
        .number({ error: "Informe o número da fase." })
        .int()
        .min(1, { error: "A fase começa em 1." })
        .max(99),
    name: optionalText(60),
});

// ─── Serviços contratados ─────────────────────────────────────

const serviceFields = {
    phaseId: requiredId("Escolha a fase."),
    areaId: optionalId,
    trade: z.enum(constructionTradeValues, { error: "Escolha a profissão." }),
    professionalName: optionalText(80),
    description: z
        .string({ error: "Informe a descrição do serviço." })
        .trim()
        .min(2, { error: "A descrição precisa ter pelo menos 2 caracteres." })
        .max(120),
    contractedCents: moneyCents,
    notes: optionalText(500),
};

export const createServiceSchema = z.object(serviceFields);

export const updateServiceSchema = z
    .object(serviceFields)
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        error: "Informe ao menos um campo para atualizar.",
    });

// ─── Pagamentos de serviço ────────────────────────────────────

export const createServicePaymentSchema = z.object({
    serviceId: requiredId("Escolha o serviço."),
    paidOn: isoDay,
    amountCents: moneyCents,
    method: z.enum(paymentMethodValues, { error: "Escolha a forma de pagamento." }),
    notes: optionalText(500),
});

// ─── Compras de material ──────────────────────────────────────

export const createPurchaseSchema = z.object({
    areaId: optionalId,
    item: z.string().trim().min(2, { error: "Informe o item." }).max(120),
    supplier: optionalText(80),
    purchasedOn: isoDay,
    totalCents: moneyCents,
    method: z.enum(paymentMethodValues, { error: "Escolha a forma de pagamento." }),
    installmentsCount: z.coerce
        .number({ error: "Informe o número de parcelas." })
        .int()
        .min(1, { error: "Mínimo de 1 parcela." })
        .max(24, { error: "Máximo de 24 parcelas." }),
    /** 1º vencimento (cartão/boleto). Ausente = 1 mês depois da compra. */
    firstDueOn: isoDay.optional(),
    notes: optionalText(500),
});

export const payInstallmentSchema = z.object({ paidOn: isoDay });

// ─── Metas ────────────────────────────────────────────────────

export const createGoalSchema = z.object({
    title: z.string().trim().min(2, { error: "Descreva a meta." }).max(160),
    areaId: optionalId,
});

export const setGoalDoneSchema = z.object({
    done: z.boolean({ error: "Informe done: true ou false." }),
});

export type CreateProjectInput = z.output<typeof createProjectSchema>;
export type UpdateProjectInput = z.output<typeof updateProjectSchema>;
export type CreateAreaInput = z.output<typeof createAreaSchema>;
export type CreatePhaseInput = z.output<typeof createPhaseSchema>;
export type CreateServiceInput = z.output<typeof createServiceSchema>;
export type UpdateServiceInput = z.output<typeof updateServiceSchema>;
export type CreateServicePaymentInput = z.output<typeof createServicePaymentSchema>;
export type CreatePurchaseInput = z.output<typeof createPurchaseSchema>;
export type CreateGoalInput = z.output<typeof createGoalSchema>;
