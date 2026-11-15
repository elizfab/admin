import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db/prisma";
import { ConflictError } from "@/lib/errors/app-error";
import { projectRepository } from "@/modules/projects/repositories/project.repository";

/**
 * Integração: repositório + Prisma + PostgreSQL REAIS (banco admin_test).
 * Prova o que os testes unitários (com dublês) não conseguem:
 * o filtro por dona e a restrição @@unique funcionando no banco.
 */

const ownerA = `it-owner-a-${randomUUID()}`;
const ownerB = `it-owner-b-${randomUUID()}`;

beforeAll(async () => {
    await prisma.user.createMany({
        data: [ownerA, ownerB].map((id) => ({ id, name: id, email: `${id}@example.com` })),
    });
});

afterAll(async () => {
    // Limpa só o que este arquivo criou, na ordem certa (Restrict).
    await prisma.project.deleteMany({ where: { ownerId: { in: [ownerA, ownerB] } } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerA, ownerB] } } });
    await prisma.$disconnect();
});

describe("projectRepository (banco real)", () => {
    it("findByIdForOwner não encontra projeto de outra dona", async () => {
        const project = await projectRepository.create(ownerA, { name: "Do A", status: "PLANNED" });

        await expect(projectRepository.findByIdForOwner(project.id, ownerA)).resolves.toMatchObject({
            id: project.id,
        });
        await expect(projectRepository.findByIdForOwner(project.id, ownerB)).resolves.toBeNull();
    });

    it("listByOwner devolve só os projetos da dona", async () => {
        await projectRepository.create(ownerB, { name: "Do B", status: "PLANNED" });

        const listA = await projectRepository.listByOwner(ownerA);

        expect(listA.every((project) => project.ownerId === ownerA)).toBe(true);
    });

    it("o banco recusa nome duplicado para a mesma dona (ConflictError)", async () => {
        await projectRepository.create(ownerA, { name: "Duplicado", status: "PLANNED" });

        await expect(
            projectRepository.create(ownerA, { name: "Duplicado", status: "PLANNED" }),
        ).rejects.toBeInstanceOf(ConflictError);
    });

    it("donas diferentes podem usar o mesmo nome", async () => {
        await expect(
            projectRepository.create(ownerB, { name: "Duplicado", status: "PLANNED" }),
        ).resolves.toMatchObject({ ownerId: ownerB, name: "Duplicado" });
    });
});
