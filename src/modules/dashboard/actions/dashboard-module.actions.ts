"use server";

import { revalidatePath } from "next/cache";

import { requireApiSession } from "@/lib/auth/session";
import { AppError, ValidationError, type FieldErrors } from "@/lib/errors/app-error";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import { createDashboardModuleSchema, updateDashboardModuleSchema } from "@/modules/dashboard";
import {
    createDashboardModule,
    deleteDashboardModule,
    updateDashboardModule,
} from "@/modules/dashboard/server";

/**
 * Server Actions dos cards: validam sessão, dados e permissão como uma API.
 * Sem redirect(): o formulário fica num modal, que fecha no cliente quando ok = true.
 */

export type DashboardModuleFormValues = {
    slug: string;
    title: string;
    description: string;
    href: string;
    icon: string;
    status: string;
};

export type DashboardModuleFormState = {
    ok?: boolean;
    message?: string;
    fieldErrors?: FieldErrors;
    /** Valores enviados: o React 19 limpa o formulário após a action, então devolvemos o que foi digitado. */
    values?: DashboardModuleFormValues;
} | null;

function readForm(formData: FormData): DashboardModuleFormValues {
    const text = (key: string) => String(formData.get(key) ?? "");

    return {
        slug: text("slug"),
        title: text("title"),
        description: text("description"),
        href: text("href"),
        icon: text("icon"),
        status: text("status"),
    };
}

function parseId(id: string) {
    const parsed = idSchema.safeParse(id);

    if (!parsed.success) throw new ValidationError({ id: ["Identificador inválido."] });

    return parsed.data;
}

function toFormState(error: unknown, values?: DashboardModuleFormValues) {
    if (error instanceof AppError) {
        return { message: error.message, fieldErrors: error.fieldErrors, values };
    }

    console.error("[dashboard] erro inesperado na action:", error);
    return { message: "Erro inesperado. Tente novamente.", values };
}

export async function createDashboardModuleAction(
    _previousState: DashboardModuleFormState,
    formData: FormData,
): Promise<DashboardModuleFormState> {
    const values = readForm(formData);

    try {
        const session = await requireApiSession();
        const parsed = createDashboardModuleSchema.safeParse(values);

        if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));

        // ownerId vem da SESSÃO, nunca do formulário (R2).
        await createDashboardModule(session.user.id, parsed.data);
    } catch (error) {
        return toFormState(error, values);
    }

    revalidatePath("/dashboard");
    return { ok: true };
}

export async function updateDashboardModuleAction(
    id: string,
    _previousState: DashboardModuleFormState,
    formData: FormData,
): Promise<DashboardModuleFormState> {
    const values = readForm(formData);

    try {
        const session = await requireApiSession();
        const moduleId = parseId(id);
        const parsed = updateDashboardModuleSchema.safeParse(values);

        if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));

        await updateDashboardModule(session.user.id, moduleId, parsed.data);
    } catch (error) {
        return toFormState(error, values);
    }

    revalidatePath("/dashboard");
    return { ok: true };
}

export async function deleteDashboardModuleAction(id: string): Promise<{ message: string } | null> {
    try {
        const session = await requireApiSession();

        await deleteDashboardModule(session.user.id, parseId(id));
    } catch (error) {
        return { message: toFormState(error).message };
    }

    revalidatePath("/dashboard");
    return null;
}
