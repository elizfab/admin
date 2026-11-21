import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { requireSession } from "@/lib/auth/session";
import { today } from "@/lib/dates/month";
import { NotFoundError } from "@/lib/errors/app-error";
import { ConstructionTabs } from "@/modules/construction/components/ConstructionTabs/ConstructionTabs";
import { PurchaseForm } from "@/modules/construction/components/ConstructionForms/ConstructionForms";
import { createPurchaseAction } from "@/modules/construction/actions/purchase.actions";
import { getProject } from "@/modules/construction/server";

export const metadata: Metadata = {
    title: "Nova compra",
};

export default async function NewPurchasePage({
    params,
}: PageProps<"/finance/construction/[projectId]/purchases/new">) {
    const session = await requireSession();
    const { projectId } = await params;

    const project = await getProject(session.user.id, projectId).catch((error) => {
        if (error instanceof NotFoundError) notFound();
        throw error;
    });
    const action = createPurchaseAction.bind(null, project.id);

    return (
        <>
            <PageHeader title={`${project.name} — Nova compra`} />
            <ConstructionTabs projectId={project.id} active="purchases" />
            <PurchaseForm
                action={action}
                areas={project.areas}
                defaultDate={today()}
                cancelHref={`/finance/construction/${project.id}/purchases`}
            />
        </>
    );
}
