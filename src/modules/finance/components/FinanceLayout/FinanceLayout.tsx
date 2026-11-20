import { BackLink } from "@/components/shared/BackLink/BackLink";
import { PageHeader } from "@/components/shared/PageHeader/PageHeader";

import { FinanceTabs } from "../FinanceTabs/FinanceTabs";
import styles from "./FinanceLayout.module.scss";
import type { FinanceLayoutProps } from "./FinanceLayout.types";
import { FINANCE_BACK_LINK, FINANCE_DESCRIPTION, FINANCE_TITLE } from "./financeLayout.constants";

/**
 * Topo comum das abas do Financeiro (FIN-R12): título, barra com Voltar + ações e abas.
 * As duas abas usam ESTE componente, então o topo tem a mesma estrutura e a mesma altura
 * — trocar de aba não desloca nada.
 */
export function FinanceLayout({ current, actions, children }: FinanceLayoutProps) {
    const back = FINANCE_BACK_LINK[current];

    return (
        <div className={styles.layout}>
            <PageHeader title={FINANCE_TITLE} description={FINANCE_DESCRIPTION} />

            <div className={styles.toolbar}>
                <BackLink href={back.href} label={back.label} className={styles.back} />
                {actions}
            </div>

            <FinanceTabs current={current}>{children}</FinanceTabs>
        </div>
    );
}
