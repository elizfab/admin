import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { requireSession } from "@/lib/auth/session";
import { NotFoundError } from "@/lib/errors/app-error";
import { ConstructionTabs } from "@/modules/construction/components/ConstructionTabs/ConstructionTabs";
import { ServiceForm } from "@/modules/construction/components/ConstructionForms/ConstructionForms";
import { createServiceAction } from "@/modules/construction/actions/service.actions";
import { getProject } from "@/modules/construction/server";

export const metadata: Metadata = {
    title: "Novo serviço",
};

export default async function NewServicePage({
    params,
}: PageProps<"/finance/construction/[projectId]/services/new">) {
    const session = await requireSession();
    const { projectId } = await params;

    const project = await getProject(session.user.id, projectId).catch((error) => {
        if (error instanceof NotFoundError) notFound();
        throw error;
    });

    const firstPhase = project.phases[0]?.number ?? 1;
    const action = createServiceAction.bind(null, project.id);

    return (
        <>
            <PageHeader title={`${project.name} — Novo serviço`} />
            <ConstructionTabs projectId={project.id} firstPhaseNumber={firstPhase} active="services" />
            <ServiceForm
                action={action}
                projectId={project.id}
                phases={project.phases}
                areas={project.areas}
                cancelHref={`/finance/construction/${project.id}/services`}
                submitLabel="Salvar serviço"
            />
        </>
    );
}
