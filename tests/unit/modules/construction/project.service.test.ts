import { prisma } from "@/lib/db/prisma";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { constructionRepository } from "@/modules/construction/repositories/construction.repository";
import {
    addArea,
    addPhase,
    countProjectsByCategory,
    createProject,
    getProject,
    listProjectCards,
    listProjects,
    PROJECT_CARDS_PAGE_SIZE,
    updateProject,
} from "@/modules/construction/services/project.service";

jest.mock("@/lib/db/prisma", () => ({
    prisma: {
        constructionProject: { create: jest.fn(), update: jest.fn() },
        constructionArea: { create: jest.fn() },
        constructionPhase: { create: jest.fn() },
    },
}));
jest.mock("@/modules/construction/repositories/construction.repository", () => ({
    constructionRepository: {
        listProjects: jest.fn(),
        listProjectCards: jest.fn(),
        listProjectCategoryIds: jest.fn(),
        findProject: jest.fn(),
    },
}));

const repo = jest.mocked(constructionRepository);
const db = jest.mocked(prisma, { shallow: false }) as unknown as {
    constructionProject: { create: jest.Mock; update: jest.Mock };
    constructionArea: { create: jest.Mock };
    constructionPhase: { create: jest.Mock };
};

const OWNER = "owner-1";
const PROJECT = { id: "p1", ownerId: OWNER, name: "Obra", startDate: null, plannedEndDate: null };

beforeEach(() => jest.resetAllMocks());

describe("listProjects / getProject", () => {
    it("listProjects delega ao repositório", async () => {
        repo.listProjects.mockResolvedValue([PROJECT] as never);

        await expect(listProjects(OWNER)).resolves.toEqual([PROJECT]);
        expect(repo.listProjects).toHaveBeenCalledWith(OWNER);
    });

    it("getProject devolve a obra da dona", async () => {
        repo.findProject.mockResolvedValue({ ...PROJECT, areas: [], phases: [] } as never);

        await expect(getProject(OWNER, "p1")).resolves.toMatchObject({ id: "p1" });
    });

    it("getProject de obra alheia/inexistente → 404", async () => {
        repo.findProject.mockResolvedValue(null);

        await expect(getProject(OWNER, "p1")).rejects.toBeInstanceOf(NotFoundError);
    });
});

describe("listProjectCards", () => {
    it("hasMore quando vem limite + 1 registros", async () => {
        const rows = Array.from({ length: PROJECT_CARDS_PAGE_SIZE + 1 }, (_, i) => ({
            id: `p${i}`,
        }));
        repo.listProjectCards.mockResolvedValue(rows as never);

        const page = await listProjectCards(OWNER, { categoryId: "lavanderia" });

        expect(page.hasMore).toBe(true);
        expect(page.items).toHaveLength(PROJECT_CARDS_PAGE_SIZE);
        expect(repo.listProjectCards).toHaveBeenCalledWith(
            OWNER,
            { categoryId: "lavanderia" },
            { offset: 0, limit: PROJECT_CARDS_PAGE_SIZE },
        );
    });

    it("sem hasMore devolve tudo", async () => {
        repo.listProjectCards.mockResolvedValue([{ id: "p1" }] as never);

        const page = await listProjectCards(OWNER, {}, 12);

        expect(page.hasMore).toBe(false);
        expect(page.items).toHaveLength(1);
        expect(repo.listProjectCards).toHaveBeenCalledWith(
            OWNER,
            {},
            { offset: 12, limit: PROJECT_CARDS_PAGE_SIZE },
        );
    });
});

describe("countProjectsByCategory", () => {
    it("conta por categoria e obras sem categoria", async () => {
        repo.listProjectCategoryIds.mockResolvedValue([
            { categoryIds: ["lavanderia", "banheiro-lavanderia"] },
            { categoryIds: ["lavanderia"] },
            { categoryIds: [] },
        ] as never);

        const { counts, uncategorized } = await countProjectsByCategory(OWNER);

        expect(counts.get("lavanderia")).toBe(2);
        expect(counts.get("banheiro-lavanderia")).toBe(1);
        expect(uncategorized).toBe(1);
    });
});

