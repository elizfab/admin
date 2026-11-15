import { SearchX } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { buttonClassName } from "@/components/ui/Button/Button";

import styles from "./not-found.module.scss";

// Página 404 global (notFound() ou URL inexistente).
// Usa <div>, e não <main>: dentro da área privada ela é renderizada
// no <main> do layout privado (validado).
export default function NotFound() {
    return (
        <div className={styles.notFound}>
            <EmptyState
                headingLevel="h1"
                icon={<SearchX size={32} aria-hidden="true" />}
                title="Página não encontrada"
                description="O endereço não existe ou você não tem acesso a este conteúdo."
                action={
                    <Link href="/dashboard" className={buttonClassName("primary")}>
                        Voltar ao dashboard
                    </Link>
                }
            />
        </div>
    );
}
