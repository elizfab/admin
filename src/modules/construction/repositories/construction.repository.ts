import { prisma } from "@/lib/db/prisma";

/**
 * Leituras da obra. REGRA DE ISOLAMENTO: só ConstructionProject tem ownerId;
 * todo o resto é filtrado PELA OBRA (`project: { ownerId }`), nunca só pelo id.
 * As escritas que mexem em duas tabelas (pagamento + lançamento) ficam nos
 * serviços, dentro de prisma.$transaction.
 */

export const ownedProject = (ownerId: string, projectId: string) => ({
    id: projectId,
    ownerId,
});

export const constructionRepository = {
    listProjects(ownerId: string) {
        return prisma.constructionProject.findMany({
            where: { ownerId },
            // Mais recente primeiro (data de início); empate estável pelo id.
            orderBy: [{ startDate: { sort: "desc", nulls: "last" } }, { id: "asc" }],
        });
    },

    /**
     * Cards da grade da aba Construção: filtrados por categoria (ou "sem
     * categoria") e paginados com limite + 1 para o "Ver mais" (OBRA-R18).
     */
    listProjectCards(
        ownerId: string,
        filter: { categoryId?: string; uncategorized?: boolean },
        page: { offset: number; limit: number },
    ) {
        return prisma.constructionProject.findMany({
            where: {
                ownerId,
                ...(filter.categoryId
                    ? { categoryIds: { has: filter.categoryId } }
                    : filter.uncategorized
                      ? { categoryIds: { isEmpty: true } }
                      : {}),
            },
            select: {
                id: true,
                name: true,
                startDate: true,
                plannedEndDate: true,
                categoryIds: true,
            },
            orderBy: [{ startDate: { sort: "desc", nulls: "last" } }, { id: "asc" }],
            skip: page.offset,
            take: page.limit + 1,
        });
    },

    /** categoryIds de todas as obras da dona (base pequena: conta no serviço). */
    listProjectCategoryIds(ownerId: string) {
        return prisma.constructionProject.findMany({
            where: { ownerId },
            select: { categoryIds: true },
        });
    },

    findProject(ownerId: string, projectId: string) {
        return prisma.constructionProject.findFirst({
            where: ownedProject(ownerId, projectId),
            include: {
                areas: { orderBy: { name: "asc" } },
                phases: { orderBy: { number: "asc" } },
            },
        });
    },

    listServices(ownerId: string, projectId: string, phaseId?: string) {
        return prisma.constructionService.findMany({
            where: { projectId, phaseId, project: { ownerId } },
            include: { phase: true, area: true },
            orderBy: [{ phase: { number: "asc" } }, { trade: "asc" }, { createdAt: "asc" }],
        });
    },

    findService(ownerId: string, serviceId: string) {
        return prisma.constructionService.findFirst({
            where: { id: serviceId, project: { ownerId } },
            include: { phase: true, area: true, project: true },
        });
    },

    /** Total pago por serviço (uma linha por serviço com pagamento). */
    sumPaymentsByService(serviceIds: string[]) {
        return prisma.servicePayment.groupBy({
            by: ["serviceId"],
            where: { serviceId: { in: serviceIds } },
            _sum: { amountCents: true },
        });
    },

    listPayments(ownerId: string, projectId: string, serviceId?: string) {
        return prisma.servicePayment.findMany({
            where: { serviceId, service: { projectId, project: { ownerId } } },
            include: { service: { include: { phase: true } } },
            orderBy: [{ paidOn: "desc" }, { id: "desc" }],
        });
    },

    findPayment(ownerId: string, paymentId: string) {
        return prisma.servicePayment.findFirst({
            where: { id: paymentId, service: { project: { ownerId } } },
        });
    },

    listPurchases(ownerId: string, projectId: string) {
        return prisma.materialPurchase.findMany({
            where: { projectId, project: { ownerId } },
            include: { installments: { orderBy: { number: "asc" } }, area: true },
            orderBy: [{ purchasedOn: "asc" }, { createdAt: "asc" }],
        });
    },

    findPurchase(ownerId: string, purchaseId: string) {
        return prisma.materialPurchase.findFirst({
            where: { id: purchaseId, project: { ownerId } },
            include: { installments: true, project: true },
        });
    },

    findInstallment(ownerId: string, installmentId: string) {
        return prisma.materialInstallment.findFirst({
            where: { id: installmentId, purchase: { project: { ownerId } } },
            include: { purchase: { include: { project: true } } },
        });
    },

    listGoals(ownerId: string, projectId: string) {
        return prisma.constructionGoal.findMany({
            where: { projectId, project: { ownerId } },
            include: { area: true },
            orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        });
    },

    findGoal(ownerId: string, goalId: string) {
        return prisma.constructionGoal.findFirst({ where: { id: goalId, project: { ownerId } } });
    },
};
