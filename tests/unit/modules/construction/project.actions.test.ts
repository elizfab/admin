import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireApiSession } from "@/lib/auth/session";
import { ConflictError, UnauthorizedError } from "@/lib/errors/app-error";
import {
    addAreaAction,
    addPhaseAction,
    createProjectAction,
    updateProjectAction,
} from "@/modules/construction/actions/project.actions";
import { addArea, addPhase, createProject, updateProject } from "@/modules/construction/server";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("@/lib/auth/session", () => ({ requireApiSession: jest.fn() }));
jest.mock("@/modules/construction/server", () => ({
    addArea: jest.fn(),
    addPhase: jest.fn(),
    createProject: jest.fn(),
    updateProject: jest.fn(),
}));

const session = jest.mocked(requireApiSession);
const create = jest.mocked(createProject);
const update = jest.mocked(updateProject);
const addAreaMock = jest.mocked(addArea);
const addPhaseMock = jest.mocked(addPhase);
const go = jest.mocked(redirect);

const ID = "cjld2cjxh0000qzrmn831i7rn";

function form(data: Record<string, string | string[]>) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
        for (const item of Array.isArray(value) ? value : [value]) {
            formData.append(key, item);
        }
    }
    return formData;
}

const projectForm = {
    name: "Telhado",
    startDate: "2026-01-10",
    plannedEndDate: "2026-03-01",
    categoryIds: ["lavanderia", "banheiro-lavanderia"],
};

beforeEach(() => {
    jest.resetAllMocks();
    session.mockResolvedValue({ user: { id: "owner-1" } } as never);
    create.mockResolvedValue({ id: ID } as never);
});

describe("createProjectAction", () => {
    it("cria a obra com as categorias do form e vai para os dados dela", async () => {
        const result = await createProjectAction(null, form(projectForm));

        expect(result).toBeUndefined();
        expect(create).toHaveBeenCalledWith("owner-1", {
            name: "Telhado",
            startDate: new Date("2026-01-10T00:00:00.000Z"),
            plannedEndDate: new Date("2026-03-01T00:00:00.000Z"),
            categoryIds: ["lavanderia", "banheiro-lavanderia"],
        });
        expect(revalidatePath).toHaveBeenCalledWith("/finance/construction");
        expect(go).toHaveBeenCalledWith(`/finance/construction/${ID}/settings`);
    });

    it("datas vazias viram undefined; sem checkboxes a lista vai vazia", async () => {
        await createProjectAction(null, form({ name: "Obra" }));

        expect(create).toHaveBeenCalledWith(
            "owner-1",
            expect.objectContaining({ startDate: undefined, categoryIds: [] }),
        );
    });

    it("recusa categoria fora do catálogo", async () => {
        const result = await createProjectAction(
            null,
            form({ ...projectForm, categoryIds: ["inventada"] }),
        );

        expect(result?.fieldErrors?.categoryIds).toBeDefined();
        expect(create).not.toHaveBeenCalled();
        expect(go).not.toHaveBeenCalled();
    });

    it("sem sessão não cria nada", async () => {
        session.mockRejectedValue(new UnauthorizedError());

        const result = await createProjectAction(null, form(projectForm));

        expect(result?.message).toBeDefined();
        expect(create).not.toHaveBeenCalled();
    });

    it("erro do serviço volta como mensagem", async () => {
        create.mockRejectedValue(new ConflictError("Já existe uma obra com esse nome."));

        const result = await createProjectAction(null, form(projectForm));

        expect(result).toEqual({ message: "Já existe uma obra com esse nome." });
        expect(go).not.toHaveBeenCalled();
    });

    it("erro inesperado vira mensagem genérica", async () => {
        const log = jest.spyOn(console, "error").mockImplementation(() => {});
        create.mockRejectedValue(new Error("quebrou"));

        const result = await createProjectAction(null, form(projectForm));

        expect(result?.message).toBe("Erro inesperado. Tente novamente.");
        log.mockRestore();
    });
});

describe("updateProjectAction", () => {
    it("atualiza e revalida a obra e a configuração", async () => {
        const result = await updateProjectAction(ID, null, form(projectForm));

        expect(result).toBeNull();
        expect(update).toHaveBeenCalledWith(
            "owner-1",
            ID,
            expect.objectContaining({ name: "Telhado", categoryIds: projectForm.categoryIds }),
        );
        expect(revalidatePath).toHaveBeenCalledWith(`/finance/construction/${ID}`);
        expect(revalidatePath).toHaveBeenCalledWith(`/finance/construction/${ID}/settings`);
    });

    it("datas vazias viram null (limpa a data)", async () => {
        await updateProjectAction(ID, null, form({ name: "Telhado" }));

        expect(update).toHaveBeenCalledWith(
            "owner-1",
            ID,
            expect.objectContaining({ startDate: null, plannedEndDate: null }),
        );
    });

    it("recusa id inválido", async () => {
        const result = await updateProjectAction("../x", null, form(projectForm));

        expect(result?.message).toBeDefined();
        expect(update).not.toHaveBeenCalled();
    });

    it("payload vazio falha na validação", async () => {
        // name vazio + datas null + sem categorias: updateProjectSchema exige ≥1 campo…
        // na prática o form sempre manda name; simulamos name curto demais.
        const result = await updateProjectAction(ID, null, form({ name: "A" }));

        expect(result?.fieldErrors?.name ?? result?.message).toBeDefined();
        expect(update).not.toHaveBeenCalled();
    });

    it("devolve a mensagem do serviço", async () => {
        update.mockRejectedValue(new ConflictError("Obra não encontrada."));

        const result = await updateProjectAction(ID, null, form(projectForm));

        expect(result).toEqual({ message: "Obra não encontrada." });
    });
});

describe("addAreaAction", () => {
    it("adiciona o ambiente e revalida a configuração", async () => {
        const result = await addAreaAction(ID, null, form({ name: "Banheiro" }));

        expect(result).toBeNull();
        expect(addAreaMock).toHaveBeenCalledWith("owner-1", ID, { name: "Banheiro" });
        expect(revalidatePath).toHaveBeenCalledWith(`/finance/construction/${ID}/settings`);
    });

    it("nome curto demais falha na validação", async () => {
        const result = await addAreaAction(ID, null, form({ name: "A" }));

        expect(result?.fieldErrors?.name).toBeDefined();
        expect(addAreaMock).not.toHaveBeenCalled();
    });
});

describe("addPhaseAction", () => {
    it("adiciona a fase com nome opcional", async () => {
        const result = await addPhaseAction(ID, null, form({ number: "2", name: "Alvenaria" }));

        expect(result).toBeNull();
        expect(addPhaseMock).toHaveBeenCalledWith("owner-1", ID, {
            number: 2,
            name: "Alvenaria",
        });
    });

    it("nome vazio vira undefined", async () => {
        await addPhaseAction(ID, null, form({ number: "3", name: "" }));

        expect(addPhaseMock).toHaveBeenCalledWith(
            "owner-1",
            ID,
            expect.objectContaining({ name: undefined }),
        );
    });

    it("número inválido falha na validação", async () => {
        const result = await addPhaseAction(ID, null, form({ number: "0" }));

        expect(result?.fieldErrors?.number).toBeDefined();
        expect(addPhaseMock).not.toHaveBeenCalled();
    });
});
