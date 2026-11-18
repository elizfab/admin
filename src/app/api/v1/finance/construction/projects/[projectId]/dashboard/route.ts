import { today } from "@/lib/dates/month";
import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, ok } from "@/lib/http/api-response";
import { idSchema } from "@/lib/validations/common.schema";
import { getConstructionDashboard } from "@/modules/construction/server";

import { readMonthParam } from "../../../../month-param";

type Context = RouteContext<"/api/v1/finance/construction/projects/[projectId]/dashboard">;

/** GET /api/v1/finance/construction/projects/:projectId/dashboard?month=AAAA-MM */
export async function GET(request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const { projectId } = await ctx.params;
        const id = idSchema.safeParse(projectId);

        if (!id.success) {
            throw new ValidationError({ projectId: ["Identificador inválido."] });
        }

        const month = readMonthParam(request);
        const todayDate = new Date(`${today()}T00:00:00.000Z`);
        const dashboard = await getConstructionDashboard(session.user.id, id.data, todayDate, month);

        return ok(dashboard);
    } catch (error) {
        return apiError(error);
    }
}
