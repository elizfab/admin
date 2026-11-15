import { isUniqueConstraintError } from "@/lib/db/errors";
import { prisma } from "@/lib/db/prisma";
import { ConflictError } from "@/lib/errors/app-error";

import type { CreateProjectInput, UpdateProjectInput } from "../schemas/project.schema";

const DUPLICATE_NAME = "Já existe um projeto com este nome.";

/**
 * Acesso a dados de projetos.
 * REGRA: toda leitura filtra por ownerId — o isolamento entre usuários
 * acontece na consulta, e não depois dela.
 */
export const projectRepository = {
    listByOwner(ownerId: string) {
        return prisma.project.findMany({
            where: { ownerId },
            orderBy: { updatedAt: "desc" },
        });
    },

    findByIdForOwner(id: string, ownerId: string) {
        return prisma.project.findFirst({ where: { id, ownerId } });
    },

    findByNameForOwner(name: string, ownerId: string) {
        return prisma.project.findUnique({
            where: { ownerId_name: { ownerId, name } },
            select: { id: true },
        });
    },

    async create(ownerId: string, data: CreateProjectInput) {
        try {
            return await prisma.project.create({ data: { ...data, ownerId } });
        } catch (error) {
            // Rede de segurança para corrida entre duas requisições simultâneas.
            if (isUniqueConstraintError(error)) throw new ConflictError(DUPLICATE_NAME);
            throw error;
        }
    },

    async update(id: string, data: UpdateProjectInput) {
        try {
            return await prisma.project.update({ where: { id }, data });
        } catch (error) {
            if (isUniqueConstraintError(error)) throw new ConflictError(DUPLICATE_NAME);
            throw error;
        }
    },

    delete(id: string) {
        return prisma.project.delete({ where: { id } });
    },
};
