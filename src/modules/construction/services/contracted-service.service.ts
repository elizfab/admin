import { prisma } from "@/lib/db/prisma";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";

import { constructionRepository } from "../repositories/construction.repository";
import { phaseLabel, serviceStatus } from "../rules/construction.rules";
import type { CreateServiceInput, UpdateServiceInput } from "../schemas/construction.schema";
import { tradeLabel, type ServiceSummary } from "../types/construction.types";

/**
 * Serviços contratados (mão de obra). Pago, falta e status NÃO são guardados:
 * são calculados a partir dos pagamentos. Assim nunca ficam desatualizados.
 */

type ServiceRow = Awaited<ReturnType<typeof constructionRepository.listServices>>[number];

function toSummary(service: ServiceRow, paidCents: number): ServiceSummary {
    const label = phaseLabel(service.phase.number);

    return {
        id: service.id,
        label: `${label} | ${tradeLabel[service.trade]} | ${service.description}`,
        phaseId: service.phaseId,
        phaseLabel: label,
        areaId: service.areaId,
        areaName: service.area?.name ?? null,
        trade: service.trade,
        professionalName: service.professionalName,
        description: service.description,
        contractedCents: service.contractedCents,
        paidCents,
        remainingCents: Math.max(0, service.contractedCents - paidCents),
        status: serviceStatus(service.contractedCents, paidCents),
    };
}

export async function listServices(ownerId: string, projectId: string, phaseId?: string) {
    const services = await constructionRepository.listServices(ownerId, projectId, phaseId);
    const sums = await constructionRepository.sumPaymentsByService(services.map((s) => s.id));
    const paidById = new Map(sums.map((row) => [row.serviceId, row._sum.amountCents ?? 0]));

    return services.map((service) => toSummary(service, paidById.get(service.id) ?? 0));
}

export async function getService(ownerId: string, serviceId: string) {
    const service = await constructionRepository.findService(ownerId, serviceId);

    if (!service) throw new NotFoundError("Serviço não encontrado.");

    const [sum] = await constructionRepository.sumPaymentsByService([service.id]);

    return { service, summary: toSummary(service, sum?._sum.amountCents ?? 0) };
}

/** Fase e ambiente precisam ser DA MESMA obra (senão um id de outra obra entraria). */
async function assertBelongsToProject(projectId: string, input: { phaseId?: string; areaId?: string }) {
    if (input.phaseId) {
        const phase = await prisma.constructionPhase.findFirst({ where: { id: input.phaseId, projectId } });
        if (!phase) throw new ValidationError({ phaseId: ["Fase inválida para esta obra."] });
    }

    if (input.areaId) {
        const area = await prisma.constructionArea.findFirst({ where: { id: input.areaId, projectId } });
        if (!area) throw new ValidationError({ areaId: ["Ambiente inválido para esta obra."] });
    }
}

export async function createService(ownerId: string, projectId: string, input: CreateServiceInput) {
    const project = await constructionRepository.findProject(ownerId, projectId);

    if (!project) throw new NotFoundError("Obra não encontrada.");

    await assertBelongsToProject(projectId, input);

    return prisma.constructionService.create({
        data: { ...input, projectId },
        include: { phase: true },
    });
}

export async function updateService(ownerId: string, serviceId: string, input: UpdateServiceInput) {
    const { service, summary } = await getService(ownerId, serviceId);

    await assertBelongsToProject(service.projectId, input);

    // Não deixa o contratado ficar MENOR do que o que já foi pago.
    if (input.contractedCents !== undefined && input.contractedCents < summary.paidCents) {
        throw new ValidationError({
            contractedCents: ["O valor contratado não pode ser menor que o total já pago."],
        });
    }

    return prisma.constructionService.update({ where: { id: serviceId }, data: input });
}

export async function deleteService(ownerId: string, serviceId: string) {
    const { summary } = await getService(ownerId, serviceId);

    if (summary.paidCents > 0) {
        throw new ConflictError("Este serviço tem pagamentos. Exclua os pagamentos antes.");
    }

    await prisma.constructionService.delete({ where: { id: serviceId } });
}
