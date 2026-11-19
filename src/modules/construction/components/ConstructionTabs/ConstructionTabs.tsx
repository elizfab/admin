import Link from "next/link";

import { cn } from "@/lib/utils/cn";

import styles from "./ConstructionTabs.module.scss";

export type ConstructionSection =
    "dashboard" | "phases" | "services" | "payments" | "purchases" | "goals" | "settings";

type ConstructionTabsProps = {
    projectId: string;
    /** Número da fase para o link "Fases" (a menor fase da obra). */
    firstPhaseNumber: number;
    active: ConstructionSection;
};

const sections: {
    key: ConstructionSection;
    label: string;
    href: (p: ConstructionTabsProps) => string;
}[] = [
    { key: "dashboard", label: "Dashboard", href: (p) => `/finance/construction/${p.projectId}` },
    {
        key: "phases",
        label: "Fases",
        href: (p) => `/finance/construction/${p.projectId}/phases/${p.firstPhaseNumber}`,
    },
    {
        key: "services",
        label: "Serviços",
        href: (p) => `/finance/construction/${p.projectId}/services`,
    },
    {
        key: "payments",
        label: "Pagamentos",
        href: (p) => `/finance/construction/${p.projectId}/payments`,
    },
    {
        key: "purchases",
        label: "Compras",
        href: (p) => `/finance/construction/${p.projectId}/purchases`,
    },
    { key: "goals", label: "Metas", href: (p) => `/finance/construction/${p.projectId}/goals` },
    {
        key: "settings",
        label: "Configuração",
        href: (p) => `/finance/construction/${p.projectId}/settings`,
    },
];

/** Abas internas da obra (Server Component): links com aria-current="page". */
export function ConstructionTabs({ projectId, firstPhaseNumber, active }: ConstructionTabsProps) {
    const props = { projectId, firstPhaseNumber, active };

    return (
        <nav aria-label="Seções da obra" className={styles.tabs}>
            {sections.map((section) => (
                <Link
                    key={section.key}
                    href={section.href(props)}
                    className={cn(styles.tab, active === section.key && styles.active)}
                    aria-current={active === section.key ? "page" : undefined}
                >
                    {section.label}
                </Link>
            ))}
        </nav>
    );
}
