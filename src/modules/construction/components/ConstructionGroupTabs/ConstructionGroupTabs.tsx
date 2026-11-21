import Link from "next/link";

import { cn } from "@/lib/utils/cn";
import { OBRA_GRUPOS, type ObraGrupoId } from "../../constants/categories";

import styles from "./ConstructionGroupTabs.module.scss";

type ConstructionGroupTabsProps = {
    /** Grupo ativo; "sem-categoria" acende a sub-aba de obras sem categoria. */
    grupo: ObraGrupoId | "sem-categoria";
    /** Mostra a sub-aba "Sem categoria" só quando existe obra sem categoria. */
    showUncategorized?: boolean;
};

/**
 * Sub-abas da área Construção (grupos de obras). Como as abas do Financeiro,
 * são links de rota: role="tab" + aria-selected (ETAPA 04 — sem aria-current).
 */
export function ConstructionGroupTabs({
    grupo,
    showUncategorized = false,
}: ConstructionGroupTabsProps) {
    const abas: { id: string; label: string; href: string }[] = [
        ...OBRA_GRUPOS.map((g) => ({
            id: g.id,
            label: g.label,
            href: `/finance/construction?grupo=${g.id}`,
        })),
        ...(showUncategorized
            ? [
                  {
                      id: "sem-categoria",
                      label: "Sem categoria",
                      href: "/finance/construction?grupo=sem-categoria",
                  },
              ]
            : []),
    ];

    return (
        <nav aria-label="Grupos de obras">
            <div role="tablist" className={styles.tabs}>
                {abas.map((aba) => (
                    <Link
                        key={aba.id}
                        href={aba.href}
                        role="tab"
                        aria-selected={aba.id === grupo}
                        className={cn(styles.tab, aba.id === grupo && styles.active)}
                    >
                        {aba.label}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
