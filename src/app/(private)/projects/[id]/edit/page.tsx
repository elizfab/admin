import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { requireSession } from "@/lib/auth/session";
import { NotFoundError } from "@/lib/errors/app-error";
import { idSchema } from "@/lib/validations/common.schema";
import { updateProjectAction } from "@/modules/projects/actions/project.actions";
import { ProjectForm } from "@/modules/projects/components/ProjectForm/ProjectForm";
import { getProject } from "@/modules/projects/server";

export const metadata: Metadata = {
    title: "Editar projeto",
};

export default async function EditProjectPage({ params }: PageProps<"/projects/[id]/edit">) {
    const session = await requireSession();
    const parsedId = idSchema.safeParse((await params).id);

    if (!parsedId.success) notFound();

    const project = await getProject(session.user.id, parsedId.data).catch((error) => {
        if (error instanceof NotFoundError) notFound();
        throw error;
    });

    // bind fixa o id como 1º argumento da action, no servidor.
    const action = updateProjectAction.bind(null, project.id);

    return (
        <>
            <PageHeader title="Editar projeto" />
            <ProjectForm action={action} project={project} submitLabel="Salvar alterações" />
        </>
    );
}
