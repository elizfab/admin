"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, buttonClassName } from "@/components/ui/Button/Button";
import { centsToInput } from "@/lib/money/money";
import { dayToInput } from "@/lib/dates/month";

import type { FormState } from "../../actions/project.actions";
import {
    constructionTradeValues,
    paymentMethodValues,
} from "../../schemas/construction.schema";
import {
    paymentMethodLabel,
    tradeLabel,
    type ConstructionTrade,
    type PaymentMethod,
} from "../../types/construction.types";
import styles from "./ConstructionForms.module.scss";

// ─── Formulário de serviço contratado ─────────────────────────

export type ServiceFormValues = {
    phaseId: string;
    areaId: string;
    trade: string;
    professionalName: string;
    description: string;
    contractedCents: string;
    notes: string;
};

type ServiceFormProps = {
    action: (state: FormState, formData: FormData) => Promise<FormState>;
    projectId: string;
    phases: { id: string; number: number; name: string | null }[];
    areas: { id: string; name: string }[];
    /** Serviço em edição (valores iniciais). */
    service?: {
        phaseId: string;
        areaId: string | null;
        trade: ConstructionTrade;
        professionalName: string | null;
        description: string;
        contractedCents: number;
        notes: string | null;
    };
    defaults?: Partial<ServiceFormValues>;
    cancelHref: string;
    submitLabel: string;
};

export function ServiceForm({
    action,
    phases,
    areas,
    service,
    defaults,
    cancelHref,
    submitLabel,
}: ServiceFormProps) {
    const [state, formAction, pending] = useActionState(action, null);
    const errors = state?.fieldErrors;
    const values: ServiceFormValues = {
        phaseId: service?.phaseId ?? defaults?.phaseId ?? phases[0]?.id ?? "",
        areaId: service?.areaId ?? defaults?.areaId ?? "",
        trade: service?.trade ?? defaults?.trade ?? "MASON",
        professionalName: service?.professionalName ?? defaults?.professionalName ?? "",
        description: service?.description ?? defaults?.description ?? "",
        contractedCents: service ? centsToInput(service.contractedCents) : (defaults?.contractedCents ?? ""),
        notes: service?.notes ?? defaults?.notes ?? "",
    };

    return (
        <form action={formAction} className={styles.form} noValidate>
            {state?.message && (
                <p className={styles.formError} role="alert">
                    {state.message}
                </p>
            )}

            <div className={styles.row}>
                <div className={styles.field}>
                    <label htmlFor="phaseId">Fase *</label>
                    <select
                        id="phaseId"
                        name="phaseId"
                        defaultValue={values.phaseId}
                        required
                        aria-invalid={Boolean(errors?.phaseId)}
                    >
                        {phases.map((phase) => (
                            <option key={phase.id} value={phase.id}>
                                Fase {String(phase.number).padStart(2, "0")}
                                {phase.name ? ` — ${phase.name}` : ""}
                            </option>
                        ))}
                    </select>
                    {errors?.phaseId && <p className={styles.fieldError}>{errors.phaseId[0]}</p>}
                </div>

                <div className={styles.field}>
                    <label htmlFor="areaId">Ambiente</label>
                    <select id="areaId" name="areaId" defaultValue={values.areaId}>
                        <option value="">Nenhum</option>
                        {areas.map((area) => (
                            <option key={area.id} value={area.id}>
                                {area.name}
                            </option>
                        ))}
                    </select>
                    {errors?.areaId && <p className={styles.fieldError}>{errors.areaId[0]}</p>}
                </div>
            </div>

            <div className={styles.row}>
                <div className={styles.field}>
                    <label htmlFor="trade">Profissão *</label>
                    <select id="trade" name="trade" defaultValue={values.trade} required>
                        {constructionTradeValues.map((trade) => (
                            <option key={trade} value={trade}>
                                {tradeLabel[trade as ConstructionTrade]}
                            </option>
                        ))}
                    </select>
                    {errors?.trade && <p className={styles.fieldError}>{errors.trade[0]}</p>}
                </div>

                <div className={styles.field}>
                    <label htmlFor="professionalName">Profissional</label>
                    <input
                        id="professionalName"
                        name="professionalName"
                        defaultValue={values.professionalName}
                        maxLength={80}
                    />
                </div>
            </div>

            <div className={styles.field}>
                <label htmlFor="description">Descrição do serviço *</label>
                <input
                    id="description"
                    name="description"
                    defaultValue={values.description}
                    required
                    minLength={2}
                    maxLength={120}
                    aria-invalid={Boolean(errors?.description)}
                    aria-describedby={errors?.description ? "description-error" : undefined}
                />
                {errors?.description && (
                    <p id="description-error" className={styles.fieldError}>
                        {errors.description[0]}
                    </p>
                )}
            </div>

            <div className={styles.field}>
                <label htmlFor="contractedCents">Valor contratado (R$) *</label>
                <input
                    id="contractedCents"
                    name="contractedCents"
                    inputMode="decimal"
                    placeholder="0,00"
                    defaultValue={values.contractedCents}
                    required
                    aria-invalid={Boolean(errors?.contractedCents)}
                    aria-describedby={errors?.contractedCents ? "contractedCents-error" : undefined}
                />
                {errors?.contractedCents && (
                    <p id="contractedCents-error" className={styles.fieldError}>
                        {errors.contractedCents[0]}
                    </p>
                )}
            </div>

            <div className={styles.field}>
                <label htmlFor="notes">Observações</label>
                <textarea id="notes" name="notes" rows={3} maxLength={500} defaultValue={values.notes} />
            </div>

            <div className={styles.actions}>
                <Link href={cancelHref} className={buttonClassName("secondary")}>
                    Cancelar
                </Link>
                <Button type="submit" disabled={pending}>
                    {pending ? "Salvando…" : submitLabel}
                </Button>
            </div>
        </form>
    );
}

