import type { LucideIcon } from "lucide-react";

export type ModuleStatus = "available" | "external" | "soon";

export type DashboardModule = {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    status: ModuleStatus;
};
