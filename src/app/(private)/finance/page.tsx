import type { Metadata } from "next";

import { requireSession } from "@/lib/auth/session";
import { currentMonth } from "@/lib/dates/month";
import { monthSchema } from "@/modules/finance";
import { categoriasDoGrupo, OBRA_GRUPOS } from "@/modules/construction/constants/categories";
import { FinanceLayout } from "@/modules/finance/components/FinanceLayout/FinanceLayout";
import { MonthlySummary } from "@/modules/finance/components/MonthlySummary/MonthlySummary";
import { MonthNavigator } from "@/modules/finance/components/MonthNavigator/MonthNavigator";
import { getMonthlySummary } from "@/modules/finance/server";

import styles from "./page.module.scss";

export const metadata: Metadata = {
    title: "Financeiro",
};

export default async function FinancePage({ searchParams }: PageProps<"/finance">) {
    const session = await requireSession();

    // ?month=2026-11 — mês ausente ou inválido cai no mês atual (sem erro na tela).
    const parsedMonth = monthSchema.safeParse((await searchParams).month);
    const month = parsedMonth.success ? parsedMonth.data : currentMonth();

    const summary = await getMonthlySummary(session.user.id, month);

    return (
        <FinanceLayout current="dashboard">
            <section aria-label="Dashboard" className={styles.tabContent}>
                <MonthNavigator month={month} />
                <MonthlySummary summary={summary} />
            </section>

            {/* Dashboard de Construção: seção com divisor e as categorias
                (somente textos, sem métricas — Especificação §2). */}
            <section aria-labelledby="construction-overview" className={styles.construction}>
                <h2 id="construction-overview" className={styles.constructionTitle}>
                    Construção
                </h2>
                <div className={styles.constructionDivider} aria-hidden="true" />
                {OBRA_GRUPOS.map((grupo) => {
                    const categorias = categoriasDoGrupo(grupo.id);
                    if (categorias.length === 0) return null;
                    return (
                        <div key={grupo.id} className={styles.constructionGroup}>
                            <h3 className={styles.constructionGroupTitle}>{grupo.label}</h3>
                            <ul className={styles.constructionCards}>
                                {categorias.map((categoria) => (
                                    <li key={categoria.id} className={styles.constructionCard}>
                                        {categoria.shortLabel}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </section>
        </FinanceLayout>
    );
}
