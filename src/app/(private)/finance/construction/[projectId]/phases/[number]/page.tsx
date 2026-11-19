import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { requireSession } from "@/lib/auth/session";
import { formatCents } from "@/lib/money/money";
import { NotFoundError } from "@/lib/errors/app-error";
import { ConstructionTabs } from "@/modules/construction/components/ConstructionTabs/ConstructionTabs";
import { PhaseNavigator } from "@/modules/construction/components/PhaseNavigator/PhaseNavigator";
import { PhaseServiceCard } from "@/modules/construction/components/PhaseServiceCard/PhaseServiceCard";
import { getProject, listPayments, listServices } from "@/modules/construction/server";
import Link from "next/link";
import styles from "./page.module.scss";

export const metadata: Metadata = {
    title: "Fase da obra",
};

export default async function ConstructionPhasePage({
    params,
}: PageProps<"/finance/construction/[projectId]/phases/[number]">) {
    const session = await requireSession();
    const { projectId, number } = await params;

    const project = await getProject(session.user.id, projectId).catch((error) => {
        if (error instanceof NotFoundError) notFound();
        throw error;
    });

    const phaseNumber = Number(number);
    const phase = project.phases.find((p) => p.number === phaseNumber);

    if (!phase || !Number.isInteger(phaseNumber)) notFound();

    const [services, payments] = await Promise.all([
        listServices(session.user.id, project.id, phase.id),
        listPayments(session.user.id, project.id),
    ]);

    const paymentsByService = new Map<
        string,
        { id: string; paidOn: Date; amountCents: number }[]
    >();
    for (const payment of payments) {
        const list = paymentsByService.get(payment.serviceId) ?? [];
        list.push({ id: payment.id, paidOn: payment.paidOn, amountCents: payment.amountCents });
        paymentsByService.set(payment.serviceId, list);
    }

    const firstPhase = project.phases[0]?.number ?? 1;
    const phaseServices = services.filter((s) => s.phaseId === phase.id);
    const contracted = phaseServices.reduce((sum, s) => sum + s.contractedCents, 0);
    const paid = phaseServices.reduce((sum, s) => sum + s.paidCents, 0);

    return (
        <>
            <PageHeader title={`${project.name} — Evolução da obra`} />
            <ConstructionTabs
                projectId={project.id}
                firstPhaseNumber={firstPhase}
                active="phases"
            />

            <PhaseNavigator
                projectId={project.id}
                number={phase.number}
                numbers={project.phases.map((p) => p.number)}
            />

            <p className={styles.summary}>
                {phase.name ? `${phase.name} · ` : ""}
                {phaseServices.length} serviço(s) · Contratado {formatCents(contracted)} · Pago{" "}
                {formatCents(paid)}
            </p>

            {phaseServices.length === 0 ? (
                <p className={styles.empty}>
                    Nenhum serviço nesta fase.{" "}
                    <Link href={`/finance/construction/${project.id}/services/new`}>
                        Cadastrar serviço
                    </Link>
                </p>
            ) : (
                <div className={styles.cards}>
                    {phaseServices.map((service) => (
                        <PhaseServiceCard
                            key={service.id}
                            service={service}
                            payments={paymentsByService.get(service.id) ?? []}
                            projectId={project.id}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
