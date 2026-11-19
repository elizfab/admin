"use client";

import { useMemo, useState } from "react";

import { dayToInput } from "@/lib/dates/month";
import { formatCents } from "@/lib/money/money";

import { paymentMethodValues, constructionTradeValues } from "../../schemas/construction.schema";
import {
    paymentMethodLabel,
    tradeLabel,
    type ConstructionTrade,
    type PaymentMethod,
    type ServiceSummary,
} from "../../types/construction.types";
import styles from "../ConstructionForms/ConstructionForms.module.scss";

/** Obra + ambientes + fases + serviços NÃO quitados, já filtrados no servidor. */
export type ObraPaymentProject = {
    projectId: string;
    projectName: string;
    areas: { id: string; name: string }[];
    phases: { id: string; number: number; name: string | null }[];
    services: ServiceSummary[];
};

type Props = {
    projects: ObraPaymentProject[];
    /** Erros devolvidos pela action (fieldErrors/ message). */
    errors?: Record<string, string[] | undefined> | undefined;
    message?: string | undefined;
};

/**
 * Selects encadeados do atalho "Nova transação → Obra" (Fase 09):
 * Obra · Ambiente → Fase → Profissão → Serviço, com o card do serviço
 * (contratado / pago / falta) anunciado por aria-live.
 */
