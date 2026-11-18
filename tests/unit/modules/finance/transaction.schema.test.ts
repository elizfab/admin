import {
    createTransactionSchema,
    monthSchema,
    updateTransactionSchema,
} from "@/modules/finance/schemas/transaction.schema";

const valid = {
    type: "EXPENSE",
    description: "Mercado",
    amountCents: "1.234,56",
    occurredOn: "2026-11-17",
};

describe("createTransactionSchema", () => {
    it("converte o texto do formulário em centavos e a data em Date (UTC)", () => {
        const data = createTransactionSchema.parse(valid);

        expect(data.amountCents).toBe(123456);
        expect(data.occurredOn.toISOString()).toBe("2026-11-17T00:00:00.000Z");
        expect(data.category).toBe("OTHER");
    });

    it("aceita centavos como número (contrato da API)", () => {
        expect(createTransactionSchema.parse({ ...valid, amountCents: 990 }).amountCents).toBe(990);
    });

    it.each([
        ["", "Informe um valor válido, por exemplo 1.234,56."],
        ["abc", "Informe um valor válido, por exemplo 1.234,56."],
        ["0,00", "O valor precisa ser maior que zero."],
        ["10.000.000,01", "O valor máximo é R$ 10.000.000,00."],
    ])("recusa o valor %p", (amountCents, message) => {
        const result = createTransactionSchema.safeParse({ ...valid, amountCents });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe(message);
    });

    it("recusa centavos fracionados vindos da API", () => {
        expect(createTransactionSchema.safeParse({ ...valid, amountCents: 10.5 }).success).toBe(false);
    });

    it("recusa data inválida e tipo inválido", () => {
        expect(createTransactionSchema.safeParse({ ...valid, occurredOn: "2026-02-30" }).success).toBe(
            false,
        );
        expect(createTransactionSchema.safeParse({ ...valid, type: "TRANSFER" }).success).toBe(false);
    });
});

describe("updateTransactionSchema", () => {
    it("PATCH parcial não aplica o padrão da categoria", () => {
        expect(updateTransactionSchema.parse({ description: "Feira" })).toEqual({
            description: "Feira",
        });
    });

    it("recusa corpo vazio", () => {
        expect(updateTransactionSchema.safeParse({}).success).toBe(false);
    });
});

describe("monthSchema", () => {
    it.each(["2026-11", "2027-01"])("aceita %s", (month) => {
        expect(monthSchema.safeParse(month).success).toBe(true);
    });

    it.each(["2026-13", "2026-1", "nov/2026", ""])("recusa %p", (month) => {
        expect(monthSchema.safeParse(month).success).toBe(false);
    });
});
