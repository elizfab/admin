import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, noContent, ok, readJson } from "@/lib/http/api-response";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import { updateTransactionSchema } from "@/modules/finance";
import { deleteTransaction, getTransaction, updateTransaction } from "@/modules/finance/server";

type Context = RouteContext<"/api/v1/finance/transactions/[id]">;

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
        const transaction = await getTransaction(session.user.id, await parseId(ctx));

        return ok(transaction);
    } catch (error) {
        return apiError(error);
    }
}

export async function PATCH(request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        const id = await parseId(ctx);
        const parsed = updateTransactionSchema.safeParse(await readJson(request));

        if (!parsed.success) {
            throw new ValidationError(toFieldErrors(parsed.error));
        }

        const transaction = await updateTransaction(session.user.id, id, parsed.data);

        return ok(transaction);
    } catch (error) {
        return apiError(error);
    }
}

export async function DELETE(_request: Request, ctx: Context) {
    try {
        const session = await requireApiSession();
        await deleteTransaction(session.user.id, await parseId(ctx));

        return noContent();
    } catch (error) {
        return apiError(error);
    }
}
