import styles from "./Header.module.scss";
import { UserMenu } from "./UserMenu";

type HeaderProps = {
    userName: string;
};

export function Header({ userName }: HeaderProps) {
    return (
        <header className={styles.header}>
            <p className={styles.greeting}>Painel administrativo</p>
            <UserMenu userName={userName} />
        </header>
    );
}
