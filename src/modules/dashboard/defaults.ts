import type { CreateDashboardModuleInput } from "./schemas/dashboard-module.schema";

/**
 * Cards iniciais de toda conta nova (prisma/seed.ts). São os do antigo modules.mock.ts;
 * as contas que já existiam receberam os mesmos pela migration add_dashboard_modules.
 */
export const defaultDashboardModules: CreateDashboardModuleInput[] = [
    {
        slug: "documentation",
        title: "Portal de Documentação Dev",
        description:
            "Acesso ao portal de documentação. Para desenvolvedores e interessados em conhecer a aplicação.",
        href: "/documentation",
        icon: "BookOpen",
        status: "EXTERNAL",
    },
    {
        slug: "finance",
        title: "Portal Financeiro",
        description: "Receitas, despesas, saldo e obra.",
        href: "/finance",
        icon: "Wallet",
        status: "SOON",
    },
    {
        slug: "studies",
        title: "Portal de Estudos",
        description: "Recursos e materiais para estudo.",
        href: "/studies",
        icon: "BookOpen",
        status: "SOON",
    },
];
