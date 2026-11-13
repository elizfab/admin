import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, created, ok, readJson } from "@/lib/http/api-response";
import { toFieldErrors } from "@/lib/validations/common.schema";
import { createProjectSchema } from "@/modules/projects";
import { createProject, listProjects } from "@/modules/projects/server";

export async function GET() {
    try {
        const session = await requireApiSession();
        const projects = await listProjects(session.user.id);

        return ok(projects);
    } catch (error) {
        return apiError(error);
    }
}

export async function POST(request: Request) {
    try {
        const session = await requireApiSession();
        const parsed = createProjectSchema.safeParse(await readJson(request));

        if (!parsed.success) {
            throw new ValidationError(toFieldErrors(parsed.error));
        }

        // ownerId vem da SESSÃO, nunca do corpo da requisição.
        const project = await createProject(session.user.id, parsed.data);

        return created(project);
    } catch (error) {
        return apiError(error);
    }
}
