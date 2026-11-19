"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireApiSession } from "@/lib/auth/session";
import { AppError, ValidationError } from "@/lib/errors/app-error";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import { createServiceSchema, updateServiceSchema } from "@/modules/construction";
import {
    createService,
    deleteService,
    getService,
    updateService,
} from "@/modules/construction/server";

import type { FormState } from "./project.actions";

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

function readServiceForm(formData: FormData) {
    return {
        phaseId: text(formData, "phaseId"),
        areaId: text(formData, "areaId") || undefined,
        trade: text(formData, "trade"),
        professionalName: text(formData, "professionalName"),
        description: text(formData, "description"),
        contractedCents: text(formData, "contractedCents"),
        notes: text(formData, "notes"),
    };
}

export async function createServiceAction(
    projectId: string,
    _previousState: FormState,
    formData: FormData,
): Promise<FormState> {
    try {
        const session = await requireApiSession();
        const id = idSchema.parse(projectId);
        const parsed = createServiceSchema.safeParse(readServiceForm(formData));

        if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));

        const service = await createService(session.user.id, id, parsed.data);

        revalidatePath(`/finance/construction/${projectId}/services`);
        revalidatePath(`/finance/construction/${projectId}/phases/${service.phase.number}`);
    } catch (error) {
        return toFormState(error);
    }

    redirect(`/finance/construction/${projectId}/services`);
}

export async function updateServiceAction(
    serviceId: string,
    _previousState: FormState,
    formData: FormData,
): Promise<FormState> {
    let projectId: string;

    try {
        const session = await requireApiSession();
        const id = idSchema.parse(serviceId);
        const parsed = updateServiceSchema.safeParse(readServiceForm(formData));

        if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));

        const { service } = await getService(session.user.id, id);
        await updateService(session.user.id, id, parsed.data);
        projectId = service.projectId;

        revalidatePath(`/finance/construction/${projectId}/services`);
        revalidatePath(`/finance/construction/${projectId}/phases/${service.phase.number}`);
    } catch (error) {
        return toFormState(error);
    }

    redirect(`/finance/construction/${projectId}/services`);
}

export async function deleteServiceAction(serviceId: string): Promise<FormState> {
    try {
        const session = await requireApiSession();
        const id = idSchema.parse(serviceId);
        const { service } = await getService(session.user.id, id);

        await deleteService(session.user.id, id);

        revalidatePath(`/finance/construction/${service.projectId}/services`);
    } catch (error) {
        return toFormState(error);
    }

    return null;
}
