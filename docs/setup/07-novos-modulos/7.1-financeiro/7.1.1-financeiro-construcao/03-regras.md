# Passo 03 — Regras puras

> **Fase:** 09 — Financeiro → Obra\
> **Tempo estimado:** 40 min\
> **Depende de:** [Passo 02](02-modelo-de-dados.md)

## Objetivo

Escrever, **sem banco**, as contas que a planilha fazia com fórmulas: status do
serviço, divisão em parcelas, vencimentos, status da compra, porcentagens e
cronograma. Com 11 testes.

## 💡 Por que regras "puras"

💡 Uma regra pura é uma **calculadora**: recebe números, devolve números, não
depende de banco, de data do relógio nem de tela. Por isso ela é testada em
milissegundos e usada igual no servidor e no navegador (o formulário de compra
pode mostrar a prévia das parcelas com a **mesma** função).

### As três contas que mais erram em planilha

| Conta | Erro comum | Como a regra evita |
|---|---|---|
| R$ 100,00 em 3x | 33,33 × 3 = 99,99 (some 1 centavo) | Divide em centavos inteiros e põe a sobra na **1ª** parcela: 33,34 + 33,33 + 33,33 |
| Vencimento de 31/01 + 1 mês | "31/02" vira 03/03 | `addMonths` limita ao último dia do mês: **28/02** |
| % com total zero | `#DIV/0!` | `percent` devolve 0 |

## Pré-requisitos

- Passo 02 concluído.

## Passo a passo

### 1. Criar as regras

`src/modules/construction/rules/construction.rules.ts`:

```ts
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
export function scheduleProgress(
    startDate: Date | null,
    plannedEndDate: Date | null,
    today: Date,
) {
    if (!startDate || !plannedEndDate) return null;

    const totalDays = Math.max(1, Math.round((plannedEndDate.getTime() - startDate.getTime()) / DAY_MS));
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
```

### 2. Criar os testes

`tests/unit/modules/construction/construction.rules.test.ts`:

```ts
import {
    addMonths,
    percent,
    phaseLabel,
    purchaseStatus,
    scheduleProgress,
    serviceStatus,
    splitInstallments,
} from "@/modules/construction/rules/construction.rules";

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const iso = (date: Date) => date.toISOString().slice(0, 10);

describe("serviceStatus", () => {
    it.each([
        [360000, 0, "PENDING"],
        [360000, 60000, "PARTIAL"],
        [360000, 360000, "PAID"],
    ])("contratado %i, pago %i → %s", (contracted, paid, status) => {
        expect(serviceStatus(contracted, paid)).toBe(status);
    });
});

describe("splitInstallments", () => {
    it("a soma das parcelas é exatamente o total (sobra na 1ª)", () => {
        const parts = splitInstallments(10000, 3, day("2025-11-10"));

        expect(parts.map((p) => p.amountCents)).toEqual([3334, 3333, 3333]);
        expect(parts.reduce((sum, p) => sum + p.amountCents, 0)).toBe(10000);
    });

    it("vence uma vez por mês a partir da 1ª data", () => {
        const parts = splitInstallments(115956, 3, day("2025-10-29"));

        expect(parts.map((p) => iso(p.dueOn))).toEqual(["2025-10-29", "2025-11-29", "2025-12-29"]);
    });

    it("1x = uma parcela com o valor inteiro", () => {
        expect(splitInstallments(16000, 1, day("2025-11-24"))).toEqual([
            { number: 1, dueOn: day("2025-11-24"), amountCents: 16000 },
        ]);
    });
});

describe("addMonths", () => {
    it("31/01 + 1 mês = 28/02; + 1 ano atravessa dezembro", () => {
        expect(iso(addMonths(day("2026-01-31"), 1))).toBe("2026-02-28");
        expect(iso(addMonths(day("2025-12-15"), 1))).toBe("2026-01-15");
    });
});

describe("purchaseStatus", () => {
    it("todas pagas = PAID; parcelada com pendência = INSTALLMENTS; 1x pendente = PENDING", () => {
        expect(purchaseStatus([{ paidOn: day("2025-10-08") }])).toBe("PAID");
        expect(purchaseStatus([{ paidOn: day("2025-11-01") }, { paidOn: null }])).toBe("INSTALLMENTS");
        expect(purchaseStatus([{ paidOn: null }])).toBe("PENDING");
    });
});

describe("percent e cronograma", () => {
    it("percent arredonda, limita a 100 e não divide por zero", () => {
        expect(percent(3600, 19805)).toBe(18);
        expect(percent(5, 0)).toBe(0);
        expect(percent(200, 100)).toBe(100);
    });

    it("scheduleProgress conta dias e porcentagem do prazo", () => {
        expect(scheduleProgress(day("2025-10-01"), day("2025-12-30"), day("2025-11-15"))).toEqual({
            elapsedDays: 45,
            remainingDays: 45,
            percent: 50,
        });
        expect(scheduleProgress(null, day("2025-12-30"), day("2025-11-15"))).toBeNull();
    });

    it("phaseLabel usa dois dígitos", () => {
        expect(phaseLabel(1)).toBe("Fase 01");
        expect(phaseLabel(12)).toBe("Fase 12");
    });
});
```

💡 O teste da compra de **R$ 1.159,56 em 3x** usa um valor real da sua
planilha (Construmarques, 29/09/2025).

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/modules/construction/rules/construction.rules.ts` | Criado | Regras puras |
| `tests/unit/modules/construction/construction.rules.test.ts` | Criado | 11 testes |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npx jest tests/unit/modules/construction` | `Tests: 11 passed` |

**Critério de aceite:** os 11 testes passam.

## Commit sugerido

```bash
git add src/modules/construction/rules tests/unit/modules/construction
git commit -m "feat(obra): regras puras (status, parcelas, cronograma)"
```

---

← [Passo anterior](02-modelo-de-dados.md) · [Índice da fase](README.md) · [Próximo passo](04-schemas-e-tipos.md) →
