import { centsToInput, formatCents, parseMoneyToCents } from "@/lib/money/money";

// Intl usa espaço não separável entre "R$" e o número; normalizamos para comparar.
const normalize = (text: string) => text.replace(/\s/g, " ");

describe("parseMoneyToCents", () => {
    it.each([
        ["1234", 123400],
        ["1234,5", 123450],
        ["1.234,56", 123456],
        ["R$ 1.234,56", 123456],
        ["1234.56", 123456],
        ["1.234", 123400],
        ["0,01", 1],
        [" 12,30 ", 1230],
    ])("%s → %i centavos", (input, cents) => {
        expect(parseMoneyToCents(input)).toBe(cents);
    });

    it.each(["", "abc", "12,345", "1,2,3", "-10", "12.3.4,5,6"])("recusa %p (NaN)", (input) => {
        expect(parseMoneyToCents(input)).toBeNaN();
    });

    it("não sofre erro de ponto flutuante", () => {
        // parseFloat("0.29") * 100 = 28.999999999999996
        expect(parseMoneyToCents("0,29")).toBe(29);
    });
});

describe("formatação", () => {
    it("formatCents exibe em reais", () => {
        expect(normalize(formatCents(123456))).toBe("R$ 1.234,56");
    });

    it("centsToInput gera o texto do campo, sem símbolo", () => {
        expect(centsToInput(123456)).toBe("1.234,56");
        expect(parseMoneyToCents(centsToInput(123456))).toBe(123456);
    });
});
