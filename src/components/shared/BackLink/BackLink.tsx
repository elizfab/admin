import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils/cn";

import styles from "./BackLink.module.scss";

type BackLinkProps = {
    /** Destino; padrão: o Dashboard (início do portal). */
    href?: string;
    label?: string;
    /** Classe extra (ex.: alinhar o link numa barra de ações). */
    className?: string;
};

/** "Voltar ao início" das páginas de módulo (PLAT-R16). */
export function BackLink({
    href = "/dashboard",
    label = "Voltar ao início",
    className,
}: BackLinkProps) {
    return (
        <Link href={href} className={cn(styles.backLink, className)}>
            <ArrowLeft size={16} aria-hidden="true" />
            {label}
        </Link>
    );
}
