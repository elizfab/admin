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
    areaId: string | null;
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
