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
        id: "studies",
        title: "Estudos",
        description: "Acesso ao portal de documentação de estudos.",
        href: "/studies",
        icon: BookOpen,
        status: "soon",
    },
    {
        id: "finance",
        title: "Financeiro",
        description: "Receitas, despesas e indicadores.",
        href: "/finance",
        icon: Wallet,
        status: "soon",
    },
];
