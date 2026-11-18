import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, ok } from "@/lib/http/api-response";
import { idSchema } from "@/lib/validations/common.schema";
import { getProject } from "@/modules/construction/server";

type Context = RouteContext<"/api/v1/finance/construction/projects/[projectId]">;

/** GET /api/v1/finance/construction/projects/:projectId (com ambientes e fases) */
export async function GET(_request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const { projectId } = await ctx.params;
        const parsed = idSchema.safeParse(projectId);

        if (!parsed.success) {
            throw new ValidationError({ projectId: ["Identificador inválido."] });
        }

        const project = await getProject(session.user.id, parsed.data);

        return ok(project);
    } catch (error) {
        return apiError(error);
    }
}
