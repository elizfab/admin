"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireApiSession } from "@/lib/auth/session";
import { AppError, ValidationError, type FieldErrors } from "@/lib/errors/app-error";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import {
    createAreaSchema,
    createPhaseSchema,
    createProjectSchema,
    updateProjectSchema,
} from "@/modules/construction";
import {
    addArea,
    addPhase,
    createProject,
    updateProject,
} from "@/modules/construction/server";

/**
 * Server Actions da obra: mesmo contrato das do Financeiro
 * (sessão → validação → serviço). TODA action valida sessão e dados.
 */

export type FormState = {
    message?: string;
    fieldErrors?: FieldErrors;
} | null;

function toFormState(error: unknown): FormState {
    if (error instanceof AppError) {
        return { message: error.message, fieldErrors: error.fieldErrors };
    }

    console.error("[construction] erro inesperado na action:", error);
    return { message: "Erro inesperado. Tente novamente." };
}

function text(formData: FormData, key: string) {
    return String(formData.get(key) ?? "");
}

// ─── Obra ─────────────────────────────────────────────────────

export async function createProjectAction(
    _previousState: FormState,
    formData: FormData,
): Promise<FormState> {
    let projectId: string;

    try {
        const session = await requireApiSession();
        const parsed = createProjectSchema.safeParse({
            name: text(formData, "name"),
            startDate: text(formData, "startDate") || undefined,
            plannedEndDate: text(formData, "plannedEndDate") || undefined,
        });

        if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));

        const project = await createProject(session.user.id, parsed.data);
        projectId = project.id;
    } catch (error) {
        return toFormState(error);
    }

    revalidatePath("/finance/construction");
    redirect(`/finance/construction/${projectId}/settings`);
}

export async function updateProjectAction(
    projectId: string,
    _previousState: FormState,
    formData: FormData,
): Promise<FormState> {
    try {
        const session = await requireApiSession();
        const id = idSchema.parse(projectId);
        const parsed = updateProjectSchema.safeParse({
            name: text(formData, "name"),
            startDate: text(formData, "startDate") || null,
            plannedEndDate: text(formData, "plannedEndDate") || null,
        });

        if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));

        await updateProject(session.user.id, id, parsed.data);
    } catch (error) {
        return toFormState(error);
    }

    revalidatePath(`/finance/construction/${projectId}`);
    revalidatePath(`/finance/construction/${projectId}/settings`);
    return null;
}

// ─── Ambientes e fases ────────────────────────────────────────

export async function addAreaAction(
    projectId: string,
    _previousState: FormState,
    formData: FormData,
): Promise<FormState> {
    try {
        const session = await requireApiSession();
        const id = idSchema.parse(projectId);
        const parsed = createAreaSchema.safeParse({ name: text(formData, "name") });

        if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));

        await addArea(session.user.id, id, parsed.data);
    } catch (error) {
        return toFormState(error);
    }

    revalidatePath(`/finance/construction/${projectId}/settings`);
    return null;
}

export async function addPhaseAction(
    projectId: string,
    _previousState: FormState,
    formData: FormData,
): Promise<FormState> {
    try {
        const session = await requireApiSession();
        const id = idSchema.parse(projectId);
        const parsed = createPhaseSchema.safeParse({
            number: text(formData, "number"),
            name: text(formData, "name") || undefined,
        });

        if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));

        await addPhase(session.user.id, id, parsed.data);
    } catch (error) {
        return toFormState(error);
    }

    revalidatePath(`/finance/construction/${projectId}/settings`);
    return null;
}
