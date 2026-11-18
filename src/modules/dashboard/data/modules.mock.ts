import { BookOpen, Wallet } from "lucide-react";

import type { DashboardModule } from "../types/dashboard.types";

// Dados mockados: serão substituídos por dados do servidor nas próximas fases.
export const dashboardModulesMock: DashboardModule[] = [
    {
        id: "documentation",
        title: "Documentação",
        description: "Acesso ao portal de documentação.",
        href: "/documentation",
        icon: BookOpen,
        status: "external",
    },
    {
        id: "finance",
        title: "Financeiro",
        description: "Receitas, despesas, saldo e obra.",
        href: "/finance",
        icon: Wallet,
        status: "soon",
    },
];