// ─── Formulário de pagamento de serviço ───────────────────────

export type PaymentServiceOption = {
    id: string;
    label: string;
    professionalName: string | null;
    contractedCents: number;
    paidCents: number;
    remainingCents: number;
};

type PaymentFormProps = {
    action: (state: FormState, formData: FormData) => Promise<FormState>;
    /** Serviços NÃO quitados da obra (o servidor já filtrou). */
    services: PaymentServiceOption[];
    /** ?serviceId= pré-selecionado. */
    selectedServiceId?: string;
    cancelHref: string;
};

export function PaymentForm({ action, services, selectedServiceId, cancelHref }: PaymentFormProps) {
    const [state, formAction, pending] = useActionState(action, null);
    const errors = state?.fieldErrors;
    const first = services.find((s) => s.id === selectedServiceId) ?? services[0];

    return (
        <form action={formAction} className={styles.form} noValidate>
            {state?.message && (
                <p className={styles.formError} role="alert">
                    {state.message}
                </p>
            )}

            <div className={styles.field}>
                <label htmlFor="serviceId">Serviço *</label>
                <select id="serviceId" name="serviceId" defaultValue={first?.id ?? ""} required>
                    {services.map((service) => (
                        <option key={service.id} value={service.id}>
                            {service.label}
                        </option>
                    ))}
                </select>
                {errors?.serviceId && <p className={styles.fieldError}>{errors.serviceId[0]}</p>}
            </div>

            <div className={styles.field}>
                <label htmlFor="paidOn">Data do pagamento *</label>
                <input
                    id="paidOn"
                    name="paidOn"
                    type="date"
                    defaultValue={dayToInput(new Date())}
                    required
                    aria-invalid={Boolean(errors?.paidOn)}
                />
                {errors?.paidOn && <p className={styles.fieldError}>{errors.paidOn[0]}</p>}
            </div>

            <div className={styles.row}>
                <div className={styles.field}>
                    <label htmlFor="amountCents">Valor pago (R$) *</label>
                    <input
                        id="amountCents"
                        name="amountCents"
                        inputMode="decimal"
                        placeholder="0,00"
                        required
                        aria-invalid={Boolean(errors?.amountCents)}
                        aria-describedby={errors?.amountCents ? "amountCents-error" : undefined}
                    />
                    {errors?.amountCents && (
                        <p id="amountCents-error" className={styles.fieldError}>
                            {errors.amountCents[0]}
                        </p>
                    )}
                </div>

                <div className={styles.field}>
                    <label htmlFor="method">Forma de pagamento *</label>
                    <select id="method" name="method" defaultValue="PIX">
                        {paymentMethodValues.map((method) => (
                            <option key={method} value={method}>
                                {paymentMethodLabel[method as PaymentMethod]}
                            </option>
                        ))}
                    </select>
                    {errors?.method && <p className={styles.fieldError}>{errors.method[0]}</p>}
                </div>
            </div>

            <div className={styles.field}>
                <label htmlFor="notes">Observações</label>
                <textarea id="notes" name="notes" rows={3} maxLength={500} />
            </div>

            <div className={styles.actions}>
                <Link href={cancelHref} className={buttonClassName("secondary")}>
                    Cancelar
                </Link>
                <Button type="submit" disabled={pending || services.length === 0}>
                    {pending ? "Salvando…" : "Registrar pagamento"}
                </Button>
            </div>
        </form>
    );
}

