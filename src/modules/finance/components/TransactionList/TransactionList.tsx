import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/Button/Button";
import { formatDay } from "@/lib/dates/month";
import { formatCents } from "@/lib/money/money";
import { cn } from "@/lib/utils/cn";

import {
    transactionCategoryLabel,
    transactionTypeLabel,
    type TransactionWithOrigin,
} from "../../types/transaction.types";
import { DeleteTransactionButton } from "../DeleteTransactionButton/DeleteTransactionButton";
import styles from "./TransactionList.module.scss";

type TransactionListProps = {
    transactions: TransactionWithOrigin[];
};

export function TransactionList({ transactions }: TransactionListProps) {
    return (
        <ul className={styles.list}>
            {transactions.map((transaction) => {
                const isIncome = transaction.type === "INCOME";
                // Origem na Construção (Fase 09): o lançamento só muda pela tela da obra.
                const obraHref = transaction.servicePayment
                    ? `/finance/construction/${transaction.servicePayment.service.projectId}/phases/${transaction.servicePayment.service.phase.number}`
                    : transaction.materialInstallment
                      ? `/finance/construction/${transaction.materialInstallment.purchase.projectId}/purchases`
                      : null;

                return (
                    <li key={transaction.id} className={styles.item}>
                        <div className={styles.info}>
                            <p className={styles.description}>
                                {transaction.description}
                                {obraHref && (
                                    <span className={styles.obraBadge}>
                                        {transactionCategoryLabel.CONSTRUCTION}
                                    </span>
                                )}
                            </p>
                            <p className={styles.meta}>
                                {formatDay(transaction.occurredOn)} ·{" "}
                                {transactionCategoryLabel[transaction.category]}
                            </p>
                        </div>

                        {/* A cor não é a única pista: há sinal (+/−) e o tipo para leitores de tela. */}
                        <p className={cn(styles.amount, isIncome ? styles.income : styles.expense)}>
                            <span className="visually-hidden">
                                {transactionTypeLabel[transaction.type]}:{" "}
                            </span>
                            <span aria-hidden="true">{isIncome ? "+ " : "− "}</span>
                            {formatCents(transaction.amountCents)}
                        </p>

                        {obraHref ? (
                            <div className={styles.actions}>
                                <Link href={obraHref} className={buttonClassName("secondary")}>
                                    Ver na obra
                                </Link>
                            </div>
                        ) : (
                            <div className={styles.actions}>
                                <Link
                                    href={`/finance/transactions/${transaction.id}/edit`}
                                    className={buttonClassName("secondary")}
                                    aria-label={`Editar a transação ${transaction.description}`}
                                >
                                    <Pencil size={16} aria-hidden="true" />
                                </Link>
                                <DeleteTransactionButton
                                    transactionId={transaction.id}
                                    description={transaction.description}
                                />
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
