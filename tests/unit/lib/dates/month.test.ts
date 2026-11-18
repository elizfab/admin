import {
    currentMonth,
    dayToInput,
    formatDay,
    formatMonth,
    monthRange,
    shiftMonth,
    today,
} from "@/lib/dates/month";

describe("utilitários de mês", () => {
    it("monthRange devolve [1º dia, 1º dia do mês seguinte) em UTC", () => {
        const { start, end } = monthRange("2026-12");

        expect(start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
        expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
    });

    it("shiftMonth atravessa a virada do ano", () => {
        expect(shiftMonth("2026-01", -1)).toBe("2025-12");
        expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    });

    it("currentMonth e today usam o fuso de São Paulo", () => {
        // 01/12 às 01h UTC ainda é 30/11 às 22h em São Paulo.
        const instant = new Date("2026-12-01T01:00:00.000Z");

        expect(currentMonth(instant)).toBe("2026-11");
        expect(today(instant)).toBe("2026-11-30");
    });

    it("formatMonth escreve o mês por extenso", () => {
        expect(formatMonth("2026-11")).toBe("novembro de 2026");
    });

    it("datas sem hora não 'voltam um dia' ao formatar", () => {
        const day = new Date("2026-11-17T00:00:00.000Z");

        expect(formatDay(day)).toBe("17/11/2026");
        expect(dayToInput(day)).toBe("2026-11-17");
    });
});
