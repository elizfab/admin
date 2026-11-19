import { revalidatePath } from "next/cache";

import { requireApiSession } from "@/lib/auth/session";
import { ConflictError, UnauthorizedError } from "@/lib/errors/app-error";
import {
    createDashboardModuleAction,
    deleteDashboardModuleAction,
    updateDashboardModuleAction,
} from "@/modules/dashboard/actions/dashboard-module.actions";
import {
    createDashboardModule,
    deleteDashboardModule,
    updateDashboardModule,
} from "@/modules/dashboard/server";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/auth/session", () => ({ requireApiSession: jest.fn() }));
jest.mock("@/modules/dashboard/server", () => ({
    createDashboardModule: jest.fn(),
    updateDashboardModule: jest.fn(),
    deleteDashboardModule: jest.fn(),
}));

const session = jest.mocked(requireApiSession);
const create = jest.mocked(createDashboardModule);
const update = jest.mocked(updateDashboardModule);
const remove = jest.mocked(deleteDashboardModule);

const ID = "cjld2cjxh0000qzrmn831i7rn";
const values = {
    slug: "release-control",
    title: "Release Control",
    description: "Controle de versões e deploys.",
    href: "/release",
    icon: "Rocket",
    status: "SOON",
};

function form(data: Record<string, string>) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) formData.set(key, value);
    return formData;
}

beforeEach(() => {
    jest.resetAllMocks();
    session.mockResolvedValue({ user: { id: "owner-1" } } as never);
});

describe("createDashboardModuleAction", () => {
    it("cria com o ownerId da SESSÃO e atualiza o dashboard", async () => {
        const result = await createDashboardModuleAction(
            null,
            form({ ...values, ownerId: "invasora" }),
        );

        expect(result).toEqual({ ok: true });
        expect(create).toHaveBeenCalledWith("owner-1", values);
        expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    });

    it("devolve os erros por campo e o que foi digitado", async () => {
        const result = await createDashboardModuleAction(
            null,
            form({ ...values, slug: "Com Espaço" }),
        );

        expect(result?.fieldErrors?.slug).toEqual([
            "Use só letras minúsculas, números e hífen (ex.: release-control).",
        ]);
        expect(result?.values).toEqual({ ...values, slug: "Com Espaço" });
        expect(create).not.toHaveBeenCalled();
        expect(revalidatePath).not.toHaveBeenCalled();
    });

    it("mostra a mensagem do serviço (identificador duplicado)", async () => {
        create.mockRejectedValue(new ConflictError("Já existe um card com este identificador."));

        const result = await createDashboardModuleAction(null, form(values));

        expect(result?.message).toBe("Já existe um card com este identificador.");
    });

    it("sem sessão não cria nada", async () => {
        session.mockRejectedValue(new UnauthorizedError());

        const result = await createDashboardModuleAction(null, form(values));

        expect(result?.message).toBeDefined();
        expect(create).not.toHaveBeenCalled();
    });

    it("erro inesperado vira mensagem genérica (detalhe só no log)", async () => {
        const log = jest.spyOn(console, "error").mockImplementation(() => {});
        create.mockRejectedValue(new Error("conexão caiu"));

        const result = await createDashboardModuleAction(null, form(values));

        expect(result?.message).toBe("Erro inesperado. Tente novamente.");
        expect(log).toHaveBeenCalled();
        log.mockRestore();
    });

    it("campos ausentes viram texto vazio (e erro de validação)", async () => {
        const result = await createDashboardModuleAction(null, new FormData());

        expect(result?.values?.slug).toBe("");
        expect(result?.fieldErrors?.slug).toBeDefined();
    });
});

describe("updateDashboardModuleAction", () => {
    it("altera o card da dona", async () => {
        const result = await updateDashboardModuleAction(ID, null, form(values));

        expect(result).toEqual({ ok: true });
        expect(update).toHaveBeenCalledWith("owner-1", ID, values);
        expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    });

    it("recusa id inválido", async () => {
        const result = await updateDashboardModuleAction("../x", null, form(values));

        expect(result?.message).toBeDefined();
        expect(update).not.toHaveBeenCalled();
    });

    it("devolve erros por campo", async () => {
        const result = await updateDashboardModuleAction(
            ID,
            null,
            form({ ...values, href: "finance" }),
        );

        expect(result?.fieldErrors?.href).toBeDefined();
        expect(update).not.toHaveBeenCalled();
    });
});

describe("deleteDashboardModuleAction", () => {
    it("exclui e atualiza o dashboard", async () => {
        await expect(deleteDashboardModuleAction(ID)).resolves.toBeNull();

        expect(remove).toHaveBeenCalledWith("owner-1", ID);
        expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    });

    it("devolve a mensagem quando falha", async () => {
        remove.mockRejectedValue(new ConflictError("Não deu."));

        await expect(deleteDashboardModuleAction(ID)).resolves.toEqual({ message: "Não deu." });
        expect(revalidatePath).not.toHaveBeenCalled();
    });
});
