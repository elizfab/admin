import { z } from "zod";

import { emptyToNull } from "@/lib/validations/common.schema";

export const projectStatusValues = ["PLANNED", "IN_PROGRESS", "PAUSED", "DONE"] as const;

const projectFields = {
    name: z
        .string({ error: "Informe o nome." })
        .trim()
        .min(3, { error: "O nome precisa ter pelo menos 3 caracteres." })
        .max(100, { error: "O nome pode ter no máximo 100 caracteres." }),
    description: emptyToNull(
        z.string().trim().max(500, { error: "A descrição pode ter no máximo 500 caracteres." }),
    ),
    status: z.enum(projectStatusValues, { error: "Status inválido." }),
    repositoryUrl: emptyToNull(
        z.url({ protocol: /^https$/, error: "Informe uma URL válida começando com https://." }),
    ),
};

/** Criação: status opcional, com padrão PLANNED. */
export const createProjectSchema = z.object({
    ...projectFields,
    description: projectFields.description.optional(),
    repositoryUrl: projectFields.repositoryUrl.optional(),
    status: projectFields.status.default("PLANNED"),
});

/**
 * Atualização parcial (PATCH): todos os campos opcionais, SEM padrão
 * (senão um PATCH só com o nome voltaria o status para PLANNED).
 */
export const updateProjectSchema = z
    .object(projectFields)
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        error: "Informe ao menos um campo para atualizar.",
    });

export type CreateProjectInput = z.output<typeof createProjectSchema>;
export type UpdateProjectInput = z.output<typeof updateProjectSchema>;
