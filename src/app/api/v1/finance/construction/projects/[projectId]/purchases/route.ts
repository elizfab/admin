import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, created, ok, readJson } from "@/lib/http/api-response";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import { createPurchaseSchema } from "@/modules/construction";
import { createPurchase, listPurchases } from "@/modules/construction/server";

type Context = RouteContext<"/api/v1/finance/construction/projects/[projectId]/purchases">;

/** GET /api/v1/finance/construction/projects/:projectId/purchases */
export async function GET(_request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const { projectId } = await ctx.params;
        const id = idSchema.safeParse(projectId);

        if (!id.success) {
            throw new ValidationError({ projectId: ["Identificador inválido."] });
        }

        const purchases = await listPurchases(session.user.id, id.data);

        return ok(purchases);
    } catch (error) {
        return apiError(error);
    }
}

/** POST /api/v1/finance/construction/projects/:projectId/purchases */
export async function POST(request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const { projectId } = await ctx.params;
        const id = idSchema.safeParse(projectId);

        if (!id.success) {
            throw new ValidationError({ projectId: ["Identificador inválido."] });
        }

        const parsed = createPurchaseSchema.safeParse(await readJson(request));

        if (!parsed.success) {
            throw new ValidationError(toFieldErrors(parsed.error));
        }

        const purchase = await createPurchase(session.user.id, id.data, parsed.data);

        return created(purchase);
    } catch (error) {
        return apiError(error);
    }
}
