"use client";

import { useTransition } from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/Button/Button";

import { OBRA_CATEGORIAS, OBRA_GRUPOS } from "../../constants/categories";
import type { FormState } from "../../actions/project.actions";
import { unpayInstallmentAction } from "../../actions/purchase.actions";
import styles from "./ConstructionForms.module.scss";

// ─── Formulário da obra (configuração) ────────────────────────

export function ProjectSettingsForm({
    action,
    project,
}: {
    action: (state: FormState, formData: FormData) => Promise<FormState>;
    project: {
        name: string;
        startDate: string | null;
        plannedEndDate: string | null;
        categoryIds?: string[];
    };
}) {
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
                <label htmlFor="name">Nome da obra *</label>
                <input
                    id="name"
                    name="name"
                    defaultValue={project.name}
                    required
                    maxLength={80}
                    aria-invalid={Boolean(errors?.name)}
                />
                {errors?.name && <p className={styles.fieldError}>{errors.name[0]}</p>}
            </div>

            <div className={styles.row}>
                <div className={styles.field}>
                    <label htmlFor="startDate">Início</label>
                    <input
                        id="startDate"
                        name="startDate"
                        type="date"
                        defaultValue={project.startDate ?? ""}
                    />
                </div>
                <div className={styles.field}>
                    <label htmlFor="plannedEndDate">Fim previsto</label>
                    <input
                        id="plannedEndDate"
                        name="plannedEndDate"
                        type="date"
                        defaultValue={project.plannedEndDate ?? ""}
                    />
                    {errors?.plannedEndDate && (
                        <p className={styles.fieldError}>{errors.plannedEndDate[0]}</p>
                    )}
                </div>
            </div>

            <fieldset className={styles.fieldset}>
                <legend className={styles.fieldsetLegend}>Categorias</legend>
                {errors?.categoryIds && (
                    <p className={styles.fieldError}>{errors.categoryIds[0]}</p>
                )}
                {OBRA_GRUPOS.map((grupo) => {
                    const categorias = OBRA_CATEGORIAS.filter((c) => c.grupoId === grupo.id);
                    if (categorias.length === 0) return null;
                    return (
                        <div key={grupo.id} className={styles.categoryGroup}>
                            <span className={styles.categoryGroupLabel}>{grupo.label}</span>
                            {categorias.map((categoria) => (
                                <label key={categoria.id} className={styles.checkbox}>
                                    <input
                                        type="checkbox"
                                        name="categoryIds"
                                        value={categoria.id}
                                        defaultChecked={project.categoryIds?.includes(categoria.id)}
                                    />
                                    {categoria.label}
                                </label>
                            ))}
                        </div>
                    );
                })}
            </fieldset>

            <div className={styles.actions}>
                <Button type="submit" disabled={pending}>
                    {pending ? "Salvando…" : "Salvar obra"}
                </Button>
            </div>
        </form>
    );
}

// ─── Novo ambiente ────────────────────────────────────────────

