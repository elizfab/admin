"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireApiSession } from "@/lib/auth/session";
import { AppError, ValidationError } from "@/lib/errors/app-error";
import { toFieldErrors } from "@/lib/validations/common.schema";
import { createServicePaymentSchema } from "@/modules/construction";
import { getService, registerServicePayment } from "@/modules/construction/server";

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
 * Atalho "Nova transação → Obra" (Fase 09): chama o MESMO
 * registerServicePayment da tela de Pagamentos — nenhuma regra duplicada.
 * Depois de salvar, volta ao Financeiro no mês do pagamento.
 */
export async function createConstructionPaymentAction(
    _previousState: FormState,
    formData: FormData,
): Promise<FormState> {
    let month: string;

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

        month = parsed.data.paidOn.toISOString().slice(0, 7);

        revalidatePath("/finance");
        revalidatePath(`/finance/construction/${service.projectId}`);
        revalidatePath(`/finance/construction/${service.projectId}/payments`);
    } catch (error) {
        return toFormState(error);
    }

    redirect(`/finance?month=${month}`);
}
