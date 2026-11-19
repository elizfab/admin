import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { buttonClassName } from "@/components/ui/Button/Button";
import { requireSession } from "@/lib/auth/session";
import { formatDay, today } from "@/lib/dates/month";
import { formatCents } from "@/lib/money/money";
import { NotFoundError } from "@/lib/errors/app-error";
import { ConstructionTabs } from "@/modules/construction/components/ConstructionTabs/ConstructionTabs";
import { DataTable } from "@/modules/construction/components/DataTable/DataTable";
import { DeleteButton } from "@/modules/construction/components/DeleteButton/DeleteButton";
import {
    PayInstallmentForm,
    UnpayInstallmentButton,
} from "@/modules/construction/components/ConstructionForms/SettingsForms";
import {
    deletePurchaseAction,
    payInstallmentAction,
} from "@/modules/construction/actions/purchase.actions";
import {
    paymentMethodLabel,
    purchaseStatusLabel,
} from "@/modules/construction/types/construction.types";
import { getProject, listPurchases } from "@/modules/construction/server";
import styles from "./page.module.scss";

export const metadata: Metadata = {
    title: "Compras de material",
};

export default async function ConstructionPurchasesPage({
    params,
}: PageProps<"/finance/construction/[projectId]/purchases">) {
    const session = await requireSession();
    const { projectId } = await params;

    const project = await getProject(session.user.id, projectId).catch((error) => {
        if (error instanceof NotFoundError) notFound();
        throw error;
    });

    const purchases = await listPurchases(session.user.id, project.id);
    const firstPhase = project.phases[0]?.number ?? 1;
    const defaultDate = today();

    return (
        <>
            <PageHeader
                title={`${project.name} — Compras de material`}
                action={
                    <Link
                        href={`/finance/construction/${project.id}/purchases/new`}
                        className={buttonClassName("primary")}
                    >
                        Nova compra
                    </Link>
                }
            />
            <ConstructionTabs
                projectId={project.id}
                firstPhaseNumber={firstPhase}
                active="purchases"
            />

            {purchases.length === 0 ? (
                <p className={styles.empty}>Nenhuma compra registrada ainda.</p>
            ) : (
                purchases.map((purchase) => (
                    <section
                        key={purchase.id}
                        className={styles.purchase}
                        aria-label={purchase.item}
                    >
                        <header className={styles.purchaseHeader}>
                            <div>
                                <h2 className={styles.purchaseTitle}>{purchase.item}</h2>
                                <p className={styles.sub}>
                                    {formatDay(purchase.purchasedOn)}
                                    {purchase.area ? ` · ${purchase.area.name}` : ""}
                                    {purchase.supplier ? ` · ${purchase.supplier}` : ""}
                                    {` · ${paymentMethodLabel[purchase.method]}`}
                                    {` · ${purchaseStatusLabel[purchase.status]}`}
                                </p>
                            </div>
                            <DeleteButton
                                label={`Excluir a compra ${purchase.item}`}
                                title="Excluir compra?"
                                description="A compra, as parcelas e os lançamentos saem do Financeiro também."
                                action={deletePurchaseAction.bind(null, purchase.id, project.id)}
                            />
                        </header>

                        <DataTable
                            caption={`Parcelas de ${purchase.item}`}
                            regionLabel={`Parcelas de ${purchase.item}`}
                            headers={["Parcela", "Vencimento", "Valor", "Pago em", ""]}
                        >
                            {purchase.installments.map((installment) => (
                                <tr key={installment.id}>
                                    <td>
                                        {installment.number}/{purchase.installments.length}
                                    </td>
                                    <td>{formatDay(installment.dueOn)}</td>
                                    <td className={styles.money}>
                                        {formatCents(installment.amountCents)}
                                    </td>
                                    <td>
                                        {installment.paidOn ? formatDay(installment.paidOn) : "—"}
                                    </td>
                                    <td className={styles.actions}>
                                        {installment.paidOn ? (
                                            <UnpayInstallmentButton
                                                installmentId={installment.id}
                                                projectId={project.id}
                                            />
                                        ) : (
                                            <PayInstallmentForm
                                                action={payInstallmentAction.bind(
                                                    null,
                                                    installment.id,
                                                    project.id,
                                                )}
                                                defaultDate={defaultDate}
                                            />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </DataTable>

                        <p className={styles.totals}>
                            Total {formatCents(purchase.totalCents)} · Pago{" "}
                            {formatCents(purchase.paidCents)} · Falta{" "}
                            {formatCents(purchase.unpaidCents)}
                        </p>
                    </section>
                ))
            )}
        </>
    );
}
