import type { ReactNode } from "react";

import type { FinanceSection } from "../FinanceTabs/FinanceTabs";

export type FinanceLayoutProps = {
    /** Aba atual (marca a aba e define para onde o Voltar leva). */
    current: FinanceSection;
    /** Ações da aba, ao lado do Voltar (ex.: "Nova obra"). */
    actions?: ReactNode;
    /** Conteúdo da aba, dentro do container das abas. */
    children: ReactNode;
};
