import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, ok } from "@/lib/http/api-response";
import { idSchema } from "@/lib/validations/common.schema";
import { listPayments } from "@/modules/construction/server";

type Context = RouteContext<"/api/v1/finance/construction/projects/[projectId]/payments">;

/** GET /api/v1/finance/construction/projects/:projectId/payments?serviceId= */
export async function GET(request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const { projectId } = await ctx.params;
        const id = idSchema.safeParse(projectId);

        if (!id.success) {
            throw new ValidationError({ projectId: ["Identificador inválido."] });
        }

        const serviceId = new URL(request.url).searchParams.get("serviceId") ?? undefined;
        const payments = await listPayments(session.user.id, id.data, serviceId);

        return ok(payments);
    } catch (error) {
        return apiError(error);
    }
}
