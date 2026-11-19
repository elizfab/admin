import type { DashboardModule, DashboardModuleStatus } from "@/generated/prisma/client";

// O módulo expõe seus próprios tipos; quem usa não importa do Prisma diretamente.
export type { DashboardModule, DashboardModuleStatus };

/**
 * Texto em português de cada status. O banco e a API guardam a chave em inglês
 * (AVAILABLE, EXTERNAL, SOON); a tela mostra este rótulo.
 */
export const dashboardModuleStatusLabel: Record<DashboardModuleStatus, string> = {
    AVAILABLE: "Disponível",
    EXTERNAL: "Aplicação externa",
    SOON: "Em breve",
};
