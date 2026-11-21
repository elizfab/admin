import { FilePenLine, LayoutDashboard, PiggyBank, type LucideIcon } from "lucide-react";

export type NavigationItem = {
    label: string;
    href: string;
    icon: LucideIcon;
};

export const navigationItems: NavigationItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Portal Dev", href: "/documentation", icon: FilePenLine },
    { label: "Financeiro", href: "/finance", icon: PiggyBank },
];
