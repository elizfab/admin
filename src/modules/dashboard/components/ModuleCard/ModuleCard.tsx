import Link from "next/link";

import { cn } from "@/lib/utils/cn";

import type { DashboardModule, ModuleStatus } from "../../types/dashboard.types";
import styles from "./ModuleCard.module.scss";

const statusLabel: Record<ModuleStatus, string> = {
    available: "Disponível",
    external: "Aplicação externa",
    soon: "Em breve",
};

type ModuleCardProps = {
    module: DashboardModule;
};

export function ModuleCard({ module }: ModuleCardProps) {
    const { title, description, href, icon: Icon, status } = module;

    return (
        <Link href={href} className={styles.card}>
            <span className={styles.icon} aria-hidden="true">
                <Icon size={22} strokeWidth={1.75} />
            </span>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.description}>{description}</p>
            <span className={cn(styles.status, styles[`status_${status}`])}>
                {statusLabel[status]}
            </span>
        </Link>
    );
}
