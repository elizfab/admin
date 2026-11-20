import { ConflictError, NotFoundError } from "@/lib/errors/app-error";
import { dashboardModuleRepository } from "@/modules/dashboard/repositories/dashboard-module.repository";
import {
    createDashboardModule,
    deleteDashboardModule,
    getDashboardModule,
    listDashboardModules,
    updateDashboardModule,
} from "@/modules/dashboard/services/dashboard-module.service";

// O repositório (banco) é substituído por um dublê: testamos só as REGRAS.
jest.mock("@/modules/dashboard/repositories/dashboard-module.repository", () => ({
    dashboardModuleRepository: {
        listByOwner: jest.fn(),
        findByIdForOwner: jest.fn(),
        findBySlugForOwner: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));

const repo = jest.mocked(dashboardModuleRepository);
const OWNER = "owner-1";
const card = { id: "c1", slug: "finance", title: "Financeiro", ownerId: OWNER };
const input = {
    slug: "finance",
    title: "Financeiro",
    description: "Receitas e despesas.",
    href: "/finance",
    icon: "PiggyBank" as const,
    status: "AVAILABLE" as const,
};

beforeEach(() => jest.resetAllMocks());

it("listDashboardModules lista só os cards da dona", async () => {
    repo.listByOwner.mockResolvedValue([card] as never);

    await expect(listDashboardModules(OWNER)).resolves.toEqual([card]);
    expect(repo.listByOwner).toHaveBeenCalledWith(OWNER);
});

describe("getDashboardModule", () => {
    it("busca sempre filtrando pela dona", async () => {
        repo.findByIdForOwner.mockResolvedValue(card as never);

        await expect(getDashboardModule(OWNER, "c1")).resolves.toEqual(card);
        expect(repo.findByIdForOwner).toHaveBeenCalledWith("c1", OWNER);
    });

    it("card de outra pessoa = NotFoundError (404, não revela que existe)", async () => {
        repo.findByIdForOwner.mockResolvedValue(null);

        await expect(getDashboardModule("outra", "c1")).rejects.toThrow(
            new NotFoundError("Card não encontrado."),
        );
    });
});

describe("createDashboardModule", () => {
    it("recusa identificador já usado pela mesma dona", async () => {
        repo.findBySlugForOwner.mockResolvedValue({ id: "existente" } as never);

        await expect(createDashboardModule(OWNER, input)).rejects.toThrow(
            new ConflictError("Já existe um card com este identificador."),
        );
        expect(repo.create).not.toHaveBeenCalled();
    });

    it("cria quando o identificador está livre", async () => {
        repo.findBySlugForOwner.mockResolvedValue(null);
        repo.create.mockResolvedValue(card as never);

        await expect(createDashboardModule(OWNER, input)).resolves.toEqual(card);
        expect(repo.findBySlugForOwner).toHaveBeenCalledWith("finance", OWNER);
        expect(repo.create).toHaveBeenCalledWith(OWNER, input);
    });
});

describe("updateDashboardModule", () => {
    it("não altera card de outra pessoa", async () => {
        repo.findByIdForOwner.mockResolvedValue(null);

        await expect(updateDashboardModule("outra", "c1", { title: "X" })).rejects.toBeInstanceOf(
            NotFoundError,
        );
        expect(repo.update).not.toHaveBeenCalled();
    });

    it("confere o identificador novo só quando ele muda", async () => {
        repo.findByIdForOwner.mockResolvedValue(card as never);
        repo.findBySlugForOwner.mockResolvedValue({ id: "outro" } as never);

        await expect(
            updateDashboardModule(OWNER, "c1", { slug: "studies" }),
        ).rejects.toBeInstanceOf(ConflictError);
    });

    it("mantém o mesmo identificador sem acusar duplicado", async () => {
        repo.findByIdForOwner.mockResolvedValue(card as never);
        repo.update.mockResolvedValue({ ...card, title: "Novo" } as never);

        await updateDashboardModule(OWNER, "c1", { slug: "finance", title: "Novo" });

        expect(repo.findBySlugForOwner).not.toHaveBeenCalled();
        expect(repo.update).toHaveBeenCalledWith("c1", { slug: "finance", title: "Novo" });
    });

    it("altera quando o identificador novo está livre", async () => {
        repo.findByIdForOwner.mockResolvedValue(card as never);
        repo.findBySlugForOwner.mockResolvedValue(null);

        await updateDashboardModule(OWNER, "c1", { slug: "money" });

        expect(repo.update).toHaveBeenCalledWith("c1", { slug: "money" });
    });
});

describe("deleteDashboardModule", () => {
    it("exclui o card da dona", async () => {
        repo.findByIdForOwner.mockResolvedValue(card as never);

        await deleteDashboardModule(OWNER, "c1");

        expect(repo.delete).toHaveBeenCalledWith("c1");
    });

    it("não exclui card de outra pessoa", async () => {
        repo.findByIdForOwner.mockResolvedValue(null);

        await expect(deleteDashboardModule("outra", "c1")).rejects.toBeInstanceOf(NotFoundError);
        expect(repo.delete).not.toHaveBeenCalled();
    });
});
