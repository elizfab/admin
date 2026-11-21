import { isUniqueConstraintError } from "@/lib/db/errors";
import { prisma } from "@/lib/db/prisma";
import { ConflictError } from "@/lib/errors/app-error";

import type {
    CreateDashboardModuleInput,
    UpdateDashboardModuleInput,
} from "../schemas/dashboard-module.schema";

const DUPLICATE_SLUG = "Já existe um card com este identificador.";

/**
 * Acesso a dados dos cards do dashboard.
 * REGRA (R1): toda leitura filtra por ownerId — o isolamento acontece na consulta.
 */
export const dashboardModuleRepository = {
    listByOwner(ownerId: string) {
        return prisma.dashboardModule.findMany({
            where: { ownerId },
            // Mais antigo primeiro; o id desempata cards criados no mesmo instante.
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        });
    },

    findByIdForOwner(id: string, ownerId: string) {
        return prisma.dashboardModule.findFirst({ where: { id, ownerId } });
    },

    findBySlugForOwner(slug: string, ownerId: string) {
        return prisma.dashboardModule.findUnique({
            where: { ownerId_slug: { ownerId, slug } },
            select: { id: true },
        });
    },

    async create(ownerId: string, data: CreateDashboardModuleInput) {
        try {
            return await prisma.dashboardModule.create({ data: { ...data, ownerId } });
        } catch (error) {
            // Rede de segurança para corrida entre duas requisições simultâneas.
            if (isUniqueConstraintError(error)) throw new ConflictError(DUPLICATE_SLUG);
            throw error;
        }
    },

    async update(id: string, data: UpdateDashboardModuleInput) {
        try {
            return await prisma.dashboardModule.update({ where: { id }, data });
        } catch (error) {
            if (isUniqueConstraintError(error)) throw new ConflictError(DUPLICATE_SLUG);
            throw error;
        }
    },

    delete(id: string) {
        return prisma.dashboardModule.delete({ where: { id } });
    },
};
