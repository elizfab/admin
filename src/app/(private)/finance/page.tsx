import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BackLink } from "@/components/shared/BackLink/BackLink";
import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { buttonClassName } from "@/components/ui/Button/Button";
import { requireSession } from "@/lib/auth/session";
import { currentMonth } from "@/lib/dates/month";
import { monthSchema } from "@/modules/finance";
import { FinanceTabs } from "@/modules/finance/components/FinanceTabs/FinanceTabs";
import { MonthlySummary } from "@/modules/finance/components/MonthlySummary/MonthlySummary";
import { MonthNavigator } from "@/modules/finance/components/MonthNavigator/MonthNavigator";
import { TransactionList } from "@/modules/finance/components/TransactionList/TransactionList";
import { getMonthlySummary, listTransactions } from "@/modules/finance/server";

import styles from "./page.module.scss";

export const metadata: Metadata = {
    title: "Financeiro",
};

export default async function FinancePage({ searchParams }: PageProps<"/finance">) {
    const session = await requireSession();

    // ?month=2026-11 — mês ausente ou inválido cai no mês atual (sem erro na tela).
    const parsedMonth = monthSchema.safeParse((await searchParams).month);
    const month = parsedMonth.success ? parsedMonth.data : currentMonth();

    // As duas consultas não dependem uma da outra: rodam em paralelo.
    const [summary, transactions] = await Promise.all([
        getMonthlySummary(session.user.id, month),
        listTransactions(session.user.id, month),
    ]);

    return (
        <div className={styles.page}>
            <PageHeader title="Financeiro" description="Receitas, despesas, saldo e obra." />

            <BackLink />

            <FinanceTabs current="transactions">
                <section aria-label="Transações" className={styles.tabContent}>
                    {/* "Nova transação" dentro da aba, à esquerda (FIN-R11). */}
                    <div className={styles.toolbar}>
                        <Link
                            href="/finance/transactions/new"
                            className={buttonClassName("primary")}
                        >
                            <Plus size={16} aria-hidden="true" />
                            Nova transação
                        </Link>
                    </div>

                    <MonthNavigator month={month} />
                    <MonthlySummary summary={summary} />

                    <section aria-labelledby="transactions-title" className={styles.transactions}>
                        <h3 id="transactions-title">Lançamentos</h3>
                        {transactions.length > 0 ? (
                            <TransactionList transactions={transactions} />
                        ) : (
                            <p className={styles.empty}>Nenhuma transação neste mês.</p>
                        )}
                    </section>
                </section>
            </FinanceTabs>
        </div>
    );
}
