import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { requireSession } from "@/lib/auth/session";
import { NotFoundError } from "@/lib/errors/app-error";
import { ConstructionTabs } from "@/modules/construction/components/ConstructionTabs/ConstructionTabs";
import { AddPhaseForm } from "@/modules/construction/components/ConstructionForms/SettingsForms";
import { addPhaseAction } from "@/modules/construction/actions/project.actions";
import { getProject } from "@/modules/construction/server";

import styles from "../settings/page.module.scss";

export const metadata: Metadata = {
    title: "Fases da obra",
};

/** Aba Fases: lista das fases da obra + cadastro (veio da antiga Configuração). */
export default async function ConstructionPhasesPage({
    params,
}: PageProps<"/finance/construction/[projectId]/phases">) {
    const session = await requireSession();
    const { projectId } = await params;

    const project = await getProject(session.user.id, projectId).catch((error) => {
        if (error instanceof NotFoundError) notFound();
        throw error;
    });

    const addPhase = addPhaseAction.bind(null, project.id);
    const suggestedPhase = Math.max(0, ...project.phases.map((p) => p.number)) + 1;

    return (
        <>
            <PageHeader title={`${project.name} — Fases`} />
            <ConstructionTabs projectId={project.id} active="phases" />

            <section className={styles.section} aria-labelledby="phases">
                <h2 id="phases" className={styles.sectionTitle}>
                    Fases
                </h2>
                <ul className={styles.chips}>
                    {project.phases.map((phase) => (
                        <li key={phase.id} className={styles.chip}>
                            <Link
                                href={`/finance/construction/${project.id}/phases/${phase.number}`}
                                className={styles.phaseLink}
                            >
                                Fase {String(phase.number).padStart(2, "0")}
                                {phase.name ? ` — ${phase.name}` : ""}
                            </Link>
                        </li>
                    ))}
                </ul>
                <AddPhaseForm action={addPhase} suggestedNumber={suggestedPhase} />
            </section>
        </>
    );
}
