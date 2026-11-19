"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireApiSession } from "@/lib/auth/session";
import { AppError, ValidationError } from "@/lib/errors/app-error";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import { createPurchaseSchema, payInstallmentSchema } from "@/modules/construction";
import {
    createPurchase,
    deletePurchase,
    payInstallment,
    unpayInstallment,
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

export async function createPurchaseAction(
    projectId: string,
    _previousState: FormState,
    formData: FormData,
): Promise<FormState> {
    let id: string;

    try {
        const session = await requireApiSession();
        id = idSchema.parse(projectId);
        const parsed = createPurchaseSchema.safeParse({
            areaId: text(formData, "areaId") || undefined,
            item: text(formData, "item"),
            supplier: text(formData, "supplier"),
            purchasedOn: text(formData, "purchasedOn"),
            totalCents: text(formData, "totalCents"),
            method: text(formData, "method"),
            installmentsCount: text(formData, "installmentsCount"),
            firstDueOn: text(formData, "firstDueOn") || undefined,
            notes: text(formData, "notes"),
        });

        if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));

        await createPurchase(session.user.id, id, parsed.data);
    } catch (error) {
        return toFormState(error);
    }

    revalidatePath(`/finance/construction/${id}/purchases`);
    revalidatePath(`/finance/construction/${id}`);
    revalidatePath("/finance");
    redirect(`/finance/construction/${id}/purchases`);
}

export async function payInstallmentAction(
    installmentId: string,
    projectId: string,
    _previousState: FormState,
    formData: FormData,
): Promise<FormState> {
    try {
        const session = await requireApiSession();
        const id = idSchema.parse(installmentId);
        const parsed = payInstallmentSchema.safeParse({ paidOn: text(formData, "paidOn") });

        if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));

        await payInstallment(session.user.id, id, parsed.data.paidOn);

        revalidatePath(`/finance/construction/${projectId}/purchases`);
        revalidatePath(`/finance/construction/${projectId}`);
        revalidatePath("/finance");
    } catch (error) {
        return toFormState(error);
    }

    return null;
}

export async function unpayInstallmentAction(
    installmentId: string,
    projectId: string,
): Promise<FormState> {
    try {
        const session = await requireApiSession();
        await unpayInstallment(session.user.id, idSchema.parse(installmentId));

        revalidatePath(`/finance/construction/${projectId}/purchases`);
        revalidatePath(`/finance/construction/${projectId}`);
        revalidatePath("/finance");
    } catch (error) {
        return toFormState(error);
    }

    return null;
}

export async function deletePurchaseAction(
    purchaseId: string,
    projectId: string,
): Promise<FormState> {
    try {
        const session = await requireApiSession();
        await deletePurchase(session.user.id, idSchema.parse(purchaseId));

        revalidatePath(`/finance/construction/${projectId}/purchases`);
        revalidatePath(`/finance/construction/${projectId}`);
        revalidatePath("/finance");
    } catch (error) {
        return toFormState(error);
    }

    return null;
}
