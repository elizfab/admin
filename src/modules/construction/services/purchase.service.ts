import { prisma } from "@/lib/db/prisma";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";

import { constructionRepository } from "../repositories/construction.repository";
import {
    addMonths,
    isInstantMethod,
    purchaseStatus,
    splitInstallments,
} from "../rules/construction.rules";
import type { CreatePurchaseInput } from "../schemas/construction.schema";

/**
 * Compras de material. Cada compra gera parcelas na criação:
 * - Pix, dinheiro, débito e transferência: 1 parcela JÁ PAGA no dia da compra
 *   (e o lançamento no Financeiro);
 * - cartão de crédito e boleto: N parcelas mensais A PAGAR, a partir do
 *   1º vencimento ("30 dias" = 1x com vencimento 1 mês depois).
 * Cada parcela marcada como paga gera o seu lançamento no Financeiro.
 */

export async function listPurchases(ownerId: string, projectId: string) {
    const purchases = await constructionRepository.listPurchases(ownerId, projectId);

    return purchases.map((purchase) => {
        const paidCents = purchase.installments
            .filter((installment) => installment.paidOn)
            .reduce((sum, installment) => sum + installment.amountCents, 0);

        return {
            ...purchase,
            paidCents,
            unpaidCents: purchase.totalCents - paidCents,
            status: purchaseStatus(purchase.installments),
        };
    });
}

function installmentDescription(projectName: string, item: string, number: number, count: number) {
    const suffix = count > 1 ? ` (${number}/${count})` : "";
    return `${projectName} · Material: ${item}${suffix}`.slice(0, 120);
}

export async function createPurchase(ownerId: string, projectId: string, input: CreatePurchaseInput) {
    const project = await constructionRepository.findProject(ownerId, projectId);

    if (!project) throw new NotFoundError("Obra não encontrada.");

    if (input.areaId && !project.areas.some((area) => area.id === input.areaId)) {
        throw new ValidationError({ areaId: ["Ambiente inválido para esta obra."] });
    }

    const instant = isInstantMethod(input.method);

    if (instant && input.installmentsCount !== 1) {
        throw new ValidationError({
            installmentsCount: ["Pix, dinheiro, débito e transferência são sempre 1x."],
        });
    }

    const { firstDueOn, ...data } = input;
    const plan = splitInstallments(
        input.totalCents,
        input.installmentsCount,
        instant ? input.purchasedOn : (firstDueOn ?? addMonths(input.purchasedOn, 1)),
    );

    return prisma.$transaction(async (tx) => {
        const purchase = await tx.materialPurchase.create({ data: { ...data, projectId } });

        for (const installment of plan) {
            let transactionId: string | undefined;

            if (instant) {
                const transaction = await tx.transaction.create({
                    data: {
                        ownerId,
                        type: "EXPENSE",
                        category: "CONSTRUCTION",
                        description: installmentDescription(project.name, input.item, 1, 1),
                        amountCents: installment.amountCents,
                        occurredOn: input.purchasedOn,
                    },
                });
                transactionId = transaction.id;
            }

            await tx.materialInstallment.create({
                data: {
                    ...installment,
                    purchaseId: purchase.id,
                    paidOn: instant ? input.purchasedOn : null,
                    transactionId,
                },
            });
        }

        return purchase;
    });
}

export async function payInstallment(ownerId: string, installmentId: string, paidOn: Date) {
    const installment = await constructionRepository.findInstallment(ownerId, installmentId);

    if (!installment) throw new NotFoundError("Parcela não encontrada.");
    if (installment.paidOn) throw new ConflictError("Esta parcela já está paga.");

    const { purchase } = installment;

    return prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
            data: {
                ownerId,
                type: "EXPENSE",
                category: "CONSTRUCTION",
                description: installmentDescription(
                    purchase.project.name,
                    purchase.item,
                    installment.number,
                    purchase.installmentsCount,
                ),
                amountCents: installment.amountCents,
                occurredOn: paidOn,
            },
        });

        return tx.materialInstallment.update({
            where: { id: installment.id },
            data: { paidOn, transactionId: transaction.id },
        });
    });
}

/** Desfaz o pagamento de uma parcela (e apaga o lançamento que ele gerou). */
export async function unpayInstallment(ownerId: string, installmentId: string) {
    const installment = await constructionRepository.findInstallment(ownerId, installmentId);

    if (!installment) throw new NotFoundError("Parcela não encontrada.");
    if (!installment.transactionId) return;

    await prisma.$transaction([
        prisma.materialInstallment.update({
            where: { id: installment.id },
            data: { paidOn: null, transactionId: null },
        }),
        prisma.transaction.delete({ where: { id: installment.transactionId } }),
    ]);
}

export async function deletePurchase(ownerId: string, purchaseId: string) {
    const purchase = await constructionRepository.findPurchase(ownerId, purchaseId);

    if (!purchase) throw new NotFoundError("Compra não encontrada.");

    const transactionIds = purchase.installments
        .map((installment) => installment.transactionId)
        .filter((id): id is string => id !== null);

    // Ordem: a compra leva as parcelas (Cascade); depois os lançamentos ficam livres.
    await prisma.$transaction([
        prisma.materialPurchase.delete({ where: { id: purchase.id } }),
        prisma.transaction.deleteMany({ where: { id: { in: transactionIds }, ownerId } }),
    ]);
}
