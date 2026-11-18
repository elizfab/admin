import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, created, ok, readJson } from "@/lib/http/api-response";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import { createGoalSchema } from "@/modules/construction";
import { createGoal, listGoals } from "@/modules/construction/server";

type Context = RouteContext<"/api/v1/finance/construction/projects/[projectId]/goals">;

/** GET /api/v1/finance/construction/projects/:projectId/goals */
export async function GET(_request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const { projectId } = await ctx.params;
        const id = idSchema.safeParse(projectId);

        if (!id.success) {
            throw new ValidationError({ projectId: ["Identificador inválido."] });
        }

        const goals = await listGoals(session.user.id, id.data);

        return ok(goals);
    } catch (error) {
        return apiError(error);
    }
}

/** POST /api/v1/finance/construction/projects/:projectId/goals */
export async function POST(request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const { projectId } = await ctx.params;
        const id = idSchema.safeParse(projectId);

        if (!id.success) {
            throw new ValidationError({ projectId: ["Identificador inválido."] });
        }

        const parsed = createGoalSchema.safeParse(await readJson(request));

        if (!parsed.success) {
            throw new ValidationError(toFieldErrors(parsed.error));
        }

        const goal = await createGoal(session.user.id, id.data, parsed.data);

        return created(goal);
    } catch (error) {
        return apiError(error);
    }
}
