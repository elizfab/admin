# Passo 04 — Schemas e tipos

> **Fase:** 09 — Financeiro → Obra\
> **Tempo estimado:** 40 min\
> **Depende de:** [Passo 03](03-regras.md)

## Objetivo

Criar a "alfândega" do módulo (schemas Zod de cada formulário e rota) e os tipos
com os rótulos em português.

## 💡 Três ajudantes que se repetem

| Ajudante | Faz | 💡 Por quê |
|---|---|---|
| `moneyCents` | `"1.234,56"` ou `123456` → `123456` | Mesmo contrato do Financeiro (Fase 07, passo 04) |
| `optionalText` | `""` → `undefined` | Um campo de formulário vazio chega como `""`; sem isso, o banco guardaria texto vazio em vez de "sem valor" |
| `optionalId` | `""` do `<select>` "Nenhum" → `undefined` | O ambiente é opcional: "nenhum" não pode virar um id inválido |

💡 Os schemas **não** conferem se a fase ou o ambiente pertencem à obra: isso
exige consultar o banco, e por isso fica no serviço (passo 05). O schema só diz
"é um texto não vazio".

## Pré-requisitos

- Passo 03 concluído.

## Passo a passo

### 1. Schemas

`src/modules/construction/schemas/construction.schema.ts`:

```ts
import { z } from "zod";

import { parseMoneyToCents } from "@/lib/money/money";

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
        z.string().trim().max(max, { error: `Máximo de ${max} caracteres.` }).optional(),
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
export type CreateAreaInput = z.output<typeof createAreaSchema>;
export type CreatePhaseInput = z.output<typeof createPhaseSchema>;
export type CreateServiceInput = z.output<typeof createServiceSchema>;
export type UpdateServiceInput = z.output<typeof updateServiceSchema>;
export type CreateServicePaymentInput = z.output<typeof createServicePaymentSchema>;
export type CreatePurchaseInput = z.output<typeof createPurchaseSchema>;
export type CreateGoalInput = z.output<typeof createGoalSchema>;
```

### 2. Tipos e rótulos

`src/modules/construction/types/construction.types.ts`:

```ts
import type { ConstructionTrade, PaymentMethod } from "@/generated/prisma/client";

import type { PurchaseStatus, ServiceStatus } from "../rules/construction.rules";

export type { ConstructionTrade, PaymentMethod, PurchaseStatus, ServiceStatus };

export const tradeLabel: Record<ConstructionTrade, string> = {
    MASON: "Pedreiro",
    CARPENTER: "Carpinteiro",
    TILER: "Azulejista",
    ELECTRICIAN: "Eletricista",
    PLUMBER: "Encanador",
    GUTTER_INSTALLER: "Calheiro",
    PAINTER: "Pintor",
    GLAZIER: "Vidraceiro",
    OTHER: "Outros",
};

export const paymentMethodLabel: Record<PaymentMethod, string> = {
    PIX: "Pix",
    CASH: "Dinheiro",
    DEBIT_CARD: "Cartão de débito",
    CREDIT_CARD: "Cartão de crédito",
    BANK_TRANSFER: "Transferência",
    BOLETO: "Boleto",
};

/** Igual à planilha: "Devendo" até quitar; "Em andamento" quando já há pagamento. */
export const serviceStatusLabel: Record<ServiceStatus, string> = {
    PENDING: "Devendo",
    PARTIAL: "Em andamento",
    PAID: "Quitado",
};

export const purchaseStatusLabel: Record<PurchaseStatus, string> = {
    PENDING: "Pendente",
    INSTALLMENTS: "Parcelado",
    PAID: "Pago",
};

/** Serviço com os valores calculados (o que a tela "Serviços contratados" mostra). */
export type ServiceSummary = {
    id: string;
    label: string; // "Fase 01 | Pedreiro | Reboque" (o "ID automático" da planilha)
    phaseId: string;
    phaseLabel: string;
    areaName: string | null;
    trade: ConstructionTrade;
    professionalName: string | null;
    description: string;
    contractedCents: number;
    paidCents: number;
    remainingCents: number;
    status: ServiceStatus;
};

/** Números do "Dashboard de evolução". Valores em centavos. */
export type ConstructionDashboard = {
    goals: {
        total: number;
        done: number;
        pending: number;
        percent: number;
        byArea: { areaName: string; done: number; total: number; percent: number }[];
    };
    labor: {
        byTrade: { trade: ConstructionTrade; contractedCents: number; remainingCents: number }[];
        contractedCents: number;
        paidCents: number;
        remainingCents: number;
        paidPercent: number;
        servicesCount: number;
    };
    materials: {
        totalCents: number;
        paidCents: number;
        unpaidCents: number;
        installmentPurchasesUnpaidCents: number;
        pendingPurchasesCents: number;
        purchasesCount: number;
        dueThisMonthCents: number;
        paidPercent: number;
    };
    overall: {
        investmentCents: number;
        paidCents: number;
        remainingCents: number;
        paidPercent: number;
        laborSharePercent: number;
        materialsSharePercent: number;
        averagePaidPerDayCents: number | null;
    };
    schedule: { elapsedDays: number; remainingDays: number; percent: number } | null;
};
```

💡 `ServiceSummary.label` é o **"ID (automático)"** da aba Serviços contratados
("Fase 01 | Pedreiro | Construção do eitão"). Ele é montado na leitura, e não
guardado: se você renomear o serviço, o "ID" acompanha.

### 3. API pública (segura para o navegador)

`src/modules/construction/index.ts`:

```ts
// API pública do módulo Obra — parte SEGURA para servidor e navegador.
export * from "./rules/construction.rules";
export * from "./schemas/construction.schema";
export * from "./types/construction.types";
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/modules/construction/schemas/construction.schema.ts` | Criado | Entradas de obra, ambiente, fase, serviço, pagamento, compra, parcela e meta |
| `src/modules/construction/types/construction.types.ts` | Criado | Rótulos, `ServiceSummary`, `ConstructionDashboard` |
| `src/modules/construction/index.ts` | Criado | API pública |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run typecheck && npm run lint` | Sem erros |

**Critério de aceite:** typecheck e lint limpos. Os schemas são exercitados
pelos testes de integração do passo 05.

## Commit sugerido

```bash
git add src/modules/construction/schemas src/modules/construction/types src/modules/construction/index.ts
git commit -m "feat(obra): schemas Zod e tipos"
```

## Referências

- [Zod 4 — `z.preprocess`](https://zod.dev/api#preprocess)

---

← [Passo anterior](03-regras.md) · [Índice da fase](README.md) · [Próximo passo](05-servicos.md) →
