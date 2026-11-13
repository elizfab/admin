import type { Project, ProjectStatus } from "@/generated/prisma/client";

// O módulo expõe seus próprios tipos; quem usa não importa do Prisma diretamente.
export type { Project, ProjectStatus };

export const projectStatusLabel: Record<ProjectStatus, string> = {
    PLANNED: "Planejado",
    IN_PROGRESS: "Em andamento",
    PAUSED: "Pausado",
    DONE: "Concluído",
};
