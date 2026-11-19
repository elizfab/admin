import { z } from "zod";

import { dashboardIconNames } from "../icons";

export const dashboardModuleStatusValues = ["AVAILABLE", "EXTERNAL", "SOON"] as const;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HREF_ERROR = "Use um caminho do portal (ex.: /finance) ou uma URL https://.";

/** Link de fora do portal (abre em nova aba). */
export function isExternalHref(href: string): boolean {
    return href.startsWith("https://");
}

/** Caminho interno ("/finance", nunca "//host") ou URL https:// válida, sem espaços. */
function isValidHref(href: string): boolean {
    if (/\s/.test(href)) return false;
    if (href.startsWith("/")) return !href.startsWith("//");

    return isExternalHref(href) && URL.canParse(href);
}

const dashboardModuleFields = {
    slug: z
        .string({ error: "Informe o identificador." })
        .trim()
        .min(2, { error: "O identificador precisa ter pelo menos 2 caracteres." })
        .max(40, { error: "O identificador pode ter no máximo 40 caracteres." })
        .regex(SLUG, {
            error: "Use só letras minúsculas, números e hífen (ex.: release-control).",
        }),
    title: z
        .string({ error: "Informe o título." })
        .trim()
        .min(2, { error: "O título precisa ter pelo menos 2 caracteres." })
        .max(60, { error: "O título pode ter no máximo 60 caracteres." }),
    description: z
        .string({ error: "Informe a descrição." })
        .trim()
        .min(2, { error: "A descrição precisa ter pelo menos 2 caracteres." })
        .max(160, { error: "A descrição pode ter no máximo 160 caracteres." }),
    href: z
        .string({ error: "Informe o link." })
        .trim()
        .max(300, { error: "O link pode ter no máximo 300 caracteres." })
        .refine(isValidHref, { error: HREF_ERROR }),
    icon: z.enum(dashboardIconNames, { error: "Escolha um ícone da lista." }),
    status: z.enum(dashboardModuleStatusValues, { error: "Status inválido." }),
};

/** Criação: status opcional, com padrão AVAILABLE (Disponível). */
export const createDashboardModuleSchema = z.object({
    ...dashboardModuleFields,
    status: dashboardModuleFields.status.default("AVAILABLE"),
});

/** Atualização parcial (PATCH): todos opcionais e SEM padrão (R7). */
export const updateDashboardModuleSchema = z
    .object(dashboardModuleFields)
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        error: "Informe ao menos um campo para atualizar.",
    });

export type CreateDashboardModuleInput = z.output<typeof createDashboardModuleSchema>;
export type UpdateDashboardModuleInput = z.output<typeof updateDashboardModuleSchema>;
