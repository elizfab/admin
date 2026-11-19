import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, noContent, ok, readJson } from "@/lib/http/api-response";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import { updateDashboardModuleSchema } from "@/modules/dashboard";
import {
    deleteDashboardModule,
    getDashboardModule,
    updateDashboardModule,
} from "@/modules/dashboard/server";

type Context = RouteContext<"/api/v1/dashboard/modules/[id]">;

async function parseId(ctx: Context) {
    const { id } = await ctx.params;
    const parsed = idSchema.safeParse(id);

    if (!parsed.success) throw new ValidationError({ id: ["Identificador inválido."] });

    return parsed.data;
}

export async function GET(_request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();

        return ok(await getDashboardModule(session.user.id, await parseId(ctx)));
    } catch (error) {
        return apiError(error);
    }
}

export async function PATCH(request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const id = await parseId(ctx);
        const parsed = updateDashboardModuleSchema.safeParse(await readJson(request));

        if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));

        return ok(await updateDashboardModule(session.user.id, id, parsed.data));
    } catch (error) {
        return apiError(error);
    }
}

export async function DELETE(_request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        await deleteDashboardModule(session.user.id, await parseId(ctx));

        return noContent();
    } catch (error) {
        return apiError(error);
    }
}
