import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { requireSession } from "@/lib/auth/session";
import { formatDay } from "@/lib/dates/month";
import { NotFoundError } from "@/lib/errors/app-error";
import { ConstructionTabs } from "@/modules/construction/components/ConstructionTabs/ConstructionTabs";
import { DataTable } from "@/modules/construction/components/DataTable/DataTable";
import { DeleteButton } from "@/modules/construction/components/DeleteButton/DeleteButton";
import { AddGoalForm } from "@/modules/construction/components/ConstructionForms/SettingsForms";
import { GoalToggle } from "@/modules/construction/components/GoalToggle/GoalToggle";
import { deleteGoalAction, createGoalAction } from "@/modules/construction/actions/goal.actions";
import { getProject, listGoals } from "@/modules/construction/server";
import styles from "./page.module.scss";

export const metadata: Metadata = {
    title: "Metas da obra",
};

export default async function ConstructionGoalsPage({
    params,
}: PageProps<"/finance/construction/[projectId]/goals">) {
    const session = await requireSession();
    const { projectId } = await params;

    const project = await getProject(session.user.id, projectId).catch((error) => {
        if (error instanceof NotFoundError) notFound();
        throw error;
    });

    const goals = await listGoals(session.user.id, project.id);
    const firstPhase = project.phases[0]?.number ?? 1;
    const addGoal = createGoalAction.bind(null, project.id);

    return (
        <>
            <PageHeader title={`${project.name} — Metas`} />
            <ConstructionTabs projectId={project.id} firstPhaseNumber={firstPhase} active="goals" />

            <AddGoalForm action={addGoal} areas={project.areas} />

            {goals.length === 0 ? (
                <p className={styles.empty}>Nenhuma meta cadastrada.</p>
            ) : (
                <DataTable
                    caption="Metas da obra"
                    regionLabel="Tabela de metas"
                    headers={["Meta", "Ambiente", "Status", ""]}
                >
                    {goals.map((goal) => (
                        <tr key={goal.id} className={goal.doneAt ? styles.done : undefined}>
                            <td>{goal.title}</td>
                            <td>{goal.area?.name ?? "—"}</td>
                            <td>
                                {goal.doneAt ? (
                                    `Feita em ${formatDay(goal.doneAt)}`
                                ) : (
                                    <GoalToggle goalId={goal.id} projectId={project.id} done={false} />
                                )}
                            </td>
                            <td className={styles.actions}>
                                {goal.doneAt && (
                                    <GoalToggle goalId={goal.id} projectId={project.id} done />
                                )}
                                <DeleteButton
                                    label={`Excluir a meta ${goal.title}`}
                                    title="Excluir meta?"
                                    description="A meta será removida permanentemente."
                                    action={deleteGoalAction.bind(null, goal.id, project.id)}
                                />
                            </td>
                        </tr>
                    ))}
                </DataTable>
            )}
        </>
    );
}
