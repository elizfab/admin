import { Wallet } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/EmptyState/EmptyState";

export const metadata: Metadata = {
    title: "Financeiro",
};

export default function FinancePage() {
    return (
        <EmptyState
            icon={<Wallet size={32} aria-hidden="true" />}
            headingLevel="h1"
            title="Financeiro"
            description="Em breve: receitas, despesas e indicadores."
        />
    );
}
