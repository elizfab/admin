import Link from "next/link";
import { createElement, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

import { getDashboardIcon } from "../../icons";
import { isExternalHref } from "../../schemas/dashboard-module.schema";
import { dashboardModuleStatusLabel, type DashboardModule } from "../../types/dashboard.types";
import styles from "./ModuleCard.module.scss";

type ModuleCardProps = {
    module: Pick<DashboardModule, "title" | "description" | "href" | "icon" | "status">;
    /** Botões de editar/excluir: ficam FORA do link (botão dentro de link é HTML inválido). */
    actions?: ReactNode;
};

export function ModuleCard({ module, actions }: ModuleCardProps) {
    const { title, description, href, icon, status } = module;
    const external = isExternalHref(href);

    const content = (
        <>
            <span className={styles.icon} aria-hidden="true">
                <DashboardIcon name={icon} />
            </span>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.description}>{description}</p>
            <span className={cn(styles.status, styles[`status_${status}`])}>
                {dashboardModuleStatusLabel[status]}
            </span>
            {external && <span className={styles.srOnly}> (abre em nova aba)</span>}
        </>
    );

    return (
        <article className={styles.card}>
            {external ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className={styles.link}>
                    {content}
                </a>
            ) : (
                <Link href={href} className={styles.link}>
                    {content}
                </Link>
            )}
            {actions && <div className={styles.actions}>{actions}</div>}
        </article>
    );
}

/** Ícone pelo nome guardado no banco (o componente vem do mapa de ícones permitidos). */
function DashboardIcon({ name }: { name: string }) {
    return createElement(getDashboardIcon(name), { size: 22, strokeWidth: 1.75 });
}
