import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, created, ok, readJson } from "@/lib/http/api-response";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import { createServiceSchema } from "@/modules/construction";
import { createService, listServices } from "@/modules/construction/server";

type Context = RouteContext<"/api/v1/finance/construction/projects/[projectId]/services">;

/** GET /api/v1/finance/construction/projects/:projectId/services?phaseId= */
export async function GET(request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const { projectId } = await ctx.params;
        const id = idSchema.safeParse(projectId);

        if (!id.success) {
            throw new ValidationError({ projectId: ["Identificador inválido."] });
        }

        const phaseId = new URL(request.url).searchParams.get("phaseId") ?? undefined;
        const services = await listServices(session.user.id, id.data, phaseId);

        return ok(services);
    } catch (error) {
        return apiError(error);
    }
}

/** POST /api/v1/finance/construction/projects/:projectId/services */
export async function POST(request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const { projectId } = await ctx.params;
        const id = idSchema.safeParse(projectId);

        if (!id.success) {
            throw new ValidationError({ projectId: ["Identificador inválido."] });
        }

        const parsed = createServiceSchema.safeParse(await readJson(request));

        if (!parsed.success) {
            throw new ValidationError(toFieldErrors(parsed.error));
        }

        const service = await createService(session.user.id, id.data, parsed.data);

        return created(service);
    } catch (error) {
        return apiError(error);
    }
}
