import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { buttonClassName } from "@/components/ui/Button/Button";
import { requireSession } from "@/lib/auth/session";
import { formatDay } from "@/lib/dates/month";
import { formatCents } from "@/lib/money/money";
import { NotFoundError } from "@/lib/errors/app-error";
import { ConstructionTabs } from "@/modules/construction/components/ConstructionTabs/ConstructionTabs";
import { DataTable } from "@/modules/construction/components/DataTable/DataTable";
import { DeleteButton } from "@/modules/construction/components/DeleteButton/DeleteButton";
import { deleteServicePaymentAction } from "@/modules/construction/actions/payment.actions";
import { paymentMethodLabel } from "@/modules/construction/types/construction.types";
import { getProject, listPayments } from "@/modules/construction/server";
import styles from "./page.module.scss";

export const metadata: Metadata = {
    title: "Pagamentos de serviços",
};

export default async function ConstructionPaymentsPage({
    params,
}: PageProps<"/finance/construction/[projectId]/payments">) {
    const session = await requireSession();
    const { projectId } = await params;

    const project = await getProject(session.user.id, projectId).catch((error) => {
        if (error instanceof NotFoundError) notFound();
        throw error;
    });

    const payments = await listPayments(session.user.id, project.id);

    return (
        <>
            <PageHeader
                title={`${project.name} — Pagamentos`}
                action={
                    <Link
                        href={`/finance/construction/${project.id}/payments/new`}
                        className={buttonClassName("primary")}
                    >
                        Registrar pagamento
                    </Link>
                }
            />
            <ConstructionTabs projectId={project.id} active="payments" />

            {payments.length === 0 ? (
                <p className={styles.empty}>Nenhum pagamento registrado ainda.</p>
            ) : (
                <DataTable
                    caption="Pagamentos de serviços da obra"
                    regionLabel="Tabela de pagamentos"
                    headers={["Data", "Serviço", "Fase", "Forma", "Valor", "Observações", ""]}
                >
                    {payments.map((payment) => (
                        <tr key={payment.id}>
                            <td>{formatDay(payment.paidOn)}</td>
                            <td>
                                {payment.service.description}
                                {payment.service.professionalName && (
                                    <span className={styles.sub}>
                                        {payment.service.professionalName}
                                    </span>
                                )}
                            </td>
                            <td>Fase {String(payment.service.phase.number).padStart(2, "0")}</td>
                            <td>{paymentMethodLabel[payment.method]}</td>
                            <td className={styles.money}>{formatCents(payment.amountCents)}</td>
                            <td>{payment.notes ?? "—"}</td>
                            <td className={styles.actions}>
                                <DeleteButton
                                    label={`Excluir o pagamento de ${formatDay(payment.paidOn)}`}
                                    title="Excluir pagamento?"
                                    description="O lançamento será removido do Financeiro e o serviço voltará a ficar em aberto."
                                    action={deleteServicePaymentAction.bind(null, payment.id)}
                                />
                            </td>
                        </tr>
                    ))}
                </DataTable>
            )}
        </>
    );
}
