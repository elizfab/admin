import { ConflictError, NotFoundError } from "@/lib/errors/app-error";

import { projectRepository } from "../repositories/project.repository";
import type { CreateProjectInput, UpdateProjectInput } from "../schemas/project.schema";

/**
 * Regras de negócio de projetos.
 * Recebe dados JÁ validados (Zod) e o ownerId vindo da SESSÃO — nunca do cliente.
 */

const NOT_FOUND = "Projeto não encontrado.";
const DUPLICATE_NAME = "Já existe um projeto com este nome.";

export async function listProjects(ownerId: string) {
    return projectRepository.listByOwner(ownerId);
}

export async function getProject(ownerId: string, id: string) {
    const project = await projectRepository.findByIdForOwner(id, ownerId);

    // Projeto de outra pessoa = "não encontrado" (não revela que ele existe).
    if (!project) throw new NotFoundError(NOT_FOUND);

    return project;
}

export async function createProject(ownerId: string, input: CreateProjectInput) {
    await assertNameAvailable(ownerId, input.name);

    return projectRepository.create(ownerId, input);
}

export async function updateProject(ownerId: string, id: string, input: UpdateProjectInput) {
    const current = await getProject(ownerId, id);

    if (input.name && input.name !== current.name) {
        await assertNameAvailable(ownerId, input.name);
    }

    return projectRepository.update(id, input);
}

export async function deleteProject(ownerId: string, id: string) {
    await getProject(ownerId, id);
    await projectRepository.delete(id);
}

async function assertNameAvailable(ownerId: string, name: string) {
    const existing = await projectRepository.findByNameForOwner(name, ownerId);

    if (existing) throw new ConflictError(DUPLICATE_NAME);
}
