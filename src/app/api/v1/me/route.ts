import { requireApiSession } from "@/lib/auth/session";
import { apiError, ok } from "@/lib/http/api-response";

export async function GET() {
    try {
        const session = await requireApiSession();
        const { id, name, email, role } = session.user;

        // Retorna somente o necessário — nunca tokens ou dados da sessão.
        return ok({ id, name, email, role });
    } catch (error) {
        return apiError(error);
    }
}