// ─── Formulário de compra de material ─────────────────────────

export type PurchaseFormProps = {
    action: (state: FormState, formData: FormData) => Promise<FormState>;
    areas: { id: string; name: string }[];
    defaultDate: string;
    cancelHref: string;
};

export function PurchaseForm({ action, areas, defaultDate, cancelHref }: PurchaseFormProps) {
    const [state, formAction, pending] = useActionState(action, null);
    const errors = state?.fieldErrors;

    return (
        <form action={formAction} className={styles.form} noValidate>
            {state?.message && (
                <p className={styles.formError} role="alert">
                    {state.message}
                </p>
            )}

            <div className={styles.field}>
                <label htmlFor="item">Item / material *</label>
                <input id="item" name="item" required maxLength={120} aria-invalid={Boolean(errors?.item)} />
                {errors?.item && <p className={styles.fieldError}>{errors.item[0]}</p>}
            </div>

            <div className={styles.row}>
                <div className={styles.field}>
                    <label htmlFor="areaId">Ambiente</label>
                    <select id="areaId" name="areaId" defaultValue="">
                        <option value="">Nenhum</option>
                        {areas.map((area) => (
                            <option key={area.id} value={area.id}>
                                {area.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={styles.field}>
                    <label htmlFor="supplier">Fornecedor / loja</label>
                    <input id="supplier" name="supplier" maxLength={80} />
                </div>
            </div>

            <div className={styles.row}>
                <div className={styles.field}>
                    <label htmlFor="purchasedOn">Data de compra *</label>
                    <input
                        id="purchasedOn"
                        name="purchasedOn"
                        type="date"
                        defaultValue={defaultDate}
                        required
                        aria-invalid={Boolean(errors?.purchasedOn)}
                    />
                    {errors?.purchasedOn && <p className={styles.fieldError}>{errors.purchasedOn[0]}</p>}
                </div>
                <div className={styles.field}>
                    <label htmlFor="totalCents">Valor total (R$) *</label>
                    <input
                        id="totalCents"
                        name="totalCents"
                        inputMode="decimal"
                        placeholder="0,00"
                        required
                        aria-invalid={Boolean(errors?.totalCents)}
                    />
                    {errors?.totalCents && <p className={styles.fieldError}>{errors.totalCents[0]}</p>}
                </div>
            </div>

            <div className={styles.row}>
                <div className={styles.field}>
                    <label htmlFor="method">Forma de pagamento *</label>
                    <select id="method" name="method" defaultValue="PIX">
                        {paymentMethodValues.map((method) => (
                            <option key={method} value={method}>
                                {paymentMethodLabel[method as PaymentMethod]}
                            </option>
                        ))}
                    </select>
                    {errors?.method && <p className={styles.fieldError}>{errors.method[0]}</p>}
                </div>
                <div className={styles.field}>
                    <label htmlFor="installmentsCount">Parcelas *</label>
                    <input
                        id="installmentsCount"
                        name="installmentsCount"
                        type="number"
                        min={1}
                        max={24}
                        defaultValue={1}
                        required
                        aria-invalid={Boolean(errors?.installmentsCount)}
                    />
                    {errors?.installmentsCount && (
                        <p className={styles.fieldError}>{errors.installmentsCount[0]}</p>
                    )}
                </div>
            </div>

            <div className={styles.field}>
                <label htmlFor="firstDueOn">1º vencimento</label>
                <input id="firstDueOn" name="firstDueOn" type="date" />
                <p className={styles.hint}>Pix, dinheiro, débito e transferência são sempre 1x.</p>
                {errors?.firstDueOn && <p className={styles.fieldError}>{errors.firstDueOn[0]}</p>}
            </div>

            <div className={styles.field}>
                <label htmlFor="notes">Observações</label>
                <textarea id="notes" name="notes" rows={3} maxLength={500} />
            </div>

            <div className={styles.actions}>
                <Link href={cancelHref} className={buttonClassName("secondary")}>
                    Cancelar
                </Link>
                <Button type="submit" disabled={pending}>
                    {pending ? "Salvando…" : "Salvar compra"}
                </Button>
            </div>
        </form>
    );
}
