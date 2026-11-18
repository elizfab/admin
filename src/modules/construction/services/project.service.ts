import { isUniqueConstraintError } from "@/lib/db/errors";
import { prisma } from "@/lib/db/prisma";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";

import { constructionRepository } from "../repositories/construction.repository";
import type {
    CreateAreaInput,
    CreatePhaseInput,
    CreateProjectInput,
    UpdateProjectInput,
} from "../schemas/construction.schema";

export async function listProjects(ownerId: string) {
    return constructionRepository.listProjects(ownerId);
}

export async function getProject(ownerId: string, projectId: string) {
    const project = await constructionRepository.findProject(ownerId, projectId);

    if (!project) throw new NotFoundError("Obra não encontrada.");

    return project;
}

/** Cria a obra já com o ambiente "Geral" e a "Fase 01" (o mínimo para lançar serviços). */
export async function createProject(ownerId: string, input: CreateProjectInput) {
    if (input.startDate && input.plannedEndDate && input.plannedEndDate < input.startDate) {
        throw new ValidationError({ plannedEndDate: ["O fim previsto precisa ser depois do início."] });
    }

    try {
        return await prisma.constructionProject.create({
            data: {
                ...input,
                ownerId,
                areas: { create: { name: "Geral" } },
                phases: { create: { number: 1 } },
            },
        });
    } catch (error) {
        if (isUniqueConstraintError(error)) {
            throw new ConflictError("Já existe uma obra com esse nome.");
        }
        throw error;
    }
}

export async function updateProject(ownerId: string, projectId: string, input: UpdateProjectInput) {
    const project = await getProject(ownerId, projectId);

    const startDate = input.startDate ?? project.startDate;
    const plannedEndDate = input.plannedEndDate ?? project.plannedEndDate;

    if (startDate && plannedEndDate && plannedEndDate < startDate) {
        throw new ValidationError({ plannedEndDate: ["O fim previsto precisa ser depois do início."] });
    }

    try {
        return await prisma.constructionProject.update({
            where: { id: project.id },
            data: input,
        });
    } catch (error) {
        if (isUniqueConstraintError(error)) {
            throw new ConflictError("Já existe uma obra com esse nome.");
        }
        throw error;
    }
}

export async function addArea(ownerId: string, projectId: string, input: CreateAreaInput) {
    await getProject(ownerId, projectId);

    try {
        return await prisma.constructionArea.create({ data: { ...input, projectId } });
    } catch (error) {
        if (isUniqueConstraintError(error)) {
            throw new ConflictError("Esse ambiente já existe nesta obra.");
        }
        throw error;
    }
}

export async function addPhase(ownerId: string, projectId: string, input: CreatePhaseInput) {
    await getProject(ownerId, projectId);

    try {
        return await prisma.constructionPhase.create({ data: { ...input, projectId } });
    } catch (error) {
        if (isUniqueConstraintError(error)) {
            throw new ConflictError("Essa fase já existe nesta obra.");
        }
        throw error;
    }
}
