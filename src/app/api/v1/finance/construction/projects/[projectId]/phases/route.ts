import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, created, readJson } from "@/lib/http/api-response";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import { createPhaseSchema } from "@/modules/construction";
import { addPhase } from "@/modules/construction/server";

type Context = RouteContext<"/api/v1/finance/construction/projects/[projectId]/phases">;

/** POST /api/v1/finance/construction/projects/:projectId/phases */
export async function POST(request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const { projectId } = await ctx.params;
        const id = idSchema.safeParse(projectId);

        if (!id.success) {
            throw new ValidationError({ projectId: ["Identificador inválido."] });
        }

        const parsed = createPhaseSchema.safeParse(await readJson(request));

        if (!parsed.success) {
            throw new ValidationError(toFieldErrors(parsed.error));
        }

        const phase = await addPhase(session.user.id, id.data, parsed.data);

        return created(phase);
    } catch (error) {
        return apiError(error);
    }
}
