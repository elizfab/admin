import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, noContent, ok, readJson } from "@/lib/http/api-response";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import { updateProjectSchema } from "@/modules/projects";
import { deleteProject, getProject, updateProject } from "@/modules/projects/server";

type Context = RouteContext<"/api/v1/projects/[id]">;

async function parseId(ctx: Context) {
    const { id } = await ctx.params;
    const parsed = idSchema.safeParse(id);

    if (!parsed.success) {
        throw new ValidationError({ id: ["Identificador inválido."] });
    }

    return parsed.data;
}

export async function GET(_request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const project = await getProject(session.user.id, await parseId(ctx));

        return ok(project);
    } catch (error) {
        return apiError(error);
    }
}

export async function PATCH(request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const id = await parseId(ctx);
        const parsed = updateProjectSchema.safeParse(await readJson(request));

        if (!parsed.success) {
            throw new ValidationError(toFieldErrors(parsed.error));
        }

        const project = await updateProject(session.user.id, id, parsed.data);

        return ok(project);
    } catch (error) {
        return apiError(error);
    }
}

export async function DELETE(_request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        await deleteProject(session.user.id, await parseId(ctx));

        return noContent();
    } catch (error) {
        return apiError(error);
    }
}
