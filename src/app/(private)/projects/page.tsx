import { FolderKanban, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { buttonClassName } from "@/components/ui/Button/Button";
import { requireSession } from "@/lib/auth/session";
import { ProjectList } from "@/modules/projects/components/ProjectList/ProjectList";
import { listProjects } from "@/modules/projects/server";

export const metadata: Metadata = {
    title: "Projetos",
};

export default async function ProjectsPage() {
    // A página busca dados: valida a sessão aqui também (perto do dado),
    // sem depender só do layout. getSession() é cacheada por requisição.
    const session = await requireSession();
    const projects = await listProjects(session.user.id);

    const newProjectLink = (
        <Link href="/projects/new" className={buttonClassName("primary")}>
            <Plus size={16} aria-hidden="true" />
            Novo projeto
        </Link>
    );

    if (projects.length === 0) {
        return (
            <EmptyState
                headingLevel="h1"
                icon={<FolderKanban size={32} aria-hidden="true" />}
                title="Projetos"
                description="Você ainda não tem projetos cadastrados."
                action={newProjectLink}
            />
        );
    }

    return (
        <>
            <PageHeader title="Projetos" action={newProjectLink} />
            <ProjectList projects={projects} />
        </>
    );
}
