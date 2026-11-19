import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import styles from "./BackLink.module.scss";

type BackLinkProps = {
    /** Destino; padrão: o Dashboard (início do portal). */
    href?: string;
    label?: string;
};

/** "Voltar ao início" das páginas de módulo (PLAT-R16). */
export function BackLink({ href = "/dashboard", label = "Voltar ao início" }: BackLinkProps) {
    return (
        <Link href={href} className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden="true" />
            {label}
        </Link>
    );
}
