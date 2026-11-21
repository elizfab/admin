import { FilePenLine, LayoutDashboard, PiggyBank, type LucideIcon } from "lucide-react";

/**
 * Ícones que um card pode usar. O banco guarda só o NOME (ex.: "BookOpen");
 * o componente vem deste mapa. Ícone novo = uma linha aqui.
 */
export const dashboardIcons = {
    FilePenLine: { icon: FilePenLine, label: "Livro com caneta" },
    LayoutDashboard: { icon: LayoutDashboard, label: "Painel" },
    PiggyBank: { icon: PiggyBank, label: "Poupança" },
} satisfies Record<string, { icon: LucideIcon; label: string }>;

export type DashboardIconName = keyof typeof dashboardIcons;

export const dashboardIconNames = Object.keys(dashboardIcons) as [
    DashboardIconName,
    ...DashboardIconName[],
];

/** Componente do ícone pelo nome guardado; nome desconhecido (dado antigo) usa o ícone de painel. */
export function getDashboardIcon(name: string): LucideIcon {
    return dashboardIcons[name as DashboardIconName]?.icon ?? LayoutDashboard;
}
