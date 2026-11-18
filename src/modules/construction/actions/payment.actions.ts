"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireApiSession } from "@/lib/auth/session";
import { AppError, ValidationError } from "@/lib/errors/app-error";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import { createServicePaymentSchema } from "@/modules/construction";
import {
    deleteServicePayment,
    getService,
    registerServicePayment,
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

/**
 * Pagamento de serviço (tela Pagamentos e atalho de Nova transação → Obra).
 * Depois de salvar, volta para a FASE do serviço, onde o card mostra o
 * pagamento novo.
 */
export async function createServicePaymentAction(
    _previousState: FormState,
    formData: FormData,
): Promise<FormState> {
    let redirectTo: string;

    try {
        const session = await requireApiSession();
        const parsed = createServicePaymentSchema.safeParse({
            serviceId: text(formData, "serviceId"),
            paidOn: text(formData, "paidOn"),
            amountCents: text(formData, "amountCents"),
            method: text(formData, "method"),
            notes: text(formData, "notes"),
        });

        if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));

        const { service } = await getService(session.user.id, parsed.data.serviceId);
        await registerServicePayment(session.user.id, parsed.data);

        redirectTo = `/finance/construction/${service.projectId}/phases/${service.phase.number}`;

        revalidatePath(`/finance/construction/${service.projectId}`);
        revalidatePath(`/finance/construction/${service.projectId}/payments`);
        revalidatePath("/finance");
    } catch (error) {
        return toFormState(error);
    }

    redirect(redirectTo);
}

export async function deleteServicePaymentAction(paymentId: string): Promise<FormState> {
    try {
        const session = await requireApiSession();
        const id = idSchema.parse(paymentId);

        await deleteServicePayment(session.user.id, id);
    } catch (error) {
        return toFormState(error);
    }

    return null;
}
