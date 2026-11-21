import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { requireSession } from "@/lib/auth/session";
import { today } from "@/lib/dates/month";
import { createConstructionPaymentAction } from "@/modules/construction/actions/construction-payment.actions";
import type { ObraPaymentProject } from "@/modules/construction/components/ConstructionPaymentFields/ConstructionPaymentFields";
import { getProject, listProjects, listServices } from "@/modules/construction/server";
import { createTransactionAction } from "@/modules/finance/actions/transaction.actions";
import { TransactionForm } from "@/modules/finance/components/TransactionForm/TransactionForm";

export const metadata: Metadata = {
    title: "Nova transação",
};

export default async function NewTransactionPage() {
    const session = await requireSession();

    // Fase 09 — dados do atalho "Obra": obras da dona com serviços NÃO quitados.
    // Uma obra pessoal tem dezenas de serviços: filtrar no navegador é instantâneo.
    const projects = await listProjects(session.user.id);
    const obraProjects: ObraPaymentProject[] = await Promise.all(
        projects.map(async (project) => {
            const [full, services] = await Promise.all([
                getProject(session.user.id, project.id),
                listServices(session.user.id, project.id),
            ]);

            return {
                projectId: full.id,
                projectName: full.name,
                areas: full.areas,
                phases: full.phases,
                services: services.filter((service) => service.remainingCents > 0),
            };
        }),
    );

    return (
        <>
            <PageHeader title="Nova transação" />
            <TransactionForm
                action={createTransactionAction}
                obraProjects={obraProjects}
                constructionAction={createConstructionPaymentAction}
                defaultDate={today()}
                cancelHref="/finance"
                submitLabel="Salvar transação"
            />
        </>
    );
}
