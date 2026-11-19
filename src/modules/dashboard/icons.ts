import {
    BookOpen,
    ClipboardList,
    Code,
    FileText,
    FolderKanban,
    GraduationCap,
    Hammer,
    LayoutDashboard,
    Rocket,
    Wallet,
    type LucideIcon,
} from "lucide-react";

/**
 * Ícones que um card pode usar. O banco guarda só o NOME (ex.: "BookOpen");
 * o componente vem deste mapa. Ícone novo = uma linha aqui.
 */
export const dashboardIcons = {
    BookOpen: { icon: BookOpen, label: "Livro" },
    Wallet: { icon: Wallet, label: "Carteira" },
    GraduationCap: { icon: GraduationCap, label: "Estudos" },
    FolderKanban: { icon: FolderKanban, label: "Projetos" },
    Rocket: { icon: Rocket, label: "Foguete" },
    Hammer: { icon: Hammer, label: "Obra" },
    FileText: { icon: FileText, label: "Documento" },
    ClipboardList: { icon: ClipboardList, label: "Lista de tarefas" },
    Code: { icon: Code, label: "Código" },
    LayoutDashboard: { icon: LayoutDashboard, label: "Painel" },
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