describe("createProject", () => {
    it("fim antes do início → ValidationError", async () => {
        await expect(
            createProject(OWNER, {
                name: "Obra",
                startDate: new Date("2026-05-10T00:00:00Z"),
                plannedEndDate: new Date("2026-05-01T00:00:00Z"),
            }),
        ).rejects.toBeInstanceOf(ValidationError);
        expect(db.constructionProject.create).not.toHaveBeenCalled();
    });

    it("cria com ambiente Geral e Fase 01", async () => {
        db.constructionProject.create.mockResolvedValue(PROJECT);

        await createProject(OWNER, { name: "Obra", categoryIds: ["lavanderia"] });

        expect(db.constructionProject.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                ownerId: OWNER,
                areas: { create: { name: "Geral" } },
                phases: { create: { number: 1 } },
            }),
        });
    });

    it("erro que não é unique é relançado", async () => {
        db.constructionProject.create.mockRejectedValue(new Error("conexão caiu"));

        await expect(createProject(OWNER, { name: "Obra" })).rejects.toThrow("conexão caiu");
    });
});

describe("updateProject", () => {
    const existing = {
        ...PROJECT,
        startDate: new Date("2026-01-10T00:00:00Z"),
        plannedEndDate: new Date("2026-03-01T00:00:00Z"),
        areas: [],
        phases: [],
    };

    beforeEach(() => repo.findProject.mockResolvedValue(existing as never));

    it("mescla datas: novo fim antes do início atual → ValidationError", async () => {
        await expect(
            updateProject(OWNER, "p1", { plannedEndDate: new Date("2025-01-01T00:00:00Z") }),
        ).rejects.toBeInstanceOf(ValidationError);
        expect(db.constructionProject.update).not.toHaveBeenCalled();
    });

    it("atualiza quando as datas combinam", async () => {
        db.constructionProject.update.mockResolvedValue(existing);

        await updateProject(OWNER, "p1", { name: "Obra nova" });

        expect(db.constructionProject.update).toHaveBeenCalledWith({
            where: { id: "p1" },
            data: { name: "Obra nova" },
        });
    });

    it("obra alheia → 404 antes de atualizar", async () => {
        repo.findProject.mockResolvedValue(null);

        await expect(updateProject(OWNER, "p1", { name: "X" })).rejects.toBeInstanceOf(
            NotFoundError,
        );
        expect(db.constructionProject.update).not.toHaveBeenCalled();
    });

    it("erro genérico do banco é relançado", async () => {
        db.constructionProject.update.mockRejectedValue(new Error("conexão caiu"));

        await expect(updateProject(OWNER, "p1", { name: "Obra nova" })).rejects.toThrow(
            "conexão caiu",
        );
    });
});

describe("addArea / addPhase", () => {
    it("addArea cria o ambiente depois de conferir a obra", async () => {
        repo.findProject.mockResolvedValue({ ...PROJECT, areas: [], phases: [] } as never);
        db.constructionArea.create.mockResolvedValue({ id: "a1" });

        await expect(addArea(OWNER, "p1", { name: "Banheiro" })).resolves.toEqual({
            id: "a1",
        });
        expect(db.constructionArea.create).toHaveBeenCalledWith({
            data: { name: "Banheiro", projectId: "p1" },
        });
    });

    it("addArea em obra alheia → 404", async () => {
        repo.findProject.mockResolvedValue(null);

        await expect(addArea(OWNER, "p1", { name: "X" })).rejects.toBeInstanceOf(NotFoundError);
    });

    it("addPhase cria a fase", async () => {
        repo.findProject.mockResolvedValue({ ...PROJECT, areas: [], phases: [] } as never);
        db.constructionPhase.create.mockResolvedValue({ id: "f2", number: 2 });

        await expect(addPhase(OWNER, "p1", { number: 2, name: "Alvenaria" })).resolves.toEqual({
            id: "f2",
            number: 2,
        });
    });

    it("erro genérico do banco é relançado (addArea)", async () => {
        repo.findProject.mockResolvedValue({ ...PROJECT, areas: [], phases: [] } as never);
        db.constructionArea.create.mockRejectedValue(new Error("falhou"));

        await expect(addArea(OWNER, "p1", { name: "X" })).rejects.toThrow("falhou");
    });

    it("erro genérico do banco é relançado (addPhase)", async () => {
        repo.findProject.mockResolvedValue({ ...PROJECT, areas: [], phases: [] } as never);
        db.constructionPhase.create.mockRejectedValue(new Error("falhou"));

        await expect(addPhase(OWNER, "p1", { number: 2 })).rejects.toThrow("falhou");
    });
});

describe("conflitos de nome único (P2002)", () => {
    it("createProject com nome repetido → ConflictError", async () => {
        const { Prisma } = jest.requireActual("@/generated/prisma/client") as {
            Prisma: typeof import("@/generated/prisma/client").Prisma;
        };
        db.constructionProject.create.mockRejectedValue(
            new Prisma.PrismaClientKnownRequestError("unique", {
                code: "P2002",
                clientVersion: "test",
            }),
        );

        await expect(createProject(OWNER, { name: "Obra" })).rejects.toBeInstanceOf(ConflictError);
    });
});
