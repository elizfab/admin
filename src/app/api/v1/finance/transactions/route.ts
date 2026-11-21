import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, created, ok, readJson } from "@/lib/http/api-response";
import { toFieldErrors } from "@/lib/validations/common.schema";
import { createTransactionSchema } from "@/modules/finance";
import { createTransaction, listTransactions } from "@/modules/finance/server";

import { readMonthParam } from "../month-param";

/** GET /api/v1/finance/transactions?month=2026-11 */
export async function GET(request: Request) {
    try {
        const session = await requireApiSession();
        const transactions = await listTransactions(session.user.id, readMonthParam(request));

        return ok(transactions);
    } catch (error) {
        return apiError(error);
    }
}

/** POST /api/v1/finance/transactions */
export async function POST(request: Request) {
    try {
        const session = await requireApiSession();
        const parsed = createTransactionSchema.safeParse(await readJson(request));

        if (!parsed.success) {
            throw new ValidationError(toFieldErrors(parsed.error));
        }

        // ownerId vem da SESSÃO, nunca do corpo da requisição.
        const transaction = await createTransaction(session.user.id, parsed.data);

        return created(transaction);
    } catch (error) {
        return apiError(error);
    }
}
