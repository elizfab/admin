import type { Metadata } from "next";

import { ModuleCard } from "@/modules/dashboard/components/ModuleCard/ModuleCard";
import { dashboardModulesMock } from "@/modules/dashboard/data/modules.mock";

import styles from "./page.module.scss";

export const metadata: Metadata = {
    title: "Dashboard",
};

export default function DashboardPage() {
    return (
        <>
            <div className={styles.heading}>
                <h1>Dashboard</h1>
                <p>Visão geral e atalhos para os módulos.</p>
            </div>

            <div className={styles.grid}>
                {dashboardModulesMock.map((module) => (
                    <ModuleCard key={module.id} module={module} />
                ))}
            </div>
        </>
    );
}
