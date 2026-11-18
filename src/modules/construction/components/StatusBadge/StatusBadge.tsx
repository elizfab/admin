import type { PurchaseStatus, ServiceStatus } from "../../rules/construction.rules";
import { purchaseStatusLabel, serviceStatusLabel } from "../../types/construction.types";
import styles from "./StatusBadge.module.scss";

const toneOf: Record<ServiceStatus | PurchaseStatus, "paid" | "partial" | "pending"> = {
    PAID: "paid",
    PARTIAL: "partial",
    INSTALLMENTS: "partial",
    PENDING: "pending",
};

/**
 * Selo de status com cor E texto (a cor nunca é a única pista).
 * Fundo translúcido na cor do status, via color-mix sobre tokens do tema.
 */
export function StatusBadge({ status }: { status: ServiceStatus | PurchaseStatus }) {
    // "PENDING"/"PAID" existem nos dois conjuntos; PARTIAL é de serviço e
    // INSTALLMENTS é de compra — os rótulos são disjuntos por valor.
    const text =
        status === "PARTIAL"
            ? serviceStatusLabel.PARTIAL
            : status === "INSTALLMENTS"
              ? purchaseStatusLabel.INSTALLMENTS
              : status === "PENDING"
                ? serviceStatusLabel.PENDING
                : serviceStatusLabel.PAID;

    return <span className={`${styles.badge} ${styles[toneOf[status]]}`}>{text}</span>;
}
