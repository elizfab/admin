import type { FinanceSection } from "../FinanceTabs/FinanceTabs";

export const FINANCE_TITLE = "Painel Financeiro";
export const FINANCE_DESCRIPTION = "Receitas, despesas, saldo e construção.";

/** Voltar sobe um nível (PLAT-R16): abas voltam ao início ou ao Financeiro. */
export const FINANCE_BACK_LINK: Record<FinanceSection, { href: string; label: string }> = {
    dashboard: { href: "/dashboard", label: "Voltar ao início" },
    transactions: { href: "/finance", label: "Voltar ao Financeiro" },
    construction: { href: "/finance", label: "Voltar ao Financeiro" },
};
