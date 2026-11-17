import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { today } from "@/lib/dates/month";
import { createTransactionAction } from "@/modules/finance/actions/transaction.actions";
import { TransactionForm } from "@/modules/finance/components/TransactionForm/TransactionForm";

export const metadata: Metadata = {
    title: "Nova transação",
};

export default function NewTransactionPage() {
    return (
        <>
            <PageHeader title="Nova transação" />
            <TransactionForm
                action={createTransactionAction}
                defaultDate={today()}
                cancelHref="/finance"
                submitLabel="Salvar transação"
            />
        </>
    );
}
