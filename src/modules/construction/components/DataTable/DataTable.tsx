import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

import styles from "./DataTable.module.scss";

type DataTableProps = {
    /** Descreve a tabela para leitores de tela (pode ser visualmente oculta). */
    caption: string;
    hideCaption?: boolean;
    /** rótulo da região rolável no celular (leitor de tela). */
    regionLabel?: string;
    headers: ReactNode[];
    children: ReactNode;
    className?: string;
};

/**
 * Tabela de dados de verdade (<table> com <caption> e <th scope="col">):
 * o leitor de tela anuncia "linha 3, coluna Valor contratado".
 * No celular, rola na horizontal dentro de uma região focável.
 */
export function DataTable({
    caption,
    hideCaption = false,
    regionLabel,
    headers,
    children,
    className,
}: DataTableProps) {
    return (
        <div className={styles.scroll} role="region" tabIndex={0} aria-label={regionLabel ?? caption}>
            <table className={cn(styles.table, className)}>
                <caption className={hideCaption ? "visually-hidden" : undefined}>{caption}</caption>
                <thead>
                    <tr>
                        {headers.map((header, index) => (
                            <th key={index} scope="col">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>{children}</tbody>
            </table>
        </div>
    );
}