export function ConstructionPaymentFields({ projects, errors, message }: Props) {
    const [scope, setScope] = useState("");
    const [phaseId, setPhaseId] = useState("");
    const [trade, setTrade] = useState("");
    const [serviceId, setServiceId] = useState("");

    const project = projects.find(
        (p) => scope === p.projectId || scope.startsWith(`${p.projectId}|`),
    );
    const areaId = scope.includes("|") ? scope.split("|")[1] : null;

    const scopedServices = useMemo(
        () =>
            (project?.services ?? []).filter(
                (service) =>
                    service.remainingCents > 0 &&
                    (!areaId || service.areaId === areaId || service.areaId === null),
            ),
        [project, areaId],
    );

    const phases = useMemo(() => {
        const ids = new Set(scopedServices.map((s) => s.phaseId));
        return (project?.phases ?? []).filter((phase) => ids.has(phase.id));
    }, [project, scopedServices]);

    const phaseServices = phaseId
        ? scopedServices.filter((s) => s.phaseId === phaseId)
        : scopedServices;

    const trades = useMemo(() => {
        const set = new Set(phaseServices.map((s) => s.trade));
        return constructionTradeValues.filter((t) => set.has(t as ConstructionTrade));
    }, [phaseServices]);

    const tradeServices = trade ? phaseServices.filter((s) => s.trade === trade) : phaseServices;
    const service = tradeServices.find((s) => s.id === serviceId) ?? null;

    return (
        <fieldset className={styles.field}>
            <legend>Pagamento da obra</legend>

            {message && (
                <p className={styles.formError} role="alert">
                    {message}
                </p>
            )}

            <div className={styles.row}>
                <div className={styles.field}>
                    <label htmlFor="obra-scope">Obra · Ambiente *</label>
                    <select
                        id="obra-scope"
                        value={scope}
                        onChange={(event) => {
                            setScope(event.target.value);
                            setPhaseId("");
                            setTrade("");
                            setServiceId("");
                        }}
                        required
                    >
                        <option value="">Escolha…</option>
                        {projects.map((p) => (
                            <optgroup key={p.projectId} label={p.projectName}>
                                <option value={p.projectId}>
                                    {p.projectName} (todos os ambientes)
                                </option>
                                {p.areas.map((area) => (
                                    <option key={area.id} value={`${p.projectId}|${area.id}`}>
                                        {p.projectName} · {area.name}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>

                <div className={styles.field}>
                    <label htmlFor="obra-phase">Fase</label>
                    <select
                        id="obra-phase"
                        value={phaseId}
                        onChange={(event) => {
                            setPhaseId(event.target.value);
                            setTrade("");
                            setServiceId("");
                        }}
                        disabled={!project}
                    >
                        <option value="">Todas as fases</option>
                        {phases.map((phase) => (
                            <option key={phase.id} value={phase.id}>
                                Fase {String(phase.number).padStart(2, "0")}
                                {phase.name ? ` — ${phase.name}` : ""}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.row}>
                <div className={styles.field}>
                    <label htmlFor="obra-trade">Profissão</label>
                    <select
                        id="obra-trade"
                        value={trade}
                        onChange={(event) => {
                            setTrade(event.target.value);
                            setServiceId("");
                        }}
                        disabled={trades.length === 0}
                    >
                        <option value="">Todas as profissões</option>
                        {trades.map((t) => (
                            <option key={t} value={t}>
                                {tradeLabel[t as ConstructionTrade]}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.field}>
                    <label htmlFor="serviceId">Serviço *</label>
                    <select
                        id="serviceId"
                        name="serviceId"
                        value={serviceId}
                        onChange={(event) => setServiceId(event.target.value)}
                        required
                        disabled={tradeServices.length === 0}
                        aria-invalid={Boolean(errors?.serviceId)}
                    >
                        <option value="">Escolha…</option>
                        {tradeServices.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                    {errors?.serviceId && (
                        <p className={styles.fieldError}>{errors.serviceId[0]}</p>
                    )}
                    {project && tradeServices.length === 0 && (
                        <p className={styles.hint}>
                            Nenhum serviço a pagar nesta seleção.{" "}
                            <a href={`/finance/construction/${project.projectId}/services/new`}>
                                Cadastrar serviço
                            </a>
                        </p>
                    )}
                </div>
            </div>

            {/* aria-live: o leitor de tela anuncia o card quando o serviço muda. */}
            <div aria-live="polite">
                {service && (
                    <dl className={styles.serviceCard}>
                        <div>
                            <dt>Contratado</dt>
                            <dd>{formatCents(service.contractedCents)}</dd>
                        </div>
                        <div>
                            <dt>Pago</dt>
                            <dd>{formatCents(service.paidCents)}</dd>
                        </div>
                        <div>
                            <dt>Falta pagar</dt>
                            <dd>{formatCents(service.remainingCents)}</dd>
                        </div>
                    </dl>
                )}
            </div>

            <div className={styles.row}>
                <div className={styles.field}>
                    <label htmlFor="obra-paidOn">Data do pagamento *</label>
                    <input
                        id="obra-paidOn"
                        name="paidOn"
                        type="date"
                        defaultValue={dayToInput(new Date())}
                        required
                        aria-invalid={Boolean(errors?.paidOn)}
                    />
                    {errors?.paidOn && <p className={styles.fieldError}>{errors.paidOn[0]}</p>}
                </div>

                <div className={styles.field}>
                    <label htmlFor="obra-amountCents">Valor pago (R$) *</label>
                    <input
                        id="obra-amountCents"
                        name="amountCents"
                        inputMode="decimal"
                        placeholder="0,00"
                        required
                        aria-invalid={Boolean(errors?.amountCents)}
                        aria-describedby={
                            errors?.amountCents ? "obra-amountCents-error" : undefined
                        }
                    />
                    {errors?.amountCents && (
                        <p id="obra-amountCents-error" className={styles.fieldError}>
                            {errors.amountCents[0]}
                        </p>
                    )}
                </div>

                <div className={styles.field}>
                    <label htmlFor="obra-method">Forma de pagamento *</label>
                    <select id="obra-method" name="method" defaultValue="PIX">
                        {paymentMethodValues.map((method) => (
                            <option key={method} value={method}>
                                {paymentMethodLabel[method as PaymentMethod]}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.field}>
                <label htmlFor="obra-notes">Observações</label>
                <textarea id="obra-notes" name="notes" rows={2} maxLength={500} />
            </div>
        </fieldset>
    );
}
