"use client";

import { Pencil, Plus } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/Dialog/Dialog";

import type {
    DashboardModuleFormState,
    DashboardModuleFormValues,
} from "../../actions/dashboard-module.actions";
import { dashboardIconNames, dashboardIcons } from "../../icons";
import { dashboardModuleStatusValues } from "../../schemas/dashboard-module.schema";
import { dashboardModuleStatusLabel } from "../../types/dashboard.types";
import styles from "./ModuleFormDialog.module.scss";

type Action = (
    state: DashboardModuleFormState,
    formData: FormData,
) => Promise<DashboardModuleFormState>;

type ModuleFormDialogProps = {
    action: Action;
    /** Card a editar; sem ele, o modal cadastra um card novo. */
    module?: DashboardModuleFormValues;
};

const emptyValues: DashboardModuleFormValues = {
    slug: "",
    title: "",
    description: "",
    href: "",
    icon: "LayoutDashboard",
    status: "AVAILABLE",
};

/** Botão + modal com o formulário do card (cadastrar ou editar). */
export function ModuleFormDialog({ action, module }: ModuleFormDialogProps) {
    const [open, setOpen] = useState(false);
    // Muda a cada abertura: o formulário nasce limpo (sem o erro da vez anterior).
    const [formKey, setFormKey] = useState(0);
    const editing = Boolean(module);

    function handleOpenChange(next: boolean) {
        if (next) setFormKey((key) => key + 1);
        setOpen(next);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {editing ? (
                    <Button variant="secondary" aria-label={`Editar o card ${module?.title}`}>
                        <Pencil size={16} aria-hidden="true" />
                    </Button>
                ) : (
                    <Button>
                        <Plus size={16} aria-hidden="true" />
                        Novo card
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent>
                <DialogTitle>{editing ? "Editar card" : "Novo card"}</DialogTitle>
                <DialogDescription>
                    Atalho para um módulo no Dashboard. Campos com * são obrigatórios.
                </DialogDescription>
                <ModuleForm
                    key={formKey}
                    action={action}
                    initialValues={module ?? emptyValues}
                    submitLabel={editing ? "Salvar alterações" : "Salvar card"}
                    onSuccess={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}

type ModuleFormProps = {
    action: Action;
    initialValues: DashboardModuleFormValues;
    submitLabel: string;
    onSuccess: () => void;
};

function ModuleForm({ action, initialValues, submitLabel, onSuccess }: ModuleFormProps) {
    const [state, formAction, pending] = useActionState(action, null);
    const errors = state?.fieldErrors;
    // Depois de um erro, mostra o que foi enviado; senão, os dados do card.
    const values = state?.values ?? initialValues;

    useEffect(() => {
        if (state?.ok) onSuccess();
    }, [state, onSuccess]);

    // Atributos de acessibilidade de um campo com possível erro (R11).
    const field = (name: keyof DashboardModuleFormValues) => ({
        id: `module-${name}`,
        name,
        "aria-invalid": Boolean(errors?.[name]),
        "aria-describedby": errors?.[name] ? `module-${name}-error` : undefined,
    });

    const fieldError = (name: keyof DashboardModuleFormValues) =>
        errors?.[name] && (
            <p id={`module-${name}-error`} className={styles.fieldError}>
                {errors[name]?.[0]}
            </p>
        );

    return (
        <form action={formAction} className={styles.form} noValidate>
            {state?.message && (
                <p className={styles.formError} role="alert">
                    {state.message}
                </p>
            )}

            <div className={styles.field}>
                <label htmlFor="module-slug">Identificador *</label>
                <input {...field("slug")} defaultValue={values.slug} maxLength={40} />
                <span className={styles.hint}>
                    Minúsculas, números e hífen. Ex.: release-control
                </span>
                {fieldError("slug")}
            </div>

            <div className={styles.field}>
                <label htmlFor="module-title">Título *</label>
                <input {...field("title")} defaultValue={values.title} maxLength={60} />
                {fieldError("title")}
            </div>

            <div className={styles.field}>
                <label htmlFor="module-description">Descrição *</label>
                <textarea
                    {...field("description")}
                    defaultValue={values.description}
                    rows={3}
                    maxLength={160}
                />
                {fieldError("description")}
            </div>

            <div className={styles.field}>
                <label htmlFor="module-href">Link *</label>
                <input
                    {...field("href")}
                    defaultValue={values.href}
                    placeholder="/finance ou https://…"
                    maxLength={300}
                />
                {fieldError("href")}
            </div>

            <div className={styles.row}>
                <div className={styles.field}>
                    <label htmlFor="module-icon">Ícone *</label>
                    <select {...field("icon")} defaultValue={values.icon}>
                        {dashboardIconNames.map((name) => (
                            <option key={name} value={name}>
                                {dashboardIcons[name].label}
                            </option>
                        ))}
                    </select>
                    {fieldError("icon")}
                </div>

                <div className={styles.field}>
                    <label htmlFor="module-status">Status</label>
                    <select {...field("status")} defaultValue={values.status}>
                        {dashboardModuleStatusValues.map((status) => (
                            <option key={status} value={status}>
                                {dashboardModuleStatusLabel[status]}
                            </option>
                        ))}
                    </select>
                    {fieldError("status")}
                </div>
            </div>

            <div className={styles.actions}>
                <DialogClose asChild>
                    <Button variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={pending}>
                    {pending ? "Salvando…" : submitLabel}
                </Button>
            </div>
        </form>
    );
}
