import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, noContent, ok, readJson } from "@/lib/http/api-response";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import { updateServiceSchema } from "@/modules/construction";
import { deleteService, getService, updateService } from "@/modules/construction/server";

type Context = RouteContext<"/api/v1/finance/construction/services/[id]">;

async function parseId(ctx: Context) {
    const { id } = await ctx.params;
    const parsed = idSchema.safeParse(id);

    if (!parsed.success) {
        throw new ValidationError({ id: ["Identificador inválido."] });
    }

    return parsed.data;
}

/** GET /api/v1/finance/construction/services/:id (com summary calculado) */
export async function GET(_request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const result = await getService(session.user.id, await parseId(ctx));

        return ok(result);
    } catch (error) {
        return apiError(error);
    }
}

/** PATCH /api/v1/finance/construction/services/:id */
export async function PATCH(request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const id = await parseId(ctx);
        const parsed = updateServiceSchema.safeParse(await readJson(request));

        if (!parsed.success) {
            throw new ValidationError(toFieldErrors(parsed.error));
        }

        const service = await updateService(session.user.id, id, parsed.data);

        return ok(service);
    } catch (error) {
        return apiError(error);
    }
}

/** DELETE /api/v1/finance/construction/services/:id (409 com pagamentos) */
export async function DELETE(_request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        await deleteService(session.user.id, await parseId(ctx));

        return noContent();
    } catch (error) {
        return apiError(error);
    }
}
