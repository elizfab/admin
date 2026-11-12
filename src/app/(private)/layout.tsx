import { Header } from "@/components/layout/Header/Header";
import { Sidebar } from "@/components/layout/Sidebar/Sidebar";

import styles from "./layout.module.scss";

// Layout das áreas autenticadas.
// A verificação de sessão será adicionada aqui na fase de autenticação.
export default function PrivateLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={styles.shell}>
            <Sidebar />
            <div className={styles.content}>
                <Header userName="Administradora" />
                <main className={styles.main}>{children}</main>
            </div>
        </div>
    );
}
