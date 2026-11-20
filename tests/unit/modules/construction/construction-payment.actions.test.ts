import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireApiSession } from "@/lib/auth/session";
import { NotFoundError, UnauthorizedError } from "@/lib/errors/app-error";
import { createConstructionPaymentAction } from "@/modules/construction/actions/construction-payment.actions";
import { getService, registerServicePayment } from "@/modules/construction/server";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("@/lib/auth/session", () => ({ requireApiSession: jest.fn() }));
jest.mock("@/modules/construction/server", () => ({
    getService: jest.fn(),
    registerServicePayment: jest.fn(),
}));

const session = jest.mocked(requireApiSession);
const getServiceMock = jest.mocked(getService);
const register = jest.mocked(registerServicePayment);
const go = jest.mocked(redirect);

const PROJECT_ID = "cjld2cjxh0000qzrmn831i7rn";

function form(data: Record<string, string>) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) formData.set(key, value);
    return formData;
}

const valid = {
    serviceId: "svc_1",
    paidOn: "2026-06-10",
    amountCents: "2.000,00",
    method: "PIX",
    notes: "Sinal",
};

beforeEach(() => {
    jest.resetAllMocks();
    session.mockResolvedValue({ user: { id: "owner-1" } } as never);
    getServiceMock.mockResolvedValue({
        service: { projectId: PROJECT_ID },
    } as never);
    register.mockResolvedValue({} as never);
});

describe("createConstructionPaymentAction", () => {
    it("registra o pagamento e volta ao Financeiro no mês do pagamento", async () => {
        const result = await createConstructionPaymentAction(null, form(valid));

        expect(result).toBeUndefined();
        expect(register).toHaveBeenCalledWith(
            "owner-1",
            expect.objectContaining({
                serviceId: "svc_1",
                paidOn: new Date("2026-06-10T00:00:00.000Z"),
                amountCents: 200000,
                method: "PIX",
            }),
        );
        expect(revalidatePath).toHaveBeenCalledWith("/finance");
        expect(revalidatePath).toHaveBeenCalledWith(`/finance/construction/${PROJECT_ID}/payments`);
        expect(go).toHaveBeenCalledWith("/finance/transactions?month=2026-06");
    });

    it("notas vazias viram undefined", async () => {
        await createConstructionPaymentAction(null, form({ ...valid, notes: "" }));

        expect(register).toHaveBeenCalledWith(
            "owner-1",
            expect.objectContaining({ notes: undefined }),
        );
    });

    it("campo ausente no FormData vira texto vazio", async () => {
        const result = await createConstructionPaymentAction(null, form({ serviceId: "svc_1" }));

        expect(result?.fieldErrors ?? result?.message).toBeDefined();
        expect(register).not.toHaveBeenCalled();
    });

    it("dados inválidos falham na validação", async () => {
        const result = await createConstructionPaymentAction(
            null,
            form({ ...valid, amountCents: "abc" }),
        );

        expect(result?.fieldErrors?.amountCents ?? result?.message).toBeDefined();
        expect(register).not.toHaveBeenCalled();
        expect(go).not.toHaveBeenCalled();
    });

    it("serviço de outra dona (404 do getService) não registra nada", async () => {
        getServiceMock.mockRejectedValue(new NotFoundError("Serviço não encontrado."));

        const result = await createConstructionPaymentAction(null, form(valid));

        expect(result?.message).toBe("Serviço não encontrado.");
        expect(register).not.toHaveBeenCalled();
    });

    it("sem sessão não registra nada", async () => {
        session.mockRejectedValue(new UnauthorizedError());

        const result = await createConstructionPaymentAction(null, form(valid));

        expect(result?.message).toBeDefined();
        expect(register).not.toHaveBeenCalled();
    });

    it("erro inesperado vira mensagem genérica", async () => {
        const log = jest.spyOn(console, "error").mockImplementation(() => {});
        register.mockRejectedValue(new Error("banco caiu"));

        const result = await createConstructionPaymentAction(null, form(valid));

        expect(result?.message).toBe("Erro inesperado. Tente novamente.");
        log.mockRestore();
    });
});
