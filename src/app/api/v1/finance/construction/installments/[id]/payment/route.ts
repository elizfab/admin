import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, noContent, ok, readJson } from "@/lib/http/api-response";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import { payInstallmentSchema } from "@/modules/construction";
import { payInstallment, unpayInstallment } from "@/modules/construction/server";

type Context = RouteContext<"/api/v1/finance/construction/installments/[id]/payment">;

/** POST /api/v1/finance/construction/installments/:id/payment (marca como paga) */
export async function POST(request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const { id } = await ctx.params;
        const parsedId = idSchema.safeParse(id);

        if (!parsedId.success) {
            throw new ValidationError({ id: ["Identificador inválido."] });
        }

        const parsed = payInstallmentSchema.safeParse(await readJson(request));

        if (!parsed.success) {
            throw new ValidationError(toFieldErrors(parsed.error));
        }

        const installment = await payInstallment(
            session.user.id,
            parsedId.data,
            parsed.data.paidOn,
        );

        return ok(installment);
    } catch (error) {
        return apiError(error);
    }
}

/** DELETE /api/v1/finance/construction/installments/:id/payment (desfaz o pagamento) */
export async function DELETE(_request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const { id } = await ctx.params;
        const parsed = idSchema.safeParse(id);

        if (!parsed.success) {
            throw new ValidationError({ id: ["Identificador inválido."] });
        }

        await unpayInstallment(session.user.id, parsed.data);

        return noContent();
    } catch (error) {
        return apiError(error);
    }
}
