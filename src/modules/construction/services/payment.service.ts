import { formatCents } from "@/lib/money/money";
import { prisma } from "@/lib/db/prisma";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";

import { constructionRepository } from "../repositories/construction.repository";
import type { CreateServicePaymentInput } from "../schemas/construction.schema";
import { tradeLabel } from "../types/construction.types";

import { getService } from "./contracted-service.service";

/**
 * Pagamento a um profissional = DUAS gravações que precisam andar juntas:
 * 1. o lançamento (Transaction, categoria Obra) no Financeiro;
 * 2. o pagamento (ServicePayment) ligado a esse lançamento.
 * prisma.$transaction garante "tudo ou nada": se a 2ª falhar, a 1ª é desfeita.
 */

export async function listPayments(ownerId: string, projectId: string, serviceId?: string) {
    return constructionRepository.listPayments(ownerId, projectId, serviceId);
}

export async function registerServicePayment(ownerId: string, input: CreateServicePaymentInput) {
    const { service, summary } = await getService(ownerId, input.serviceId);

    if (input.amountCents > summary.remainingCents) {
        throw new ValidationError({
            amountCents: [`O valor passa do que falta pagar (${formatCents(summary.remainingCents)}).`],
        });
    }

    const who = [tradeLabel[service.trade], service.professionalName].filter(Boolean).join(" ");
    const description = `${service.project.name} · ${who}: ${service.description}`.slice(0, 120);

    return prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
            data: {
                ownerId,
                type: "EXPENSE",
                category: "CONSTRUCTION",
                description,
                amountCents: input.amountCents,
                occurredOn: input.paidOn,
            },
        });

        return tx.servicePayment.create({
            data: {
                serviceId: service.id,
                paidOn: input.paidOn,
                amountCents: input.amountCents,
                method: input.method,
                notes: input.notes,
                transactionId: transaction.id,
            },
        });
    });
}

export async function deleteServicePayment(ownerId: string, paymentId: string) {
    const payment = await constructionRepository.findPayment(ownerId, paymentId);

    if (!payment) throw new NotFoundError("Pagamento não encontrado.");

    // Ordem: o pagamento aponta para o lançamento (Restrict), então ele sai primeiro.
    await prisma.$transaction([
        prisma.servicePayment.delete({ where: { id: payment.id } }),
        prisma.transaction.delete({ where: { id: payment.transactionId } }),
    ]);
}
