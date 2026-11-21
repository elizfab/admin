import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { requireSession } from "@/lib/auth/session";
import {
    createDashboardModuleAction,
    updateDashboardModuleAction,
} from "@/modules/dashboard/actions/dashboard-module.actions";
import { DeleteModuleButton } from "@/modules/dashboard/components/DeleteModuleButton/DeleteModuleButton";
import { ModuleCard } from "@/modules/dashboard/components/ModuleCard/ModuleCard";
import { ModuleFormDialog } from "@/modules/dashboard/components/ModuleFormDialog/ModuleFormDialog";
import { listDashboardModules } from "@/modules/dashboard/server";

import styles from "./page.module.scss";

export const metadata: Metadata = {
    title: "Dashboard",
};

export default async function DashboardPage() {
    const session = await requireSession();
    const modules = await listDashboardModules(session.user.id);

    return (
        <>
            <PageHeader
                title="Dashboard"
                description="Visão geral e atalhos para os módulos."
                action={<ModuleFormDialog action={createDashboardModuleAction} />}
            />

            {modules.length === 0 ? (
                <p className={styles.empty}>
                    Nenhum card ainda. Use “Novo card” para criar o primeiro.
                </p>
            ) : (
                <div className={styles.grid}>
                    {modules.map((module) => (
                        <ModuleCard
                            key={module.id}
                            module={module}
                            actions={
                                <>
                                    <ModuleFormDialog
                                        action={updateDashboardModuleAction.bind(null, module.id)}
                                        module={{
                                            slug: module.slug,
                                            title: module.title,
                                            description: module.description,
                                            href: module.href,
                                            icon: module.icon,
                                            status: module.status,
                                        }}
                                    />
                                    <DeleteModuleButton
                                        moduleId={module.id}
                                        moduleTitle={module.title}
                                    />
                                </>
                            }
                        />
                    ))}
                </div>
            )}
        </>
    );
}
