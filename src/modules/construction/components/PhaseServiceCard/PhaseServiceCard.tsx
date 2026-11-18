import Link from "next/link";

import { formatCents } from "@/lib/money/money";

import { formatDay } from "@/lib/dates/month";
import type { ServiceSummary } from "../../types/construction.types";
import { StatusBadge } from "../StatusBadge/StatusBadge";
import styles from "./PhaseServiceCard.module.scss";

type PhaseServiceCardProps = {
    service: ServiceSummary;
    /** Pagamentos do serviço, do MAIS ANTIGO para o mais novo (ordem da planilha). */
    payments: { id: string; paidOn: Date; amountCents: number }[];
    projectId: string;
};

/**
 * Card de um serviço na tela de evolução da fase:
 * tabela de pagamentos com saldo decrescente + total pago / falta / status.
 */
export function PhaseServiceCard({ service, payments, projectId }: PhaseServiceCardProps) {
    const paid = service.status === "PAID";

    // Saldo acumulado na ordem crescente de data (a planilha "desce" o valor).
    const sorted = [...payments].sort((a, b) => a.paidOn.getTime() - b.paidOn.getTime());
    const rows = sorted.map((payment, index) => ({
        ...payment,
        balance: Math.max(
            0,
            service.contractedCents -
                sorted.slice(0, index + 1).reduce((sum, p) => sum + p.amountCents, 0),
        ),
    }));

    const payHref = `/finance/construction/${projectId}/payments/new?serviceId=${service.id}`;

    return (
        <article className={styles.card}>
            <header className={styles.header}>
                <div>
                    <h3 className={styles.title}>{service.label}</h3>
                    <p className={styles.subtitle}>
                        {service.professionalName
                            ? `${service.trade === "OTHER" ? "Profissional" : ""} ${service.professionalName}`.trim()
                            : service.description}
                    </p>
                </div>
                <StatusBadge status={service.status} />
            </header>

            {rows.length > 0 && (
                <table className={styles.payments}>
                    <caption className="visually-hidden">
                        Pagamentos de {service.description}
                    </caption>
                    <thead>
                        <tr>
                            <th scope="col">Data do pagamento</th>
                            <th scope="col">Valor pago</th>
                            <th scope="col">Saldo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id}>
                                <td>{formatDay(row.paidOn)}</td>
                                <td className={styles.money}>{formatCents(row.amountCents)}</td>
                                <td className={styles.money}>{formatCents(row.balance)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <footer className={styles.footer}>
                <dl className={styles.totals}>
                    <div>
                        <dt>Total pago</dt>
                        <dd>{formatCents(service.paidCents)}</dd>
                    </div>
                    <div>
                        <dt>Falta pagar</dt>
                        <dd className={paid ? styles.paid : styles.due}>
                            {formatCents(service.remainingCents)}
                        </dd>
                    </div>
                </dl>
                {!paid && (
                    <Link href={payHref} className={styles.payLink}>
                        Registrar pagamento
                    </Link>
                )}
            </footer>
        </article>
    );
}
