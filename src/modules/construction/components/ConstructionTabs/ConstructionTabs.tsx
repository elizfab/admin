import Link from "next/link";

import { cn } from "@/lib/utils/cn";

import styles from "./ConstructionTabs.module.scss";

export type ConstructionSection =
    "dashboard" | "phases" | "services" | "payments" | "purchases" | "goals" | "settings";

type ConstructionTabsProps = {
    projectId: string;
    active: ConstructionSection;
};

const sections: { key: ConstructionSection; label: string; href: (p: string) => string }[] = [
    { key: "dashboard", label: "Dashboard", href: (p) => `/finance/construction/${p}` },
    { key: "phases", label: "Fases", href: (p) => `/finance/construction/${p}/phases` },
    {
        key: "services",
        label: "Serviços",
        href: (p) => `/finance/construction/${p}/services`,
    },
    {
        key: "payments",
        label: "Pagamentos",
        href: (p) => `/finance/construction/${p}/payments`,
    },
    {
        key: "purchases",
        label: "Compras",
        href: (p) => `/finance/construction/${p}/purchases`,
    },
    { key: "goals", label: "Metas", href: (p) => `/finance/construction/${p}/goals` },
    {
        key: "settings",
        label: "Dados da obra",
        href: (p) => `/finance/construction/${p}/settings`,
    },
];

/**
 * Abas internas da obra (Server Component): links de rota com
 * role="tab" + aria-selected (ETAPA 04: abas não usam aria-current).
 */
export function ConstructionTabs({ projectId, active }: ConstructionTabsProps) {
    return (
        <nav aria-label="Seções da obra">
            <div role="tablist" className={styles.tabs}>
                {sections.map((section) => (
                    <Link
                        key={section.key}
                        href={section.href(projectId)}
                        role="tab"
                        aria-selected={active === section.key}
                        className={cn(styles.tab, active === section.key && styles.active)}
                    >
                        {section.label}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
