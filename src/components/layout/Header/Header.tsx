import styles from "./Header.module.scss";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

type HeaderProps = {
    userName: string;
};

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
