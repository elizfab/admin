import { prisma } from "@/lib/db/prisma";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";

import { constructionRepository } from "../repositories/construction.repository";
import type { CreateGoalInput } from "../schemas/construction.schema";

export async function listGoals(ownerId: string, projectId: string) {
    return constructionRepository.listGoals(ownerId, projectId);
}

export async function createGoal(ownerId: string, projectId: string, input: CreateGoalInput) {
    const project = await constructionRepository.findProject(ownerId, projectId);

    if (!project) throw new NotFoundError("Obra não encontrada.");

    if (input.areaId && !project.areas.some((area) => area.id === input.areaId)) {
        throw new ValidationError({ areaId: ["Ambiente inválido para esta obra."] });
    }

    const last = await prisma.constructionGoal.aggregate({
        where: { projectId },
        _max: { position: true },
    });

    return prisma.constructionGoal.create({
        data: { ...input, projectId, position: (last._max.position ?? 0) + 1 },
    });
}

/**
 * Marca (done = true) ou desmarca a meta. Recebe o estado DESEJADO, e não
 * "inverta": dois cliques rápidos ou uma requisição repetida não se anulam.
 * `today` = data sem hora (meia-noite UTC).
 */
export async function setGoalDone(ownerId: string, goalId: string, done: boolean, today: Date) {
    const goal = await constructionRepository.findGoal(ownerId, goalId);

    if (!goal) throw new NotFoundError("Meta não encontrada.");

    return prisma.constructionGoal.update({
        where: { id: goal.id },
        data: { doneAt: done ? (goal.doneAt ?? today) : null },
    });
}

export async function deleteGoal(ownerId: string, goalId: string) {
    const goal = await constructionRepository.findGoal(ownerId, goalId);

    if (!goal) throw new NotFoundError("Meta não encontrada.");

    await prisma.constructionGoal.delete({ where: { id: goal.id } });
}
