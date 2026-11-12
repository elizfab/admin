import {
    BookOpen,
    FolderKanban,
    LayoutDashboard,
    Target,
    Wallet,
    type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
    label: string;
    href: string;
    icon: LucideIcon;
};

export const navigationItems: NavigationItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Estudos", href: "/studies", icon: BookOpen },
    { label: "Financeiro", href: "/finance", icon: Wallet },
    { label: "PDI", href: "/pdi", icon: Target },
    { label: "Projetos", href: "/projects", icon: FolderKanban },
];
