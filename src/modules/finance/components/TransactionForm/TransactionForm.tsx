"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Button, buttonClassName } from "@/components/ui/Button/Button";
import { dayToInput } from "@/lib/dates/month";
import { centsToInput } from "@/lib/money/money";
import { noopAction } from "@/lib/utils/noop-action";

import type { TransactionFormState } from "../../actions/transaction.actions";
import { transactionCategoryValues, transactionTypeValues } from "../../schemas/transaction.schema";
import {
    transactionCategoryLabel,
    transactionTypeLabel,
    type Transaction,
} from "../../types/transaction.types";
import {
    ConstructionPaymentFields,
    type ObraPaymentProject,
} from "@/modules/construction/components/ConstructionPaymentFields/ConstructionPaymentFields";
import type { FormState as ObraFormState } from "@/modules/construction/actions/project.actions";
import styles from "./TransactionForm.module.scss";

type TransactionFormProps = {
    action: (state: TransactionFormState, formData: FormData) => Promise<TransactionFormState>;
    /**
     * Fase 09 — atalho "Construção": presente só em "Nova transação". Quando a
     * categoria escolhida é CONSTRUCTION ("Construção"), o formulário troca os
     * campos pelos da obra e o submit vai para `constructionAction`.
     */
    obraProjects?: ObraPaymentProject[];
    constructionAction?: (state: ObraFormState, formData: FormData) => Promise<ObraFormState>;
    transaction?: Pick<
        Transaction,
        "type" | "description" | "amountCents" | "category" | "occurredOn"
    >;
    /** Data inicial ("AAAA-MM-DD") quando é uma transação nova. */
    defaultDate: string;
    cancelHref: string;
    submitLabel: string;
};

export function TransactionForm({
    action,
    obraProjects,
    constructionAction,
    transaction,
    defaultDate,
    cancelHref,
    submitLabel,
}: TransactionFormProps) {
    const [state, formAction, pending] = useActionState(action, null);
    // Sem obras na página, o hook recebe uma action vazia estável (hooks não podem ser condicionais).
    const [obraState, obraFormAction, obraPending] = useActionState<ObraFormState, FormData>(
        constructionAction ?? noopAction,
        null,
    );
    const [isObra, setIsObra] = useState(false);
    // "Construção" (pagamento de obra) é opção SÓ do formulário (não entra em transactionCategoryValues,
    // que é o contrato da API): escolher ela troca os campos e a action.
    const OBRA_VALUE = "__OBRA_PAYMENT__";
    const errors = state?.fieldErrors;
    const obraErrors = obraState?.fieldErrors;
    // Depois de um erro, mostra o que foi enviado; senão, os dados atuais (edição).
    const values = state?.values ?? {
        type: transaction?.type ?? "EXPENSE",
        description: transaction?.description ?? "",
        amountCents: transaction ? centsToInput(transaction.amountCents) : "",
        category: transaction?.category ?? "OTHER",
        occurredOn: transaction ? dayToInput(transaction.occurredOn) : defaultDate,
    };

    return (
        <form action={formAction} className={styles.form} noValidate>
            {state?.message && (
                <p className={styles.formError} role="alert">
                    {state.message}
                </p>
            )}

            {/* fieldset + legend: o leitor de tela anuncia "Tipo" ao entrar nas opções. */}
            {!isObra && (
                <fieldset className={styles.field}>
                    <legend>Tipo *</legend>
                    <div className={styles.radioGroup}>
                        {transactionTypeValues.map((type) => (
                            <label key={type} className={styles.radio}>
                                <input
                                    type="radio"
                                    name="type"
                                    value={type}
                                    defaultChecked={values.type === type}
                                />
                                {transactionTypeLabel[type]}
                            </label>
                        ))}
                    </div>
                    {errors?.type && <p className={styles.fieldError}>{errors.type[0]}</p>}
                </fieldset>
            )}

            {!isObra && (
                <>
                    <div className={styles.field}>
                        <label htmlFor="description">Descrição *</label>
                        <input
                            id="description"
                            name="description"
                            defaultValue={values.description}
                            required
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

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label htmlFor="amountCents">Valor (R$) *</label>
                            {/* text + inputMode: aceita "1.234,56" e abre o teclado numérico no celular. */}
                            <input
                                id="amountCents"
                                name="amountCents"
                                inputMode="decimal"
                                placeholder="0,00"
                                defaultValue={values.amountCents}
                                required
                                aria-invalid={Boolean(errors?.amountCents)}
                                aria-describedby={
                                    errors?.amountCents ? "amountCents-error" : undefined
                                }
                            />
                            {errors?.amountCents && (
                                <p id="amountCents-error" className={styles.fieldError}>
                                    {errors.amountCents[0]}
                                </p>
                            )}
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="occurredOn">Data *</label>
                            <input
                                id="occurredOn"
                                name="occurredOn"
                                type="date"
                                defaultValue={values.occurredOn}
                                required
                                aria-invalid={Boolean(errors?.occurredOn)}
                                aria-describedby={
                                    errors?.occurredOn ? "occurredOn-error" : undefined
                                }
                            />
                            {errors?.occurredOn && (
                                <p id="occurredOn-error" className={styles.fieldError}>
                                    {errors.occurredOn[0]}
                                </p>
                            )}
                        </div>
                    </div>
                </>
            )}

            <div className={styles.field}>
                <label htmlFor="category">Categoria</label>
                <select
                    id="category"
                    name="category"
                    defaultValue={values.category}
                    onChange={(event) => setIsObra(event.target.value === OBRA_VALUE)}
                >
                    {transactionCategoryValues.map((category) => (
                        <option key={category} value={category}>
                            {transactionCategoryLabel[category]}
                        </option>
                    ))}
                    {obraProjects && (
                        <option value={OBRA_VALUE}>{transactionCategoryLabel.CONSTRUCTION}</option>
                    )}
                </select>
            </div>

            {isObra && obraProjects && (
                <ConstructionPaymentFields
                    projects={obraProjects}
                    errors={obraErrors}
                    message={obraState?.message}
                />
            )}

            <div className={styles.actions}>
                <Link href={cancelHref} className={buttonClassName("secondary")}>
                    Cancelar
                </Link>
                {isObra && constructionAction ? (
                    <Button type="submit" formAction={obraFormAction} disabled={obraPending}>
                        {obraPending ? "Salvando…" : "Registrar pagamento"}
                    </Button>
                ) : (
                    <Button type="submit" disabled={pending}>
                        {pending ? "Salvando…" : submitLabel}
                    </Button>
                )}
            </div>
        </form>
    );
}
