import type { ReactNode } from "react";

import styles from "./PageHeader.module.scss";

type PageHeaderProps = {
    title: string;
    description?: string;
    /** Ação principal da página (ex.: botão "Novo projeto"). */
    action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
    return (
        <div className={styles.header}>
            <div className={styles.text}>
                <h1>{title}</h1>
                {description && <p>{description}</p>}
            </div>
            {action}
        </div>
    );
}
