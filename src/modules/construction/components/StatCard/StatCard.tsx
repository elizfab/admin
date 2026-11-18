import type { ReactNode } from "react";

import styles from "./StatCard.module.scss";

type StatCardProps = {
    label: string;
    value: ReactNode;
    footer?: ReactNode;
    /** "alert" destaca valores a pagar (var(--yellow)); "ok" para quitado. */
    tone?: "default" | "alert" | "ok";
};

/** Card de número do dashboard (<dl>-like): rótulo pequeno, valor grande. */
export function StatCard({ label, value, footer, tone = "default" }: StatCardProps) {
    return (
        <div className={`${styles.card} ${styles[tone]}`}>
            <span className={styles.label}>{label}</span>
            <span className={styles.value}>{value}</span>
            {footer && <span className={styles.footer}>{footer}</span>}
        </div>
    );
}
