import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { buttonClassName } from "@/components/ui/Button/Button";
import { requireSession } from "@/lib/auth/session";
import { formatDay } from "@/lib/dates/month";
import { listProjects } from "@/modules/construction/server";
import { ProjectSettingsForm } from "@/modules/construction/components/ConstructionForms/SettingsForms";
import { createProjectAction } from "@/modules/construction/actions/project.actions";
import styles from "./page.module.scss";

export const metadata: Metadata = {
    title: "Obras",
};

export default async function ConstructionPage() {
    const session = await requireSession();
    const projects = await listProjects(session.user.id);

    return (
        <>
            <PageHeader title="Obras" />

            {projects.length === 0 && (
                <p className={styles.empty}>
                    Nenhuma obra ainda. Crie a primeira abaixo — ela já nasce com o ambiente
                    &quot;Geral&quot; e a &quot;Fase 01&quot;.
                </p>
            )}

            {projects.length > 0 && (
                <ul className={styles.list}>
                    {projects.map((project) => (
                        <li key={project.id} className={styles.item}>
                            <div>
                                <Link href={`/finance/construction/${project.id}`} className={styles.name}>
                                    {project.name}
                                </Link>
                                <span className={styles.dates}>
                                    {project.startDate
                                        ? `Início ${formatDay(project.startDate)}`
                                        : "Sem data de início"}
                                    {project.plannedEndDate && ` · Fim previsto ${formatDay(project.plannedEndDate)}`}
                                </span>
                            </div>
                            <Link
                                href={`/finance/construction/${project.id}/settings`}
                                className={buttonClassName("secondary")}
                            >
                                Configurar
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            <section className={styles.newSection} aria-labelledby="new-project">
                <h2 id="new-project" className={styles.sectionTitle}>
                    Nova obra
                </h2>
                <ProjectSettingsForm
                    action={createProjectAction}
                    project={{ name: "", startDate: null, plannedEndDate: null }}
                />
            </section>
        </>
    );
}
