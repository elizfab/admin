import Link from "next/link";

import { buttonClassName } from "@/components/ui/Button/Button";
import { formatDay } from "@/lib/dates/month";

import styles from "./ConstructionProjectGrid.module.scss";
import type { ConstructionProjectGridProps } from "./ConstructionProjectGrid.types";

/** Obras da área Construção em cards (até 6 por linha no desktop; 1 no celular). */
export function ConstructionProjectGrid({ projects }: ConstructionProjectGridProps) {
    if (projects.length === 0) {
        return (
            <p className={styles.empty}>
                Nenhuma obra ainda. Use “Nova obra” para criar a primeira — ela já nasce com o
                ambiente &quot;Geral&quot; e a &quot;Fase 01&quot;.
            </p>
        );
    }

    return (
        <ul className={styles.grid} aria-label="Obras">
            {projects.map((project) => (
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
                    <Link
                        href={`/finance/construction/${project.id}/settings`}
                        className={buttonClassName("secondary", styles.settings)}
                        aria-label={`Configurar a obra ${project.name}`}
                    >
                        Configurar
                    </Link>
                </li>
            ))}
        </ul>
    );
}
