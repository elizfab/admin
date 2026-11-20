import { ConflictError, NotFoundError } from "@/lib/errors/app-error";
import { transactionRepository } from "@/modules/finance/repositories/transaction.repository";
import {
    createTransaction,
    deleteTransaction,
    getMonthlySummary,
    getTransaction,
    listTransactions,
    updateTransaction,
} from "@/modules/finance/services/transaction.service";

// O repositório (banco) é substituído por um dublê: testamos só as REGRAS.
jest.mock("@/modules/finance/repositories/transaction.repository", () => ({
    transactionRepository: {
        listByOwnerInRange: jest.fn(),
        findByIdForOwner: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        sumByType: jest.fn(),
        sumExpensesByCategory: jest.fn(),
    },
}));

const repo = jest.mocked(transactionRepository);
const OWNER = "owner-1";

beforeEach(() => jest.resetAllMocks());

describe("listTransactions", () => {
    it("filtra pela dona e pelo intervalo do mês", async () => {
        repo.listByOwnerInRange.mockResolvedValue([]);

        await listTransactions(OWNER, "2026-11");

        expect(repo.listByOwnerInRange).toHaveBeenCalledWith(OWNER, {
            start: new Date("2026-11-01T00:00:00.000Z"),
            end: new Date("2026-12-01T00:00:00.000Z"),
        });
    });
});

describe("getTransaction / update / delete", () => {
    it("transação de outra pessoa = NotFoundError, e nada é alterado", async () => {
        repo.findByIdForOwner.mockResolvedValue(null);

        await expect(getTransaction("outra", "t1")).rejects.toBeInstanceOf(NotFoundError);
        await expect(updateTransaction("outra", "t1", { description: "x" })).rejects.toBeInstanceOf(
            NotFoundError,
        );
        await expect(deleteTransaction("outra", "t1")).rejects.toBeInstanceOf(NotFoundError);

        expect(repo.update).not.toHaveBeenCalled();
        expect(repo.delete).not.toHaveBeenCalled();
    });
});

describe("createTransaction", () => {
    it("cria com o ownerId recebido (da sessão)", async () => {
        const input = { type: "EXPENSE", description: "Mercado", amountCents: 100 } as never;
        repo.create.mockResolvedValue({ id: "t1" } as never);

        await expect(createTransaction(OWNER, input)).resolves.toEqual({ id: "t1" });
        expect(repo.create).toHaveBeenCalledWith(OWNER, input);
    });
});

describe("update / delete de lançamento comum", () => {
    const comum = { id: "t1", servicePayment: null, materialInstallment: null };

    it("altera a transação da dona", async () => {
        repo.findByIdForOwner.mockResolvedValue(comum as never);
        repo.update.mockResolvedValue({ ...comum, description: "Novo" } as never);

        await updateTransaction(OWNER, "t1", { description: "Novo" });

        expect(repo.update).toHaveBeenCalledWith("t1", { description: "Novo" });
    });

    it("exclui a transação da dona", async () => {
        repo.findByIdForOwner.mockResolvedValue(comum as never);

        await deleteTransaction(OWNER, "t1");

        expect(repo.delete).toHaveBeenCalledWith("t1");
    });
});

describe("lançamento gerado pela Construção (FIN-R09)", () => {
    it.each([
        ["pagamento de serviço", { servicePayment: { id: "sp" }, materialInstallment: null }],
        ["parcela de material", { servicePayment: null, materialInstallment: { id: "mi" } }],
    ])("%s: Financeiro recusa alterar e excluir (409)", async (_origem, origem) => {
        repo.findByIdForOwner.mockResolvedValue({ id: "t1", ...origem } as never);
        const conflict = new ConflictError(
            "Lançamento gerado pela Construção: altere em Financeiro → Construção.",
        );

        await expect(updateTransaction(OWNER, "t1", { description: "x" })).rejects.toThrow(
            conflict,
        );
        await expect(deleteTransaction(OWNER, "t1")).rejects.toThrow(conflict);
        expect(repo.update).not.toHaveBeenCalled();
        expect(repo.delete).not.toHaveBeenCalled();
    });
});

describe("getMonthlySummary", () => {
    it("calcula receitas, despesas e saldo", async () => {
        repo.sumByType.mockResolvedValue([
            { type: "INCOME", _sum: { amountCents: 500000 } },
            { type: "EXPENSE", _sum: { amountCents: 123456 } },
        ] as never);
        repo.sumExpensesByCategory.mockResolvedValue([
            { category: "FOOD", _sum: { amountCents: 123456 } },
        ] as never);

        await expect(getMonthlySummary(OWNER, "2026-11")).resolves.toEqual({
            month: "2026-11",
            incomeCents: 500000,
            expenseCents: 123456,
            balanceCents: 376544,
            expensesByCategory: [{ category: "FOOD", totalCents: 123456 }],
        });
    });

    it("mês sem lançamentos dá tudo zero (e saldo negativo é possível)", async () => {
        repo.sumByType.mockResolvedValue([] as never);
        repo.sumExpensesByCategory.mockResolvedValue([] as never);

        const empty = await getMonthlySummary(OWNER, "2026-11");
        expect(empty).toMatchObject({ incomeCents: 0, expenseCents: 0, balanceCents: 0 });

        repo.sumByType.mockResolvedValue([
            { type: "EXPENSE", _sum: { amountCents: 100 } },
        ] as never);
        expect((await getMonthlySummary(OWNER, "2026-11")).balanceCents).toBe(-100);
    });
});
