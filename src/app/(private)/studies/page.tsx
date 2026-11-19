import { Wallet } from "lucide-react";
import type { Metadata } from "next";

import { BackLink } from "@/components/shared/BackLink/BackLink";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";

export const metadata: Metadata = {
    title: "Estudos",
};

export default function StudiesPage() {
    return (
        <>
            <BackLink />
            <EmptyState
                icon={<Wallet size={32} aria-hidden="true" />}
                headingLevel="h1"
                title="Estudos"
                description="Em breve: guias de uso."
            />
        </>
    );
}
