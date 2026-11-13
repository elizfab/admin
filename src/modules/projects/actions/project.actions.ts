"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireApiSession } from "@/lib/auth/session";
import { AppError, ValidationError, type FieldErrors } from "@/lib/errors/app-error";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import { createProjectSchema, updateProjectSchema } from "@/modules/projects";
import { createProject, deleteProject, updateProject } from "@/modules/projects/server";

/**
 * Server Actions são pontos de entrada do servidor, como uma API:
 * TODA action valida sessão, dados e permissão (ARCHITECTURE.md, seção 9.2).
 */

export type ProjectFormValues = {
    name: string;
    description: string;
    status: string;
    repositoryUrl: string;
};

export type ProjectFormState = {
    message?: string;
    fieldErrors?: FieldErrors;
    /** Valores enviados: o React 19 limpa o formulário após a action, então devolvemos o que foi digitado. */
    values?: ProjectFormValues;
} | null;

function readProjectForm(formData: FormData): ProjectFormValues {
    const text = (key: string) => String(formData.get(key) ?? "");

    return {
        name: text("name"),
        description: text("description"),
        status: text("status"),
        repositoryUrl: text("repositoryUrl"),
    };
}

function toFormState(error: unknown, values?: ProjectFormValues): ProjectFormState {
    if (error instanceof AppError) {
        return { message: error.message, fieldErrors: error.fieldErrors, values };
    }

    console.error("[projects] erro inesperado na action:", error);
    return { message: "Erro inesperado. Tente novamente.", values };
}

export async function createProjectAction(
    _previousState: ProjectFormState,
    formData: FormData,
): Promise<ProjectFormState> {
    const values = readProjectForm(formData);

    try {
        const session = await requireApiSession();
        const parsed = createProjectSchema.safeParse(values);

        if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));

        await createProject(session.user.id, parsed.data);
    } catch (error) {
        return toFormState(error, values);
    }

    // redirect() fica FORA do try: ele funciona lançando uma exceção especial.
    revalidatePath("/projects");
    redirect("/projects");
}

export async function updateProjectAction(
    id: string,
    _previousState: ProjectFormState,
    formData: FormData,
): Promise<ProjectFormState> {
    const values = readProjectForm(formData);

    try {
        const session = await requireApiSession();
        const projectId = idSchema.parse(id);
        const parsed = updateProjectSchema.safeParse(values);

        if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));

        await updateProject(session.user.id, projectId, parsed.data);
    } catch (error) {
        return toFormState(error, values);
    }

    revalidatePath("/projects");
    redirect("/projects");
}

export async function deleteProjectAction(id: string): Promise<ProjectFormState> {
    try {
        const session = await requireApiSession();

        await deleteProject(session.user.id, idSchema.parse(id));
    } catch (error) {
        return toFormState(error);
    }

    revalidatePath("/projects");
    return null;
}
