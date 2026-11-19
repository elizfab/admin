import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db/prisma";
import { ConflictError } from "@/lib/errors/app-error";
import { dashboardModuleRepository } from "@/modules/dashboard/repositories/dashboard-module.repository";

/**
 * Integração: repositório + Prisma + PostgreSQL REAIS (banco admin_test).
 * Prova o filtro por dona (R1), a ordem da lista e o @@unique([ownerId, slug]).
 */

const ownerA = `it-dash-a-${randomUUID()}`;
const ownerB = `it-dash-b-${randomUUID()}`;

function card(slug: string) {
    return {
        slug,
        title: `Card ${slug}`,
        description: "Descrição do card.",
        href: `/${slug}`,
        icon: "Rocket" as const,
        status: "AVAILABLE" as const,
    };
}

beforeAll(async () => {
    await prisma.user.createMany({
        data: [ownerA, ownerB].map((id) => ({ id, name: id, email: `${id}@example.com` })),
    });
});

afterAll(async () => {
    // onDelete: Cascade — apagar as usuárias apaga os cards delas.
    await prisma.user.deleteMany({ where: { id: { in: [ownerA, ownerB] } } });
    await prisma.$disconnect();
});

describe("dashboardModuleRepository (banco real)", () => {
    it("lista só os cards da dona, do mais antigo para o mais novo", async () => {
        const first = await dashboardModuleRepository.create(ownerA, card("primeiro"));
        const second = await dashboardModuleRepository.create(ownerA, card("segundo"));
        await dashboardModuleRepository.create(ownerB, card("da-b"));

        const list = await dashboardModuleRepository.listByOwner(ownerA);

        expect(list.map((m) => m.id)).toEqual([first.id, second.id]);
    });

    it("findByIdForOwner não encontra card de outra dona", async () => {
        const mine = await dashboardModuleRepository.create(ownerA, card("meu"));

        await expect(
            dashboardModuleRepository.findByIdForOwner(mine.id, ownerA),
        ).resolves.toMatchObject({
            id: mine.id,
        });
        await expect(
            dashboardModuleRepository.findByIdForOwner(mine.id, ownerB),
        ).resolves.toBeNull();
    });

    it("findBySlugForOwner procura só entre os cards da dona", async () => {
        await expect(
            dashboardModuleRepository.findBySlugForOwner("meu", ownerA),
        ).resolves.not.toBeNull();
        await expect(
            dashboardModuleRepository.findBySlugForOwner("meu", ownerB),
        ).resolves.toBeNull();
    });

    it("o mesmo identificador é permitido para donas diferentes", async () => {
        await expect(dashboardModuleRepository.create(ownerB, card("meu"))).resolves.toMatchObject({
            slug: "meu",
        });
    });

    it("identificador repetido na mesma dona vira ConflictError (create e update)", async () => {
        await expect(dashboardModuleRepository.create(ownerA, card("meu"))).rejects.toBeInstanceOf(
            ConflictError,
        );

        const other = await dashboardModuleRepository.create(ownerA, card("outro"));
        await expect(
            dashboardModuleRepository.update(other.id, { slug: "meu" }),
        ).rejects.toBeInstanceOf(ConflictError);
    });

    it("update altera só os campos enviados; delete remove", async () => {
        const target = await dashboardModuleRepository.create(ownerA, {
            ...card("alvo"),
            status: "SOON",
        });

        const updated = await dashboardModuleRepository.update(target.id, { title: "Novo título" });
        expect(updated).toMatchObject({ title: "Novo título", status: "SOON", slug: "alvo" });

        await dashboardModuleRepository.delete(target.id);
        await expect(
            dashboardModuleRepository.findByIdForOwner(target.id, ownerA),
        ).resolves.toBeNull();
    });

    it("erro que não é de unicidade é repassado", async () => {
        await expect(
            dashboardModuleRepository.create(`nao-existe-${randomUUID()}`, card("sem-dona")),
        ).rejects.not.toBeInstanceOf(ConflictError);
        await expect(
            dashboardModuleRepository.update("id-que-nao-existe", { title: "X" }),
        ).rejects.not.toBeInstanceOf(ConflictError);
    });
});
