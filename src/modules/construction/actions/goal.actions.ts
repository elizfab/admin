"use server";

import { revalidatePath } from "next/cache";

import { today } from "@/lib/dates/month";
import { requireApiSession } from "@/lib/auth/session";
import { AppError, ValidationError } from "@/lib/errors/app-error";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import { createGoalSchema, setGoalDoneSchema } from "@/modules/construction";
import { createGoal, deleteGoal, setGoalDone } from "@/modules/construction/server";

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

export async function createGoalAction(
    projectId: string,
    _previousState: FormState,
    formData: FormData,
): Promise<FormState> {
    try {
        const session = await requireApiSession();
        const id = idSchema.parse(projectId);
        const parsed = createGoalSchema.safeParse({
            title: text(formData, "title"),
            areaId: text(formData, "areaId") || undefined,
        });

        if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));

        await createGoal(session.user.id, id, parsed.data);
    } catch (error) {
        return toFormState(error);
    }

    revalidatePath(`/finance/construction/${projectId}/goals`);
    revalidatePath(`/finance/construction/${projectId}`);
    return null;
}

/** Estado DESEJADO (não "inverta"): cliques repetidos não se anulam. */
export async function setGoalDoneAction(
    goalId: string,
    done: boolean,
    projectId: string,
): Promise<FormState> {
    try {
        const session = await requireApiSession();
        setGoalDoneSchema.parse({ done });

        await setGoalDone(
            session.user.id,
            idSchema.parse(goalId),
            done,
            new Date(`${today()}T00:00:00.000Z`),
        );

        revalidatePath(`/finance/construction/${projectId}/goals`);
        revalidatePath(`/finance/construction/${projectId}`);
    } catch (error) {
        return toFormState(error);
    }

    return null;
}

export async function deleteGoalAction(goalId: string, projectId: string): Promise<FormState> {
    try {
        const session = await requireApiSession();
        await deleteGoal(session.user.id, idSchema.parse(goalId));

        revalidatePath(`/finance/construction/${projectId}/goals`);
        revalidatePath(`/finance/construction/${projectId}`);
    } catch (error) {
        return toFormState(error);
    }

    return null;
}
