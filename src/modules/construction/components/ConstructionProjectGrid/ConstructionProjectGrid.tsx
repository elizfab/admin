import Link from "next/link";

import { buttonClassName } from "@/components/ui/Button/Button";
import { formatDay } from "@/lib/dates/month";
import { categoriaLabel } from "../../constants/categories";

import styles from "./ConstructionProjectGrid.module.scss";
import type { ConstructionProjectGridProps } from "./ConstructionProjectGrid.types";

/**
 * Grade de obras: painel de altura fixa, até 12 cards por página
 * (OBRA-R18). O 12º card mostra "Ver mais" no canto inferior direito
 * quando hasMore — sem rolagem interna e sem botão quando não há mais.
 */
export function ConstructionProjectGrid({
    projects,
    hasMore = false,
    moreHref,
}: ConstructionProjectGridProps) {
    if (projects.length === 0) {
        return (
            <p className={styles.empty}>
                Nenhuma obra nesta categoria ainda. Use “Nova obra” para criar a primeira — ela já
                nasce com o ambiente &quot;Geral&quot; e a &quot;Fase 01&quot;.
            </p>
        );
    }

    return (
        <ul className={styles.grid} aria-label="Obras">
            {projects.map((project, index) => {
                const isLast = index === projects.length - 1;
                const showMore = hasMore && isLast && moreHref;

                return (
                    <li key={project.id} className={styles.card}>
                        <Link href={`/finance/construction/${project.id}`} className={styles.name}>
                            {project.name}
                        </Link>
                        <span className={styles.dates}>
                            {project.startDate
                                ? `Início ${formatDay(project.startDate)}`
                                : "Sem data de início"}
                            {project.plannedEndDate &&
                                ` · Fim previsto ${formatDay(project.plannedEndDate)}`}
                        </span>
                        {project.categoryIds && project.categoryIds.length > 0 && (
                            <span className={styles.categories}>
                                {project.categoryIds.map(categoriaLabel).join(" · ")}
                            </span>
                        )}
                        <Link
                            href={`/finance/construction/${project.id}`}
                            className={buttonClassName("secondary", styles.open)}
                            aria-label={`Abrir a obra ${project.name}`}
                        >
                            Abrir obra
                        </Link>
                        {showMore && (
                            <Link href={moreHref} className={styles.more}>
                                Ver mais
                            </Link>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
