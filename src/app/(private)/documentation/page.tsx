import { Wallet } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/EmptyState/EmptyState";

export const metadata: Metadata = {
    title: "Documentação",
};

export default function DocumentationPage() {
    return (
        <EmptyState
            icon={<Wallet size={32} aria-hidden="true" />}
            headingLevel="h1"
            title="Documentação"
            description="Em breve: documentação e guias de uso."
        />
    );
}
