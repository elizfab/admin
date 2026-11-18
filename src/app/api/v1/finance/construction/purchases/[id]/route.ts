import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, noContent } from "@/lib/http/api-response";
import { idSchema } from "@/lib/validations/common.schema";
import { deletePurchase } from "@/modules/construction/server";

type Context = RouteContext<"/api/v1/finance/construction/purchases/[id]">;

/** DELETE /api/v1/finance/construction/purchases/:id (parcelas e lançamentos saem juntos) */
export async function DELETE(_request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const { id } = await ctx.params;
        const parsed = idSchema.safeParse(id);

        if (!parsed.success) {
            throw new ValidationError({ id: ["Identificador inválido."] });
        }

        await deletePurchase(session.user.id, parsed.data);

        return noContent();
    } catch (error) {
        return apiError(error);
    }
}
