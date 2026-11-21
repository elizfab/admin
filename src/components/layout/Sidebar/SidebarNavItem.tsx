"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";

import type { NavigationItem } from "./navigation";
import styles from "./Sidebar.module.scss";

/**
 * Item de navegação da sidebar — ÚNICO lugar com a regra de item ativo:
 * aria-current="page" só no item cuja rota é a atual (ETAPA 04).
 */
export function SidebarNavItem({ label, href, icon: Icon }: NavigationItem) {
    const pathname = usePathname();
    const isActive = pathname.startsWith(href);

    return (
        <li>
            <Link
                href={href}
                className={cn(styles.item, isActive && styles.itemActive)}
                aria-current={isActive ? "page" : undefined}
            >
                <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                <span className={styles.label}>{label}</span>
            </Link>
        </li>
    );
}
