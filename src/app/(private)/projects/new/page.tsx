import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { createProjectAction } from "@/modules/projects/actions/project.actions";
import { ProjectForm } from "@/modules/projects/components/ProjectForm/ProjectForm";

export const metadata: Metadata = {
    title: "Novo projeto",
};

export default function NewProjectPage() {
    return (
        <>
            <PageHeader title="Novo projeto" />
            <ProjectForm action={createProjectAction} submitLabel="Criar projeto" />
        </>
    );
}
