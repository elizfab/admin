import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { buttonClassName } from "@/components/ui/Button/Button";
import { requireSession } from "@/lib/auth/session";
import { formatCents } from "@/lib/money/money";
import { currentMonth, formatDay } from "@/lib/dates/month";
import { ConstructionTabs } from "@/modules/construction/components/ConstructionTabs/ConstructionTabs";
import { StatCard } from "@/modules/construction/components/StatCard/StatCard";
import { NotFoundError } from "@/lib/errors/app-error";
import { getConstructionDashboard, getProject, listGoals } from "@/modules/construction/server";
import { tradeLabel } from "@/modules/construction/types/construction.types";
import styles from "./page.module.scss";

export const metadata: Metadata = {
    title: "Dashboard da obra",
};

export default async function ConstructionDashboardPage({
    params,
}: PageProps<"/finance/construction/[projectId]">) {
    const session = await requireSession();
    const { projectId } = await params;

    const project = await getProject(session.user.id, projectId).catch((error) => {
        if (error instanceof NotFoundError) notFound();
        throw error;
    });

    const [dashboard, goals] = await Promise.all([
        getConstructionDashboard(session.user.id, project.id, new Date(), currentMonth()),
        listGoals(session.user.id, project.id),
    ]);
    const pendingGoals = goals.filter((goal) => !goal.doneAt);

    return (
        <>
            <PageHeader
                title={project.name}
                description={
                    project.startDate
                        ? `Início ${formatDay(project.startDate)}` +
                          (project.plannedEndDate
                              ? ` · Fim previsto ${formatDay(project.plannedEndDate)}`
                              : "")
                        : undefined
                }
            />
            <ConstructionTabs projectId={project.id} active="dashboard" />

            <section aria-label="Resumo do investimento" className={styles.stats}>
                <StatCard
                    label="Investimento total"
                    value={formatCents(dashboard.overall.investmentCents)}
                    footer={`${dashboard.overall.paidPercent}% pago`}
                />
                <StatCard
                    label="Total pago"
                    value={formatCents(dashboard.overall.paidCents)}
                    tone="ok"
                />
                <StatCard
                    label="Falta pagar"
                    value={formatCents(dashboard.overall.remainingCents)}
                    tone={dashboard.overall.remainingCents > 0 ? "alert" : "ok"}
                />
                <StatCard
                    label="Gasto médio por dia"
                    value={
                        dashboard.overall.averagePaidPerDayCents !== null
                            ? formatCents(dashboard.overall.averagePaidPerDayCents)
                            : "—"
                    }
                />
            </section>

            {dashboard.schedule && (
                <p className={styles.schedule}>
                    Cronograma: {dashboard.schedule.elapsedDays} dias decorridos ·{" "}
                    {dashboard.schedule.remainingDays} dias restantes · {dashboard.schedule.percent}
                    % do prazo
                </p>
            )}

            <div className={styles.panels}>
                <section aria-labelledby="goals-heading" className={styles.panel}>
                    <h2 id="goals-heading" className={styles.panelTitle}>
                        Metas — {dashboard.goals.percent}% ({dashboard.goals.done}/
                        {dashboard.goals.total})
                    </h2>
                    {pendingGoals.length > 0 ? (
                        <ul className={styles.goals}>
                            {pendingGoals.slice(0, 5).map((goal) => (
                                <li key={goal.id}>
                                    {goal.title}
                                    {goal.area && (
                                        <span className={styles.muted}> · {goal.area.name}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className={styles.muted}>
                            {dashboard.goals.total === 0
                                ? "Nenhuma meta cadastrada."
                                : "Todas as metas concluídas!"}
                        </p>
                    )}
                    <Link
                        href={`/finance/construction/${project.id}/goals`}
                        className={styles.moreLink}
                    >
                        Ver todas as metas
                    </Link>
                </section>

                <section aria-labelledby="labor-heading" className={styles.panel}>
                    <h2 id="labor-heading" className={styles.panelTitle}>
                        Mão de obra — {dashboard.labor.paidPercent}% pago
                    </h2>
                    <ul className={styles.breakdown}>
                        {dashboard.labor.byTrade.map((row) => (
                            <li key={row.trade}>
                                <span>{tradeLabel[row.trade]}</span>
                                <span className={styles.muted}>
                                    {formatCents(row.remainingCents)} a pagar de{" "}
                                    {formatCents(row.contractedCents)}
                                </span>
                            </li>
                        ))}
                        {dashboard.labor.byTrade.length === 0 && (
                            <li className={styles.muted}>Nenhum serviço contratado ainda.</li>
                        )}
                    </ul>
                    <Link
                        href={`/finance/construction/${project.id}/services`}
                        className={buttonClassName("secondary")}
                    >
                        Gerenciar serviços
                    </Link>
                </section>

                <section aria-labelledby="materials-heading" className={styles.panel}>
                    <h2 id="materials-heading" className={styles.panelTitle}>
                        Materiais — {dashboard.materials.paidPercent}% pago
                    </h2>
                    <dl className={styles.materials}>
                        <div>
                            <dt>Total em compras</dt>
                            <dd>{formatCents(dashboard.materials.totalCents)}</dd>
                        </div>
                        <div>
                            <dt>Pago</dt>
                            <dd>{formatCents(dashboard.materials.paidCents)}</dd>
                        </div>
                        <div>
                            <dt>A pagar</dt>
                            <dd>{formatCents(dashboard.materials.unpaidCents)}</dd>
                        </div>
                        <div>
                            <dt>
                                Parcelas vencendo em {currentMonth().slice(5, 7)}/
                                {currentMonth().slice(0, 4)}
                            </dt>
                            <dd>{formatCents(dashboard.materials.dueThisMonthCents)}</dd>
                        </div>
                    </dl>
                    <Link
                        href={`/finance/construction/${project.id}/purchases`}
                        className={buttonClassName("secondary")}
                    >
                        Gerenciar compras
                    </Link>
                </section>
            </div>
        </>
    );
}
