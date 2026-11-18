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
