import { requireApiSession } from "@/lib/auth/session";
import { apiError, ok } from "@/lib/http/api-response";
import { getMonthlySummary } from "@/modules/finance/server";

import { readMonthParam } from "../month-param";

/** GET /api/v1/finance/summary?month=2026-11 */
export async function GET(request: Request) {
    try {
        const session = await requireApiSession();
        const summary = await getMonthlySummary(session.user.id, readMonthParam(request));

        return ok(summary);
    } catch (error) {
        return apiError(error);
    }
}
