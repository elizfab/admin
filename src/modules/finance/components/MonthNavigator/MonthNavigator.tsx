import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/Button/Button";
import { formatMonth, shiftMonth } from "@/lib/dates/month";

import styles from "./MonthNavigator.module.scss";

type MonthNavigatorProps = {
    month: string;
    /** Caminho base dos links (?month=…): "/finance" no Dashboard, "/finance/transactions" nas Transações. */
    basePath?: string;
};

/**
 * Troca de mês por LINKS (?month=AAAA-MM), e não por estado no navegador:
 * a página continua Server Component, o mês fica na URL (dá para favoritar
 * ou compartilhar) e o botão "voltar" do navegador funciona.
 */
export function MonthNavigator({ month, basePath = "/finance" }: MonthNavigatorProps) {
    const previous = shiftMonth(month, -1);
    const next = shiftMonth(month, 1);

    return (
        <nav aria-label="Navegar entre meses" className={styles.navigator}>
            <Link
                href={`${basePath}?month=${previous}`}
                className={buttonClassName("secondary")}
                aria-label={`Mês anterior: ${formatMonth(previous)}`}
            >
                <ChevronLeft size={16} aria-hidden="true" />
            </Link>
            <h2 className={styles.label}>{formatMonth(month)}</h2>
            <Link
                href={`${basePath}?month=${next}`}
                className={buttonClassName("secondary")}
                aria-label={`Próximo mês: ${formatMonth(next)}`}
            >
                <ChevronRight size={16} aria-hidden="true" />
            </Link>
        </nav>
    );
}
