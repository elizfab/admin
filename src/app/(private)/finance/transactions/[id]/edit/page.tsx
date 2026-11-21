import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { requireSession } from "@/lib/auth/session";
import { today } from "@/lib/dates/month";
import { NotFoundError } from "@/lib/errors/app-error";
import { idSchema } from "@/lib/validations/common.schema";
import { updateTransactionAction } from "@/modules/finance/actions/transaction.actions";
import { TransactionForm } from "@/modules/finance/components/TransactionForm/TransactionForm";
import { getTransaction } from "@/modules/finance/server";

export const metadata: Metadata = {
    title: "Editar transação",
};

export default async function EditTransactionPage({
    params,
}: PageProps<"/finance/transactions/[id]/edit">) {
    const session = await requireSession();
    const parsedId = idSchema.safeParse((await params).id);

    if (!parsedId.success) notFound();

    const transaction = await getTransaction(session.user.id, parsedId.data).catch((error) => {
        if (error instanceof NotFoundError) notFound();
        throw error;
    });

    // bind fixa o id como 1º argumento da action, no servidor.
    const action = updateTransactionAction.bind(null, transaction.id);
    const month = transaction.occurredOn.toISOString().slice(0, 7);

    return (
        <>
            <PageHeader title="Editar transação" />
            <TransactionForm
                action={action}
                transaction={transaction}
                defaultDate={today()}
                cancelHref={`/finance?month=${month}`}
                submitLabel="Salvar alterações"
            />
        </>
    );
}
