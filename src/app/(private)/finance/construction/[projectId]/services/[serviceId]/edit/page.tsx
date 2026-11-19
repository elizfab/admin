import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { requireSession } from "@/lib/auth/session";
import { NotFoundError } from "@/lib/errors/app-error";
import { idSchema } from "@/lib/validations/common.schema";
import { ConstructionTabs } from "@/modules/construction/components/ConstructionTabs/ConstructionTabs";
import { ServiceForm } from "@/modules/construction/components/ConstructionForms/ConstructionForms";
import { updateServiceAction } from "@/modules/construction/actions/service.actions";
import { getProject, getService } from "@/modules/construction/server";

export const metadata: Metadata = {
    title: "Editar serviço",
};

export default async function EditServicePage({
    params,
}: PageProps<"/finance/construction/[projectId]/services/[serviceId]/edit">) {
    const session = await requireSession();
    const { projectId, serviceId } = await params;

    if (!idSchema.safeParse(serviceId).success) notFound();

    const { service } = await getService(session.user.id, serviceId).catch((error) => {
        if (error instanceof NotFoundError) notFound();
        throw error;
    });

    if (service.projectId !== projectId) notFound();

    const project = await getProject(session.user.id, service.projectId);
    const firstPhase = project.phases[0]?.number ?? 1;
    const action = updateServiceAction.bind(null, service.id);

    return (
        <>
            <PageHeader title={`${project.name} — Editar serviço`} />
            <ConstructionTabs
                projectId={project.id}
                firstPhaseNumber={firstPhase}
                active="services"
            />
            <ServiceForm
                action={action}
                projectId={project.id}
                phases={project.phases}
                areas={project.areas}
                service={{
                    phaseId: service.phaseId,
                    areaId: service.areaId,
                    trade: service.trade,
                    professionalName: service.professionalName,
                    description: service.description,
                    contractedCents: service.contractedCents,
                    notes: service.notes,
                }}
                cancelHref={`/finance/construction/${project.id}/services`}
                submitLabel="Salvar alterações"
            />
        </>
    );
}
