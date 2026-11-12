import {
    BadgeDollarSign,
    LayoutDashboard,
    NotebookPen,
    type LucideIcon
} from "lucide-react";

export type NavigationItem = {
    label: string;
    href: string;
    icon: LucideIcon;
};

export const navigationItems: NavigationItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Estudos", href: "/studies", icon: NotebookPen },
    { label: "Financeiro", href: "/finance", icon: BadgeDollarSign },
];
