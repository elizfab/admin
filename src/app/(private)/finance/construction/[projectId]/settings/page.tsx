import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { requireSession } from "@/lib/auth/session";
import { NotFoundError } from "@/lib/errors/app-error";
import { ConstructionTabs } from "@/modules/construction/components/ConstructionTabs/ConstructionTabs";
import {
    AddAreaForm,
    AddPhaseForm,
    ProjectSettingsForm,
} from "@/modules/construction/components/ConstructionForms/SettingsForms";
import { DeleteButton } from "@/modules/construction/components/DeleteButton/DeleteButton";
import { DataTable } from "@/modules/construction/components/DataTable/DataTable";
import { formatDay } from "@/lib/dates/month";
import {
    addAreaAction,
    addPhaseAction,
    updateProjectAction,
} from "@/modules/construction/actions/project.actions";
import { deleteGoalAction } from "@/modules/construction/actions/goal.actions";
import { deleteServiceAction } from "@/modules/construction/actions/service.actions";
import { deletePurchaseAction } from "@/modules/construction/actions/purchase.actions";
import { getProject, listGoals, listPurchases, listServices } from "@/modules/construction/server";
import { formatCents } from "@/lib/money/money";
import { serviceStatusLabel } from "@/modules/construction/types/construction.types";
import { dayToInput } from "@/lib/dates/month";
import styles from "./page.module.scss";

export const metadata: Metadata = {
    title: "Configuração da obra",
};

export default async function ConstructionSettingsPage({
    params,
}: PageProps<"/finance/construction/[projectId]/settings">) {
    const session = await requireSession();
    const { projectId } = await params;

    const project = await getProject(session.user.id, projectId).catch((error) => {
        if (error instanceof NotFoundError) notFound();
        throw error;
    });

    const [services, purchases, goals] = await Promise.all([
        listServices(session.user.id, project.id),
        listPurchases(session.user.id, project.id),
        listGoals(session.user.id, project.id),
    ]);
    const firstPhase = project.phases[0]?.number ?? 1;
    const updateAction = updateProjectAction.bind(null, project.id);
    const addArea = addAreaAction.bind(null, project.id);
    const addPhase = addPhaseAction.bind(null, project.id);
    const suggestedPhase = Math.max(0, ...project.phases.map((p) => p.number)) + 1;

    return (
        <>
            <PageHeader title={`${project.name} — Configuração`} />
            <ConstructionTabs
                projectId={project.id}
                firstPhaseNumber={firstPhase}
                active="settings"
            />

            <section className={styles.section} aria-labelledby="project-data">
                <h2 id="project-data" className={styles.sectionTitle}>
                    Dados da obra
                </h2>
                <ProjectSettingsForm
                    action={updateAction}
                    project={{
                        name: project.name,
                        startDate: project.startDate ? dayToInput(project.startDate) : null,
                        plannedEndDate: project.plannedEndDate
                            ? dayToInput(project.plannedEndDate)
                            : null,
                    }}
                />
            </section>

            <section className={styles.section} aria-labelledby="areas">
                <h2 id="areas" className={styles.sectionTitle}>
                    Ambientes
                </h2>
                <ul className={styles.chips}>
                    {project.areas.map((area) => (
                        <li key={area.id} className={styles.chip}>
                            {area.name}
                        </li>
                    ))}
                </ul>
                <AddAreaForm action={addArea} />
            </section>

            <section className={styles.section} aria-labelledby="phases">
                <h2 id="phases" className={styles.sectionTitle}>
                    Fases
                </h2>
                <ul className={styles.chips}>
                    {project.phases.map((phase) => (
                        <li key={phase.id} className={styles.chip}>
                            Fase {String(phase.number).padStart(2, "0")}
                            {phase.name ? ` — ${phase.name}` : ""}
                        </li>
                    ))}
                </ul>
                <AddPhaseForm action={addPhase} suggestedNumber={suggestedPhase} />
            </section>

            <section className={styles.section} aria-labelledby="danger">
                <h2 id="danger" className={styles.sectionTitle}>
                    Zona de perigo
                </h2>
                <p className={styles.warning}>
                    Excluir remove os registros do Financeiro junto. Use com cuidado.
                </p>

                {services.length > 0 && (
                    <DataTable
                        caption="Serviços contratados"
                        regionLabel="Serviços contratados"
                        headers={["Serviço", "Valor", "Status", ""]}
                    >
                        {services.map((service) => (
                            <tr key={service.id}>
                                <td>{service.label}</td>
                                <td className={styles.money}>
                                    {formatCents(service.contractedCents)}
                                </td>
                                <td>{serviceStatusLabel[service.status]}</td>
                                <td className={styles.actions}>
                                    <DeleteButton
                                        label={`Excluir o serviço ${service.description}`}
                                        title="Excluir serviço?"
                                        description="O serviço e seus pagamentos saem do Financeiro também."
                                        action={deleteServiceAction.bind(null, service.id)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </DataTable>
                )}

                {purchases.length > 0 && (
                    <DataTable
                        caption="Compras de material"
                        regionLabel="Compras de material"
                        headers={["Item", "Total", "Pago", ""]}
                    >
                        {purchases.map((purchase) => (
                            <tr key={purchase.id}>
                                <td>{purchase.item}</td>
                                <td className={styles.money}>{formatCents(purchase.totalCents)}</td>
                                <td className={styles.money}>{formatCents(purchase.paidCents)}</td>
                                <td className={styles.actions}>
                                    <DeleteButton
                                        label={`Excluir a compra ${purchase.item}`}
                                        title="Excluir compra?"
                                        description="A compra, as parcelas e os lançamentos saem do Financeiro também."
                                        action={deletePurchaseAction.bind(
                                            null,
                                            purchase.id,
                                            project.id,
                                        )}
                                    />
                                </td>
                            </tr>
                        ))}
                    </DataTable>
                )}

                {goals.length > 0 && (
                    <DataTable
                        caption="Metas"
                        regionLabel="Metas"
                        headers={["Meta", "Ambiente", "Status", ""]}
                    >
                        {goals.map((goal) => (
                            <tr key={goal.id}>
                                <td>{goal.title}</td>
                                <td>{goal.area?.name ?? "—"}</td>
                                <td>
                                    {goal.doneAt
                                        ? `Feita em ${formatDay(goal.doneAt)}`
                                        : "Pendente"}
                                </td>
                                <td className={styles.actions}>
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
            </section>
        </>
    );
}
