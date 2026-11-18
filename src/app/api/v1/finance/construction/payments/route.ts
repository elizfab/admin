import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, created, readJson } from "@/lib/http/api-response";
import { toFieldErrors } from "@/lib/validations/common.schema";
import { createServicePaymentSchema } from "@/modules/construction";
import { registerServicePayment } from "@/modules/construction/server";

/** POST /api/v1/finance/construction/payments */
export async function POST(request: Request) {
    try {
        const session = await requireApiSession();
        const parsed = createServicePaymentSchema.safeParse(await readJson(request));

        if (!parsed.success) {
            throw new ValidationError(toFieldErrors(parsed.error));
        }

        const payment = await registerServicePayment(session.user.id, parsed.data);

        return created(payment);
    } catch (error) {
        return apiError(error);
    }
}
