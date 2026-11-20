import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireApiSession } from "@/lib/auth/session";
import { UnauthorizedError, ValidationError } from "@/lib/errors/app-error";
import {
    createTransactionAction,
    deleteTransactionAction,
    updateTransactionAction,
} from "@/modules/finance/actions/transaction.actions";
import { createTransaction, deleteTransaction, updateTransaction } from "@/modules/finance/server";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("@/lib/auth/session", () => ({ requireApiSession: jest.fn() }));
jest.mock("@/modules/finance/server", () => ({
    createTransaction: jest.fn(),
    updateTransaction: jest.fn(),
    deleteTransaction: jest.fn(),
}));

const session = jest.mocked(requireApiSession);
const create = jest.mocked(createTransaction);
const update = jest.mocked(updateTransaction);
const remove = jest.mocked(deleteTransaction);
const go = jest.mocked(redirect);

const ID = "cjld2cjxh0000qzrmn831i7rn";

function form(data: Record<string, string>) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) formData.set(key, value);
    return formData;
}

const valid = {
    type: "EXPENSE",
    description: "Feira",
    amountCents: "250,50",
    category: "FOOD",
    occurredOn: "2026-04-12",
};

beforeEach(() => {
    jest.resetAllMocks();
    session.mockResolvedValue({ user: { id: "owner-1" } } as never);
    create.mockResolvedValue({ occurredOn: new Date("2026-04-12T00:00:00.000Z") } as never);
    update.mockResolvedValue({ occurredOn: new Date("2026-04-12T00:00:00.000Z") } as never);
});

describe("createTransactionAction", () => {
    it("cria e volta à lista de Transações no mês do lançamento", async () => {
        const result = await createTransactionAction(null, form(valid));

        expect(result).toBeUndefined();
        expect(create).toHaveBeenCalledWith(
            "owner-1",
            expect.objectContaining({ amountCents: 25050, category: "FOOD" }),
        );
        expect(revalidatePath).toHaveBeenCalledWith("/finance");
        expect(go).toHaveBeenCalledWith("/finance/transactions?month=2026-04");
    });

    it("recusa valor que não é dinheiro", async () => {
        const result = await createTransactionAction(null, form({ ...valid, amountCents: "abc" }));

        expect(result?.fieldErrors?.amountCents).toBeDefined();
        expect(result?.values).toEqual({ ...valid, amountCents: "abc" });
        expect(create).not.toHaveBeenCalled();
    });

    it("campo ausente no FormData vira texto vazio (e falha na validação)", async () => {
        const result = await createTransactionAction(null, form({ type: "EXPENSE" }));

        expect(result?.fieldErrors ?? result?.message).toBeDefined();
        expect(create).not.toHaveBeenCalled();
    });

    it("sem sessão não cria nada", async () => {
        session.mockRejectedValue(new UnauthorizedError());

        const result = await createTransactionAction(null, form(valid));

        expect(result?.message).toBeDefined();
        expect(create).not.toHaveBeenCalled();
    });

    it("erro do serviço volta com fieldErrors", async () => {
        create.mockRejectedValue(new ValidationError({ description: ["Descrição inválida."] }));

        const result = await createTransactionAction(null, form(valid));

        expect(result?.fieldErrors).toEqual({ description: ["Descrição inválida."] });
        expect(go).not.toHaveBeenCalled();
    });

    it("erro inesperado vira mensagem genérica", async () => {
        const log = jest.spyOn(console, "error").mockImplementation(() => {});
        create.mockRejectedValue(new Error("quebrou"));

        const result = await createTransactionAction(null, form(valid));

        expect(result?.message).toBe("Erro inesperado. Tente novamente.");
        log.mockRestore();
    });
});

describe("updateTransactionAction", () => {
    it("atualiza e volta ao mês da transação", async () => {
        const result = await updateTransactionAction(ID, null, form(valid));

        expect(result).toBeUndefined();
        expect(update).toHaveBeenCalledWith("owner-1", ID, expect.any(Object));
        expect(go).toHaveBeenCalledWith("/finance/transactions?month=2026-04");
    });

    it("dados inválidos falham na validação", async () => {
        const result = await updateTransactionAction(ID, null, form({ ...valid, type: "X" }));

        expect(result?.fieldErrors).toBeDefined();
        expect(update).not.toHaveBeenCalled();
    });

    it("id inválido não chama o serviço", async () => {
        const result = await updateTransactionAction("../x", null, form(valid));

        expect(result?.message).toBeDefined();
        expect(update).not.toHaveBeenCalled();
    });
});

describe("deleteTransactionAction", () => {
    it("exclui e revalida", async () => {
        await expect(deleteTransactionAction(ID)).resolves.toBeNull();

        expect(remove).toHaveBeenCalledWith("owner-1", ID);
        expect(revalidatePath).toHaveBeenCalledWith("/finance");
    });

    it("lançamento da Obra (409) devolve a mensagem", async () => {
        remove.mockRejectedValue(new ValidationError({ id: ["Bloqueado."] }));

        const result = await deleteTransactionAction(ID);

        expect(result?.fieldErrors).toBeDefined();
    });

    it("erro inesperado vira mensagem genérica", async () => {
        const log = jest.spyOn(console, "error").mockImplementation(() => {});
        remove.mockRejectedValue(new Error("quebrou"));

        const result = await deleteTransactionAction(ID);

        expect(result?.message).toBe("Erro inesperado. Tente novamente.");
        log.mockRestore();
    });
});
