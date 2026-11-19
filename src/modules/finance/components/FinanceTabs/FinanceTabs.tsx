import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

import styles from "./FinanceTabs.module.scss";

export type FinanceSection = "transactions" | "construction";

const tabs: { id: FinanceSection; label: string; href: string }[] = [
    { id: "transactions", label: "Transações", href: "/finance" },
    { id: "construction", label: "Obra", href: "/finance/construction" },
];

type FinanceTabsProps = {
    current: FinanceSection;
    /** Conteúdo da aba atual, mostrado dentro do container. */
    children?: ReactNode;
};

/**
 * Abas do Financeiro (FIN-R11). Cada aba é uma ROTA, então são links de navegação
 * com aria-current (e não role="tablist", que é para painéis na mesma página).
 */
export function FinanceTabs({ current, children }: FinanceTabsProps) {
    return (
        <div className={styles.container}>
            <nav aria-label="Seções do Financeiro" className={styles.tabs}>
                {tabs.map((tab) => (
                    <Link
                        key={tab.id}
                        href={tab.href}
                        className={cn(styles.tab, tab.id === current && styles.active)}
                        aria-current={tab.id === current ? "page" : undefined}
                    >
                        {tab.label}
                    </Link>
                ))}
            </nav>
            <div className={styles.panel}>{children}</div>
        </div>
    );
}
