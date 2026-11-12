import { Wallet } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/EmptyState/EmptyState";

export const metadata: Metadata = {
    title: "Estudos",
};

export default function StudiesPage() {
    return (
        <EmptyState
            icon={<Wallet size={32} aria-hidden="true" />}
            headingLevel="h1"
            title="Estudos"
            description="Em breve: guias de uso."
        />
    );
}