export function AddAreaForm({
    action,
}: {
    action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
    const [state, formAction, pending] = useActionState(action, null);
    const errors = state?.fieldErrors;

    return (
        <form action={formAction} className={styles.inlineForm} noValidate>
            {state?.message && (
                <p className={styles.formError} role="alert">
                    {state.message}
                </p>
            )}
            <div className={styles.field}>
                <label htmlFor="area-name" className="visually-hidden">
                    Novo ambiente
                </label>
                <input
                    id="area-name"
                    name="name"
                    placeholder="Novo ambiente (ex.: Banheiro)"
                    required
                    maxLength={60}
                    aria-invalid={Boolean(errors?.name)}
                />
                {errors?.name && <p className={styles.fieldError}>{errors.name[0]}</p>}
            </div>
            <Button type="submit" disabled={pending}>
                Adicionar
            </Button>
        </form>
    );
}

// ─── Nova fase ────────────────────────────────────────────────

export function AddPhaseForm({
    action,
    suggestedNumber,
}: {
    action: (state: FormState, formData: FormData) => Promise<FormState>;
    suggestedNumber: number;
}) {
    const [state, formAction, pending] = useActionState(action, null);
    const errors = state?.fieldErrors;

    return (
        <form action={formAction} className={styles.inlineForm} noValidate>
            {state?.message && (
                <p className={styles.formError} role="alert">
                    {state.message}
                </p>
            )}
            <div className={styles.field}>
                <label htmlFor="phase-number" className="visually-hidden">
                    Número da fase
                </label>
                <input
                    id="phase-number"
                    name="number"
                    type="number"
                    min={1}
                    max={99}
                    defaultValue={suggestedNumber}
                    required
                    aria-label="Número da fase"
                    aria-invalid={Boolean(errors?.number)}
                />
            </div>
            <div className={styles.field}>
                <label htmlFor="phase-name" className="visually-hidden">
                    Nome da fase
                </label>
                <input id="phase-name" name="name" placeholder="Nome (opcional)" maxLength={60} />
            </div>
            {errors?.number && <p className={styles.fieldError}>{errors.number[0]}</p>}
            <Button type="submit" disabled={pending}>
                Adicionar fase
            </Button>
        </form>
    );
}

// ─── Nova meta ────────────────────────────────────────────────

export function AddGoalForm({
    action,
    areas,
}: {
    action: (state: FormState, formData: FormData) => Promise<FormState>;
    areas: { id: string; name: string }[];
}) {
    const [state, formAction, pending] = useActionState(action, null);
    const errors = state?.fieldErrors;

    return (
        <form action={formAction} className={styles.inlineForm} noValidate>
            {state?.message && (
                <p className={styles.formError} role="alert">
                    {state.message}
                </p>
            )}
            <div className={styles.field}>
                <label htmlFor="goal-title" className="visually-hidden">
                    Nova meta
                </label>
                <input
                    id="goal-title"
                    name="title"
                    placeholder="Nova meta (ex.: Rebocar todas as paredes)"
                    required
                    maxLength={160}
                    aria-invalid={Boolean(errors?.title)}
                />
                {errors?.title && <p className={styles.fieldError}>{errors.title[0]}</p>}
            </div>
            <div className={styles.field}>
                <label htmlFor="goal-area" className="visually-hidden">
                    Ambiente da meta
                </label>
                <select id="goal-area" name="areaId" defaultValue="">
                    <option value="">Sem ambiente</option>
                    {areas.map((area) => (
                        <option key={area.id} value={area.id}>
                            {area.name}
                        </option>
                    ))}
                </select>
            </div>
            <Button type="submit" disabled={pending}>
                Adicionar meta
            </Button>
        </form>
    );
}

// ─── Pagar / desfazer parcela ─────────────────────────────────

export function PayInstallmentForm({
    action,
    defaultDate,
}: {
    action: (state: FormState, formData: FormData) => Promise<FormState>;
    defaultDate: string;
}) {
    const [state, formAction, pending] = useActionState(action, null);

    return (
        <form action={formAction} className={styles.payForm} noValidate>
            {state?.message && (
                <p className={styles.formError} role="alert">
                    {state.message}
                </p>
            )}
            <input
                type="date"
                name="paidOn"
                defaultValue={defaultDate}
                required
                aria-label="Data do pagamento"
            />
            <Button type="submit" disabled={pending}>
                {pending ? "…" : "Confirmar"}
            </Button>
        </form>
    );
}

// ─── Desfazer pagamento de parcela ────────────────────────────

export function UnpayInstallmentButton({
    installmentId,
    projectId,
}: {
    installmentId: string;
    projectId: string;
}) {
    const [pending, startTransition] = useTransition();

    return (
        <button
            type="button"
            className={styles.undoButton}
            disabled={pending}
            onClick={() =>
                startTransition(() => {
                    void unpayInstallmentAction(installmentId, projectId);
                })
            }
        >
            {pending ? "…" : "Desfazer"}
        </button>
    );
}
