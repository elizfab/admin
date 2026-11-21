import { render, screen, within } from "@testing-library/react";

import { TransactionList } from "@/modules/finance/components/TransactionList/TransactionList";

jest.mock("@/modules/finance/actions/transaction.actions", () => ({
    deleteTransactionAction: jest.fn(),
}));

const base = {
    ownerId: "o1",
    occurredOn: new Date("2026-11-05T00:00:00.000Z"),
    createdAt: new Date(),
    updatedAt: new Date(),
    servicePayment: null,
    materialInstallment: null,
};

const transactions = [
    {
        ...base,
        id: "t1",
        type: "INCOME",
        description: "Salário",
        amountCents: 500000,
        category: "SALARY",
    },
    {
        ...base,
        id: "t2",
        type: "EXPENSE",
        description: "Mercado",
        amountCents: 12345,
        category: "FOOD",
    },
    {
        ...base,
        id: "t3",
        type: "EXPENSE",
        description: "Pedreiro — fase 1",
        amountCents: 100000,
        category: "CONSTRUCTION",
        servicePayment: { service: { projectId: "p1", phase: { number: 1 } } },
    },
    {
        ...base,
        id: "t4",
        type: "EXPENSE",
        description: "Telhas — parcela 1/3",
        amountCents: 50000,
        category: "CONSTRUCTION",
        materialInstallment: { purchase: { projectId: "p2" } },
    },
] as never;

function item(description: string) {
    return within(screen.getByText(description).closest("li") as HTMLElement);
}

describe("TransactionList", () => {
    it("receita e despesa: sinal, tipo para leitor de tela, data e categoria (FIN-R10)", () => {
        render(<TransactionList transactions={transactions} />);

        expect(item("Salário").getByText("Receita:", { exact: false })).toBeInTheDocument();
        expect(item("Salário").getByText("+", { exact: false })).toBeInTheDocument();
        expect(item("Mercado").getByText("Despesa:", { exact: false })).toBeInTheDocument();
        expect(item("Mercado").getByText("05/11/2026 · Alimentação")).toBeInTheDocument();
    });

    it("lançamento comum tem editar e excluir", () => {
        render(<TransactionList transactions={transactions} />);

        expect(
            item("Mercado").getByRole("link", { name: "Editar a transação Mercado" }),
        ).toHaveAttribute("href", "/finance/transactions/t2/edit");
        expect(item("Mercado").getByRole("button", { name: /Excluir/ })).toBeInTheDocument();
    });

    it.each([
        ["Pedreiro — fase 1", "/finance/construction/p1/phases/1"],
        ["Telhas — parcela 1/3", "/finance/construction/p2/purchases"],
    ])(
        "lançamento gerado pela Construção (%s): selo e Ver na obra, sem editar (FIN-R09)",
        (description, href) => {
            render(<TransactionList transactions={transactions} />);

            const row = item(description);
            expect(row.getByText("Construção", { selector: "span" })).toBeInTheDocument();
            expect(row.getByRole("link", { name: "Ver na obra" })).toHaveAttribute("href", href);
            expect(row.queryByRole("link", { name: /Editar/ })).not.toBeInTheDocument();
            expect(row.queryByRole("button", { name: /Excluir/ })).not.toBeInTheDocument();
        },
    );
});
