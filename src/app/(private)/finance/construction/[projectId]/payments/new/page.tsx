import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { requireSession } from "@/lib/auth/session";
import { NotFoundError } from "@/lib/errors/app-error";
import { ConstructionTabs } from "@/modules/construction/components/ConstructionTabs/ConstructionTabs";
import {
    PaymentForm,
    type PaymentServiceOption,
} from "@/modules/construction/components/ConstructionForms/ConstructionForms";
import { createServicePaymentAction } from "@/modules/construction/actions/payment.actions";
import { getProject, listServices } from "@/modules/construction/server";

export const metadata: Metadata = {
    title: "Registrar pagamento",
};

export default async function NewPaymentPage({
    params,
    searchParams,
}: PageProps<"/finance/construction/[projectId]/payments/new">) {
    const session = await requireSession();
    const { projectId } = await params;
    const { serviceId } = await searchParams;

    const project = await getProject(session.user.id, projectId).catch((error) => {
        if (error instanceof NotFoundError) notFound();
        throw error;
    });

    const services = await listServices(session.user.id, project.id);
    // Só serviços com saldo: o servidor também valida, mas a tela já filtra.
    const options: PaymentServiceOption[] = services
        .filter((service) => service.remainingCents > 0)
        .map((service) => ({
            id: service.id,
            label: service.label,
            professionalName: service.professionalName,
            contractedCents: service.contractedCents,
            paidCents: service.paidCents,
            remainingCents: service.remainingCents,
        }));
    const selected = typeof serviceId === "string" ? serviceId : undefined;

    return (
        <>
            <PageHeader title={`${project.name} — Registrar pagamento`} />
            <ConstructionTabs projectId={project.id} active="payments" />

            {options.length === 0 ? (
                <p>
                    Todos os serviços estão quitados. Cadastre um novo serviço em{" "}
                    <a href={`/finance/construction/${project.id}/services/new`}>Serviços</a>.
                </p>
            ) : (
                <PaymentForm
                    action={createServicePaymentAction}
                    services={options}
                    selectedServiceId={selected}
                    cancelHref={`/finance/construction/${project.id}/payments`}
                />
            )}
        </>
    );
}
