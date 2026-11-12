import { Header } from "@/components/layout/Header/Header";
import { Sidebar } from "@/components/layout/Sidebar/Sidebar";
import { requireSession } from "@/lib/auth/session";

import styles from "./layout.module.scss";

// Layout das áreas autenticadas.
// requireSession() valida a sessão NO SERVIDOR e redireciona para /login se não houver.
// Isso protege a navegação; cada operação de dados continua verificando a sessão.
export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
    const session = await requireSession();

    return (
        <div className={styles.shell}>
            <Sidebar />
            <div className={styles.content}>
                <Header userName={session.user.name} />
                <main className={styles.main}>{children}</main>
            </div>
        </div>
    );
}
