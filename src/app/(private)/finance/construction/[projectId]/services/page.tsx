import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { buttonClassName } from "@/components/ui/Button/Button";
import { requireSession } from "@/lib/auth/session";
import { NotFoundError } from "@/lib/errors/app-error";
import { formatCents } from "@/lib/money/money";
import { ConstructionTabs } from "@/modules/construction/components/ConstructionTabs/ConstructionTabs";
import { DataTable } from "@/modules/construction/components/DataTable/DataTable";
import { StatusBadge } from "@/modules/construction/components/StatusBadge/StatusBadge";
import { tradeLabel } from "@/modules/construction/types/construction.types";
import { getProject, listServices } from "@/modules/construction/server";
import styles from "./page.module.scss";

export const metadata: Metadata = {
    title: "Serviços contratados",
};

export default async function ConstructionServicesPage({
    params,
}: PageProps<"/finance/construction/[projectId]/services">) {
    const session = await requireSession();
    const { projectId } = await params;

    const project = await getProject(session.user.id, projectId).catch((error) => {
        if (error instanceof NotFoundError) notFound();
        throw error;
    });

    const services = await listServices(session.user.id, project.id);
    const firstPhase = project.phases[0]?.number ?? 1;

    return (
        <>
            <PageHeader
                title={`${project.name} — Serviços contratados`}
                action={
                    <Link
                        href={`/finance/construction/${project.id}/services/new`}
                        className={buttonClassName("primary")}
                    >
                        Novo serviço
                    </Link>
                }
            />
            <ConstructionTabs
                projectId={project.id}
                firstPhaseNumber={firstPhase}
                active="services"
            />

            {services.length === 0 ? (
                <p className={styles.empty}>Nenhum serviço contratado ainda.</p>
            ) : (
                <DataTable
                    caption="Serviços contratados da obra"
                    regionLabel="Tabela de serviços contratados"
                    headers={["Serviço", "Profissão", "Contratado", "Pago", "Falta", "Status", ""]}
                >
                    {services.map((service) => (
                        <tr key={service.id}>
                            <td>
                                {service.description}
                                <span className={styles.sub}>
                                    {service.phaseLabel}
                                    {service.areaName ? ` · ${service.areaName}` : ""}
                                </span>
                            </td>
                            <td>
                                {tradeLabel[service.trade]}
                                {service.professionalName && (
                                    <span className={styles.sub}>{service.professionalName}</span>
                                )}
                            </td>
                            <td className={styles.money}>{formatCents(service.contractedCents)}</td>
                            <td className={styles.money}>{formatCents(service.paidCents)}</td>
                            <td className={styles.money}>{formatCents(service.remainingCents)}</td>
                            <td>
                                <StatusBadge status={service.status} />
                            </td>
                            <td className={styles.actions}>
                                <Link
                                    href={`/finance/construction/${project.id}/services/${service.id}/edit`}
                                    className={buttonClassName("secondary")}
                                >
                                    Editar
                                </Link>
                            </td>
                        </tr>
                    ))}
                </DataTable>
            )}
        </>
    );
}
