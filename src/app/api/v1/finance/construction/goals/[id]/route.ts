import { today } from "@/lib/dates/month";
import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, noContent, ok, readJson } from "@/lib/http/api-response";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import { setGoalDoneSchema } from "@/modules/construction";
import { deleteGoal, setGoalDone } from "@/modules/construction/server";

type Context = RouteContext<"/api/v1/finance/construction/goals/[id]">;

async function parseId(ctx: Context) {
    const { id } = await ctx.params;
    const parsed = idSchema.safeParse(id);

    if (!parsed.success) {
        throw new ValidationError({ id: ["Identificador inválido."] });
    }

    return parsed.data;
}

/** PATCH /api/v1/finance/construction/goals/:id — { "done": true | false } */
export async function PATCH(request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const id = await parseId(ctx);
        const parsed = setGoalDoneSchema.safeParse(await readJson(request));

        if (!parsed.success) {
            throw new ValidationError(toFieldErrors(parsed.error));
        }

        const goal = await setGoalDone(
            session.user.id,
            id,
            parsed.data.done,
            new Date(`${today()}T00:00:00.000Z`),
        );

        return ok(goal);
    } catch (error) {
        return apiError(error);
    }
}

/** DELETE /api/v1/finance/construction/goals/:id */
export async function DELETE(_request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        await deleteGoal(session.user.id, await parseId(ctx));

        return noContent();
    } catch (error) {
        return apiError(error);
    }
}
