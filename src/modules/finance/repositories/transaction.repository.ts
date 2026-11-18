import { prisma } from "@/lib/db/prisma";

import type {
    CreateTransactionInput,
    UpdateTransactionInput,
} from "../schemas/transaction.schema";

type DateRange = { start: Date; end: Date };

/** Filtro comum: SEMPRE pela dona e, quando houver, pelo período [start, end). */
function ownerInRange(ownerId: string, range: DateRange) {
    return { ownerId, occurredOn: { gte: range.start, lt: range.end } };
}

/**
 * Acesso a dados das transações.
 * REGRA (a mesma dos projetos): toda leitura filtra por ownerId.
 */
export const transactionRepository = {
    listByOwnerInRange(ownerId: string, range: DateRange) {
        return prisma.transaction.findMany({
            where: ownerInRange(ownerId, range),
            orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
            // Origem "Obra" (Fase 09): um dos dois vem preenchido → selo + "Ver na obra".
            include: {
                servicePayment: {
                    select: {
                        service: {
                            select: { projectId: true, phase: { select: { number: true } } },
                        },
                    },
                },
                materialInstallment: {
                    select: { purchase: { select: { projectId: true } } },
                },
            },
        });
    },

    findByIdForOwner(id: string, ownerId: string) {
        return prisma.transaction.findFirst({
            where: { id, ownerId },
            // Lançamento gerado pela Obra (Fase 09): um dos dois vem preenchido.
            include: {
                servicePayment: { select: { id: true } },
                materialInstallment: { select: { id: true } },
            },
        });
    },

    create(ownerId: string, data: CreateTransactionInput) {
        return prisma.transaction.create({ data: { ...data, ownerId } });
    },

    update(id: string, data: UpdateTransactionInput) {
        return prisma.transaction.update({ where: { id }, data });
    },

    delete(id: string) {
        return prisma.transaction.delete({ where: { id } });
    },

    /** Total de receitas e de despesas no período: a SOMA é feita pelo banco. */
    sumByType(ownerId: string, range: DateRange) {
        return prisma.transaction.groupBy({
            by: ["type"],
            where: ownerInRange(ownerId, range),
            _sum: { amountCents: true },
        });
    },

    /** Despesas do período agrupadas por categoria, da maior para a menor. */
    sumExpensesByCategory(ownerId: string, range: DateRange) {
        return prisma.transaction.groupBy({
            by: ["category"],
            where: { ...ownerInRange(ownerId, range), type: "EXPENSE" },
            _sum: { amountCents: true },
            orderBy: { _sum: { amountCents: "desc" } },
        });
    },
};
