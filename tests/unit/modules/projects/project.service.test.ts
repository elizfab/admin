import { ConflictError, NotFoundError } from "@/lib/errors/app-error";
import { projectRepository } from "@/modules/projects/repositories/project.repository";
import {
    createProject,
    deleteProject,
    getProject,
    updateProject,
} from "@/modules/projects/services/project.service";

// O repositório (banco) é substituído por um dublê: testamos só as REGRAS.
jest.mock("@/modules/projects/repositories/project.repository", () => ({
    projectRepository: {
        listByOwner: jest.fn(),
        findByIdForOwner: jest.fn(),
        findByNameForOwner: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));

const repo = jest.mocked(projectRepository);
const OWNER = "owner-1";
const project = { id: "p1", name: "Portal", ownerId: OWNER };

beforeEach(() => jest.resetAllMocks());

describe("getProject", () => {
    it("busca sempre filtrando pela dona", async () => {
        repo.findByIdForOwner.mockResolvedValue(project as never);

        await getProject(OWNER, "p1");

        expect(repo.findByIdForOwner).toHaveBeenCalledWith("p1", OWNER);
    });

    it("lança NotFoundError quando o projeto não é da usuária", async () => {
        repo.findByIdForOwner.mockResolvedValue(null);

        await expect(getProject("outra-pessoa", "p1")).rejects.toBeInstanceOf(NotFoundError);
    });
});

describe("createProject", () => {
    it("recusa nome duplicado para a mesma dona", async () => {
        repo.findByNameForOwner.mockResolvedValue({ id: "existente" } as never);

        await expect(
            createProject(OWNER, { name: "Portal", status: "PLANNED" }),
        ).rejects.toBeInstanceOf(ConflictError);
        expect(repo.create).not.toHaveBeenCalled();
    });

    it("cria quando o nome está livre", async () => {
        repo.findByNameForOwner.mockResolvedValue(null);
        repo.create.mockResolvedValue(project as never);

        await createProject(OWNER, { name: "Portal", status: "PLANNED" });

        expect(repo.create).toHaveBeenCalledWith(OWNER, { name: "Portal", status: "PLANNED" });
    });
});

describe("updateProject e deleteProject", () => {
    it("não atualiza projeto de outra pessoa", async () => {
        repo.findByIdForOwner.mockResolvedValue(null);

        await expect(updateProject("outra-pessoa", "p1", { name: "X" })).rejects.toBeInstanceOf(
            NotFoundError,
        );
        expect(repo.update).not.toHaveBeenCalled();
    });

    it("não checa duplicidade quando o nome não muda", async () => {
        repo.findByIdForOwner.mockResolvedValue(project as never);

        await updateProject(OWNER, "p1", { name: "Portal", status: "DONE" });

        expect(repo.findByNameForOwner).not.toHaveBeenCalled();
        expect(repo.update).toHaveBeenCalledWith("p1", { name: "Portal", status: "DONE" });
    });

    it("não exclui projeto de outra pessoa", async () => {
        repo.findByIdForOwner.mockResolvedValue(null);

        await expect(deleteProject("outra-pessoa", "p1")).rejects.toBeInstanceOf(NotFoundError);
        expect(repo.delete).not.toHaveBeenCalled();
    });
});
