import { monthRange } from "@/lib/dates/month";

import { constructionRepository } from "../repositories/construction.repository";
import { percent, scheduleProgress } from "../rules/construction.rules";
import type { ConstructionDashboard, ConstructionTrade } from "../types/construction.types";

import { listServices } from "./contracted-service.service";
import { listPurchases } from "./purchase.service";
import { getProject } from "./project.service";

/**
 * Números do "Dashboard de evolução", todos derivados dos registros:
 * metas, mão de obra (serviços + pagamentos), materiais (compras + parcelas).
 * `today` = data sem hora; `month` = "AAAA-MM" (parcelas do mês).
 */
export async function getConstructionDashboard(
    ownerId: string,
    projectId: string,
    today: Date,
    month: string,
): Promise<ConstructionDashboard> {
    const project = await getProject(ownerId, projectId);
    const [services, purchases, goals] = await Promise.all([
        listServices(ownerId, projectId),
        listPurchases(ownerId, projectId),
        constructionRepository.listGoals(ownerId, projectId),
    ]);

    // ── Metas ──
    const done = goals.filter((goal) => goal.doneAt).length;
    const areaGroups = new Map<string, { done: number; total: number }>();

    for (const goal of goals) {
        const name = goal.area?.name ?? "Sem ambiente";
        const group = areaGroups.get(name) ?? { done: 0, total: 0 };
        group.total += 1;
        if (goal.doneAt) group.done += 1;
        areaGroups.set(name, group);
    }

    // ── Mão de obra ──
    const byTrade = new Map<ConstructionTrade, { contractedCents: number; remainingCents: number }>();

    for (const service of services) {
        const row = byTrade.get(service.trade) ?? { contractedCents: 0, remainingCents: 0 };
        row.contractedCents += service.contractedCents;
        row.remainingCents += service.remainingCents;
        byTrade.set(service.trade, row);
    }

    const laborContracted = services.reduce((sum, s) => sum + s.contractedCents, 0);
    const laborPaid = services.reduce((sum, s) => sum + s.paidCents, 0);

    // ── Materiais ──
    const { start, end } = monthRange(month);
    const materialsTotal = purchases.reduce((sum, p) => sum + p.totalCents, 0);
    const materialsPaid = purchases.reduce((sum, p) => sum + p.paidCents, 0);
    const dueThisMonth = purchases
        .flatMap((p) => p.installments)
        .filter((i) => i.dueOn >= start && i.dueOn < end)
        .reduce((sum, i) => sum + i.amountCents, 0);

    // ── Resumo ──
    const investment = laborContracted + materialsTotal;
    const paid = laborPaid + materialsPaid;
    const schedule = scheduleProgress(project.startDate, project.plannedEndDate, today);

    return {
        goals: {
            total: goals.length,
            done,
            pending: goals.length - done,
            percent: percent(done, goals.length),
            byArea: [...areaGroups].map(([areaName, group]) => ({
                areaName,
                ...group,
                percent: percent(group.done, group.total),
            })),
        },
        labor: {
            byTrade: [...byTrade].map(([trade, row]) => ({ trade, ...row })),
            contractedCents: laborContracted,
            paidCents: laborPaid,
            remainingCents: laborContracted - laborPaid,
            paidPercent: percent(laborPaid, laborContracted),
            servicesCount: services.length,
        },
        materials: {
            totalCents: materialsTotal,
            paidCents: materialsPaid,
            unpaidCents: materialsTotal - materialsPaid,
            installmentPurchasesUnpaidCents: purchases
                .filter((p) => p.status === "INSTALLMENTS")
                .reduce((sum, p) => sum + p.unpaidCents, 0),
            pendingPurchasesCents: purchases
                .filter((p) => p.status === "PENDING")
                .reduce((sum, p) => sum + p.unpaidCents, 0),
            purchasesCount: purchases.length,
            dueThisMonthCents: dueThisMonth,
            paidPercent: percent(materialsPaid, materialsTotal),
        },
        overall: {
            investmentCents: investment,
            paidCents: paid,
            remainingCents: investment - paid,
            paidPercent: percent(paid, investment),
            laborSharePercent: percent(laborContracted, investment),
            materialsSharePercent: percent(materialsTotal, investment),
            averagePaidPerDayCents:
                schedule && schedule.elapsedDays > 0 ? Math.round(paid / schedule.elapsedDays) : null,
        },
        schedule,
    };
}
