import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/Button/Button";
import { phaseLabel } from "../../rules/construction.rules";
import styles from "./PhaseNavigator.module.scss";

type PhaseNavigatorProps = {
    projectId: string;
    /** Número da fase atual. */
    number: number;
    /** Todas as fases da obra (números), para saber se há anterior/próxima. */
    numbers: number[];
};

/** Navegação entre fases por LINKS (?phase implícito na rota), como o MonthNavigator. */
export function PhaseNavigator({ projectId, number, numbers }: PhaseNavigatorProps) {
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = sorted.indexOf(number);
    const previous = index > 0 ? sorted[index - 1] : null;
    const next = index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : null;
    const base = `/finance/construction/${projectId}/phases`;

    return (
        <nav aria-label="Navegar entre fases" className={styles.navigator}>
            {previous !== null ? (
                <Link href={`${base}/${previous}`} className={buttonClassName("secondary")}>
                    <ChevronLeft size={16} aria-hidden="true" />
                    {phaseLabel(previous)}
                </Link>
            ) : (
                <span />
            )}
            <h2 className={styles.label}>{phaseLabel(number)}</h2>
            {next !== null ? (
                <Link href={`${base}/${next}`} className={buttonClassName("secondary")}>
                    {phaseLabel(next)}
                    <ChevronRight size={16} aria-hidden="true" />
                </Link>
            ) : (
                <span />
            )}
        </nav>
    );
}
