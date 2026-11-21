/**
 * Utilitários de MÊS ("2026-11") e de DATA SEM HORA ("2026-11-17").
 *
 * Datas sem hora são guardadas como meia-noite em UTC (@db.Date no Prisma).
 * Por isso, ao exibir, formate em UTC: em America/Sao_Paulo (UTC-3), a
 * meia-noite UTC do dia 17 ainda é dia 16 às 21h, e a data apareceria errada.
 */

export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const TIME_ZONE = "America/Sao_Paulo";

/** Mês atual no fuso da usuária, no formato "AAAA-MM". */
export function currentMonth(now = new Date()): string {
    // en-CA formata como AAAA-MM-DD.
    return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now).slice(0, 7);
}

/** Hoje no fuso da usuária, no formato "AAAA-MM-DD" (valor de um <input type="date">). */
export function today(now = new Date()): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

/** Intervalo [início, fim) do mês, em UTC, para filtrar no banco. */
export function monthRange(month: string): { start: Date; end: Date } {
    const [year, monthIndex] = month.split("-").map(Number);

    return {
        start: new Date(Date.UTC(year, monthIndex - 1, 1)),
        end: new Date(Date.UTC(year, monthIndex, 1)),
    };
}

/** "2026-11" + 1 → "2026-12"; "2026-01" - 1 → "2025-12". */
export function shiftMonth(month: string, delta: number): string {
    const [year, monthIndex] = month.split("-").map(Number);
    const date = new Date(Date.UTC(year, monthIndex - 1 + delta, 1));

    return date.toISOString().slice(0, 7);
}

const monthLabelFormatter = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
});

/** "2026-11" → "novembro de 2026". */
export function formatMonth(month: string): string {
    return monthLabelFormatter.format(monthRange(month).start);
}

const dayFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" });

/** Data sem hora vinda do banco → "17/11/2026". */
export function formatDay(date: Date): string {
    return dayFormatter.format(date);
}

/** Data sem hora vinda do banco → "2026-11-17" (valor de um <input type="date">). */
export function dayToInput(date: Date): string {
    return date.toISOString().slice(0, 10);
}
