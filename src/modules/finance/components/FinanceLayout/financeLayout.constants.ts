import type { FinanceSection } from "../FinanceTabs/FinanceTabs";

export const FINANCE_TITLE = "Painel Financeiro";
export const FINANCE_DESCRIPTION = "Receitas, despesas, saldo e construção.";

/** Voltar sobe um nível (PLAT-R16): Transações → início; Construção → Financeiro. */
export const FINANCE_BACK_LINK: Record<FinanceSection, { href: string; label: string }> = {
    transactions: { href: "/dashboard", label: "Voltar ao início" },
    construction: { href: "/finance", label: "Voltar ao Financeiro" },
};
