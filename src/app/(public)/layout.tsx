import styles from "./layout.module.scss";

// Layout das páginas públicas (sem sidebar e sem header).
export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return <main className={styles.public}>{children}</main>;
}
