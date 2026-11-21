import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/Button/Button";
import { requireSession } from "@/lib/auth/session";
import { currentMonth } from "@/lib/dates/month";
import { monthSchema } from "@/modules/finance";
import { FinanceLayout } from "@/modules/finance/components/FinanceLayout/FinanceLayout";
import { MonthNavigator } from "@/modules/finance/components/MonthNavigator/MonthNavigator";
import { TransactionList } from "@/modules/finance/components/TransactionList/TransactionList";
import { listTransactions } from "@/modules/finance/server";

import styles from "../page.module.scss";

export const metadata: Metadata = {
    title: "Transações",
};

export default async function FinanceTransactionsPage({
    searchParams,
}: PageProps<"/finance/transactions">) {
    const session = await requireSession();

    const parsedMonth = monthSchema.safeParse((await searchParams).month);
    const month = parsedMonth.success ? parsedMonth.data : currentMonth();

    const transactions = await listTransactions(session.user.id, month);

    return (
        <FinanceLayout current="transactions">
            <section aria-label="Transações" className={styles.tabContent}>
                <div className={styles.toolbar}>
                    <Link href="/finance/transactions/new" className={buttonClassName("primary")}>
                        <Plus size={16} aria-hidden="true" />
                        Nova transação
                    </Link>
                </div>

                <MonthNavigator month={month} basePath="/finance/transactions" />

                <section aria-labelledby="transactions-title" className={styles.transactions}>
                    <h3 id="transactions-title">Lançamentos</h3>
                    {transactions.length > 0 ? (
                        <TransactionList transactions={transactions} />
                    ) : (
                        <p className={styles.empty}>Nenhuma transação neste mês.</p>
                    )}
                </section>
            </section>
        </FinanceLayout>
    );
}
