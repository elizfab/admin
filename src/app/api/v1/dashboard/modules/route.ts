import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, created, ok, readJson } from "@/lib/http/api-response";
import { toFieldErrors } from "@/lib/validations/common.schema";
import { createDashboardModuleSchema } from "@/modules/dashboard";
import { createDashboardModule, listDashboardModules } from "@/modules/dashboard/server";

export async function GET() {
    try {
        const session = await requireApiSession();

        return ok(await listDashboardModules(session.user.id));
    } catch (error) {
        return apiError(error);
    }
}

export async function POST(request: Request) {
    try {
        const session = await requireApiSession();
        const parsed = createDashboardModuleSchema.safeParse(await readJson(request));

        if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));

        // ownerId vem da SESSÃO, nunca do corpo da requisição (R2).
        return created(await createDashboardModule(session.user.id, parsed.data));
    } catch (error) {
        return apiError(error);
    }
}
