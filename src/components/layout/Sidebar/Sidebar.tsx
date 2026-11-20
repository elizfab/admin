"use client";

import { navigationItems } from "./navigation";
import { SidebarNavItem } from "./SidebarNavItem";
import styles from "./Sidebar.module.scss";

export function Sidebar() {
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
                    {navigationItems.map((item) => (
                        <SidebarNavItem key={item.href} {...item} />
                    ))}
                </ul>
            </nav>
        </aside>
    );
}
