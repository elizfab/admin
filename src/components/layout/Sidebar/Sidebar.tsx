"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";

import { navigationItems } from "./navigation";
import styles from "./Sidebar.module.scss";

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className={styles.sidebar}>
            <div className={styles.brand}>
                <span className={styles.brandMark} aria-hidden="true">
                    A
                </span>
                <span className={styles.label}>Admin</span>
            </div>

            <nav aria-label="Navegação principal">
                <ul className={styles.list}>
                    {navigationItems.map(({ label, href, icon: Icon }) => {
                        const isActive = pathname.startsWith(href);

                        return (
                            <li key={href}>
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
                    })}
                </ul>
            </nav>
        </aside>
    );
}
