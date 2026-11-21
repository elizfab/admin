/**
 * Regras PURAS da obra (sem banco): fáceis de testar e iguais em qualquer tela.
 * Tudo em centavos e em datas sem hora (meia-noite UTC), como no Financeiro.
 */

export type ServiceStatus = "PENDING" | "PARTIAL" | "PAID";
export type PurchaseStatus = "PENDING" | "INSTALLMENTS" | "PAID";

/** Status de um serviço: nada pago, pago em parte ou quitado. */
export function serviceStatus(contractedCents: number, paidCents: number): ServiceStatus {
    if (paidCents >= contractedCents) return "PAID";
    if (paidCents > 0) return "PARTIAL";
    return "PENDING";
}

/** Formas de pagamento em que o dinheiro sai NA HORA (1 parcela já paga). */
export const INSTANT_METHODS = ["PIX", "CASH", "DEBIT_CARD", "BANK_TRANSFER"] as const;

export function isInstantMethod(method: string) {
    return (INSTANT_METHODS as readonly string[]).includes(method);
}

/** Soma N meses a uma data UTC; 31/01 + 1 mês = 28/02 (último dia do mês). */
export function addMonths(date: Date, months: number): Date {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + months;
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)));
}

export type PlannedInstallment = { number: number; dueOn: Date; amountCents: number };

/**
 * Divide o total em N parcelas mensais, a partir de firstDueOn.
 * Os centavos que sobram da divisão vão para a 1ª parcela, para a soma
 * bater EXATAMENTE com o total (R$ 100,00 em 3x = 33,34 + 33,33 + 33,33).
 */
export function splitInstallments(
    totalCents: number,
    count: number,
    firstDueOn: Date,
): PlannedInstallment[] {
    const base = Math.floor(totalCents / count);
    const remainder = totalCents - base * count;

    return Array.from({ length: count }, (_, index) => ({
        number: index + 1,
        dueOn: addMonths(firstDueOn, index),
        amountCents: base + (index === 0 ? remainder : 0),
    }));
}

/** Status de uma compra a partir das parcelas. */
export function purchaseStatus(installments: { paidOn: Date | null }[]): PurchaseStatus {
    const unpaid = installments.filter((installment) => installment.paidOn === null).length;

    if (unpaid === 0) return "PAID";
    if (installments.length > 1) return "INSTALLMENTS";
    return "PENDING";
}

/** Porcentagem inteira (0–100) sem divisão por zero. */
export function percent(part: number, total: number): number {
    if (total <= 0) return 0;
    return Math.min(100, Math.round((part / total) * 100));
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Cronograma: dias decorridos, restantes e % do prazo. null sem as duas datas. */
export function scheduleProgress(startDate: Date | null, plannedEndDate: Date | null, today: Date) {
    if (!startDate || !plannedEndDate) return null;

    const totalDays = Math.max(
        1,
        Math.round((plannedEndDate.getTime() - startDate.getTime()) / DAY_MS),
    );
    const elapsedDays = Math.max(0, Math.round((today.getTime() - startDate.getTime()) / DAY_MS));

    return {
        elapsedDays,
        remainingDays: Math.max(0, totalDays - elapsedDays),
        percent: percent(elapsedDays, totalDays),
    };
}

/** "Fase 01". */
export function phaseLabel(number: number) {
    return `Fase ${String(number).padStart(2, "0")}`;
}
