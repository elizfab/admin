import { ConflictError, NotFoundError } from "@/lib/errors/app-error";

import { dashboardModuleRepository } from "../repositories/dashboard-module.repository";
import type {
    CreateDashboardModuleInput,
    UpdateDashboardModuleInput,
} from "../schemas/dashboard-module.schema";

/**
 * Regras de negócio dos cards do dashboard.
 * Recebe dados JÁ validados (Zod) e o ownerId vindo da SESSÃO — nunca do cliente (R2).
 */

const NOT_FOUND = "Card não encontrado.";
const DUPLICATE_SLUG = "Já existe um card com este identificador.";

export async function listDashboardModules(ownerId: string) {
    return dashboardModuleRepository.listByOwner(ownerId);
}

export async function getDashboardModule(ownerId: string, id: string) {
    const card = await dashboardModuleRepository.findByIdForOwner(id, ownerId);

    // Card de outra pessoa = "não encontrado" (não revela que ele existe).
    if (!card) throw new NotFoundError(NOT_FOUND);

    return card;
}

export async function createDashboardModule(ownerId: string, input: CreateDashboardModuleInput) {
    await assertSlugAvailable(ownerId, input.slug);

    return dashboardModuleRepository.create(ownerId, input);
}

export async function updateDashboardModule(
    ownerId: string,
    id: string,
    input: UpdateDashboardModuleInput,
) {
    const current = await getDashboardModule(ownerId, id);

    if (input.slug && input.slug !== current.slug) {
        await assertSlugAvailable(ownerId, input.slug);
    }

    return dashboardModuleRepository.update(id, input);
}

export async function deleteDashboardModule(ownerId: string, id: string) {
    await getDashboardModule(ownerId, id);
    await dashboardModuleRepository.delete(id);
}

async function assertSlugAvailable(ownerId: string, slug: string) {
    const existing = await dashboardModuleRepository.findBySlugForOwner(slug, ownerId);

    if (existing) throw new ConflictError(DUPLICATE_SLUG);
}
