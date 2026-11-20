import styles from "./Header.module.scss";
import type { HeaderProps } from "./Header.types";
import { ThemeToggle } from "./ThemeToggle/ThemeToggle";
import { UserMenu } from "./UserMenu/UserMenu";

/** Barra do topo da área privada: só monta o layout; cada ação é um componente. */
export function Header({ userName }: HeaderProps) {
    return (
        <header className={styles.header}>
            <p className={styles.greeting}>Painel administrativo</p>
            <div className={styles.actions}>
                <ThemeToggle />
                <UserMenu userName={userName} />
            </div>
        </header>
    );
}
