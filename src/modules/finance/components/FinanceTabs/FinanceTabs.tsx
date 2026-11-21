import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

import styles from "./FinanceTabs.module.scss";

export type FinanceSection = "dashboard" | "transactions" | "construction";

const tabs: { id: FinanceSection; label: string; href: string }[] = [
    { id: "dashboard", label: "Dashboard", href: "/finance" },
    { id: "transactions", label: "Transações", href: "/finance/transactions" },
    { id: "construction", label: "Construção", href: "/finance/construction" },
];

type FinanceTabsProps = {
    current: FinanceSection;
    /** Conteúdo da aba atual, mostrado dentro do container. */
    children?: ReactNode;
};

/**
 * Abas do Financeiro (FIN-R11). Como navegam entre ROTAS, usam links com
 * role="tab" + aria-selected (ETAPA 04: abas não usam aria-current).
 */
export function FinanceTabs({ current, children }: FinanceTabsProps) {
    return (
        <div className={styles.container}>
            <nav aria-label="Seções do Financeiro">
                <div role="tablist" className={styles.tabs}>
                    {tabs.map((tab) => (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            role="tab"
                            aria-selected={tab.id === current}
                            className={cn(styles.tab, tab.id === current && styles.active)}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>
            </nav>
            <div className={styles.panel}>{children}</div>
        </div>
    );
}
