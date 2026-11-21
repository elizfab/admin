import { formatCents } from "@/lib/money/money";
import { cn } from "@/lib/utils/cn";

import {
    transactionCategoryLabel,
    type MonthlySummary as Summary,
} from "../../types/transaction.types";
import styles from "./MonthlySummary.module.scss";

type MonthlySummaryProps = {
    summary: Summary;
};

export function MonthlySummary({ summary }: MonthlySummaryProps) {
    const { incomeCents, expenseCents, balanceCents, expensesByCategory } = summary;
    const cards = [
        { label: "Receitas", value: incomeCents, tone: styles.income },
        { label: "Despesas", value: expenseCents, tone: styles.expense },
        {
            label: "Saldo",
            value: balanceCents,
            tone: balanceCents < 0 ? styles.expense : undefined,
        },
    ];

    return (
        <section aria-label="Resumo do mês" className={styles.summary}>
            {/* <dl>: pares "nome → valor", o leitor de tela lê "Receitas, R$ 5.000,00". */}
            <dl className={styles.cards}>
                {cards.map((card) => (
                    <div key={card.label} className={styles.card}>
                        <dt>{card.label}</dt>
                        <dd className={cn(styles.value, card.tone)}>{formatCents(card.value)}</dd>
                    </div>
                ))}
            </dl>

            {expensesByCategory.length > 0 && (
                <div className={styles.categories}>
                    <h3>Despesas por categoria</h3>
                    <ul>
                        {expensesByCategory.map(({ category, totalCents }) => {
                            const percent = Math.round((totalCents / expenseCents) * 100);

                            return (
                                <li key={category}>
                                    <span className={styles.categoryName}>
                                        {transactionCategoryLabel[category]}
                                    </span>
                                    <span className={styles.categoryValue}>
                                        {formatCents(totalCents)} ({percent}%)
                                    </span>
                                    {/* Barra só decorativa: o número acima já diz tudo. */}
                                    <span className={styles.bar} aria-hidden="true">
                                        <span style={{ width: `${percent}%` }} />
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </section>
    );
}
