import type { ReactNode } from "react";

import styles from "./EmptyState.module.scss";

type EmptyStateProps = {
    title: string;
    description: string;
    icon?: ReactNode;
    action?: ReactNode;
    /** Use "h1" quando o EmptyState for o conteúdo principal da página. */
    headingLevel?: "h1" | "h2";
};

export function EmptyState({
    title,
    description,
    icon,
    action,
    headingLevel: Heading = "h2",
}: EmptyStateProps) {
    return (
        <section className={styles.emptyState}>
            {icon && <div className={styles.icon}>{icon}</div>}
            <Heading className={styles.title}>{title}</Heading>
            <p className={styles.description}>{description}</p>
            {action}
        </section>
    );
}
