"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, buttonClassName } from "@/components/ui/Button/Button";

import type { ProjectFormState } from "../../actions/project.actions";
import { projectStatusValues } from "../../schemas/project.schema";
import { projectStatusLabel, type Project } from "../../types/project.types";
import styles from "./ProjectForm.module.scss";

type ProjectFormProps = {
    action: (state: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
    project?: Pick<Project, "name" | "description" | "status" | "repositoryUrl">;
    submitLabel: string;
};

export function ProjectForm({ action, project, submitLabel }: ProjectFormProps) {
    // state: resultado da última execução da action; pending: enviando.
    const [state, formAction, pending] = useActionState(action, null);
    const errors = state?.fieldErrors;
    // Depois de um erro, mostra o que foi enviado; senão, os dados do projeto (edição).
    const values = state?.values ?? {
        name: project?.name ?? "",
        description: project?.description ?? "",
        status: project?.status ?? "PLANNED",
        repositoryUrl: project?.repositoryUrl ?? "",
    };

    return (
        <form action={formAction} className={styles.form} noValidate>
            {state?.message && (
                <p className={styles.formError} role="alert">
                    {state.message}
                </p>
            )}

            <div className={styles.field}>
                <label htmlFor="name">Nome *</label>
                <input
                    id="name"
                    name="name"
                    defaultValue={values.name}
                    required
                    maxLength={100}
                    aria-invalid={Boolean(errors?.name)}
                    aria-describedby={errors?.name ? "name-error" : undefined}
                />
                {errors?.name && (
                    <p id="name-error" className={styles.fieldError}>
                        {errors.name[0]}
                    </p>
                )}
            </div>

            <div className={styles.field}>
                <label htmlFor="description">Descrição</label>
                <textarea
                    id="description"
                    name="description"
                    rows={4}
                    maxLength={500}
                    defaultValue={values.description}
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
                <label htmlFor="status">Status</label>
                <select id="status" name="status" defaultValue={values.status}>
                    {projectStatusValues.map((status) => (
                        <option key={status} value={status}>
                            {projectStatusLabel[status]}
                        </option>
                    ))}
                </select>
            </div>

            <div className={styles.field}>
                <label htmlFor="repositoryUrl">Link do repositório</label>
                <input
                    id="repositoryUrl"
                    name="repositoryUrl"
                    type="url"
                    placeholder="https://github.com/..."
                    defaultValue={values.repositoryUrl}
                    aria-invalid={Boolean(errors?.repositoryUrl)}
                    aria-describedby={errors?.repositoryUrl ? "repositoryUrl-error" : undefined}
                />
                {errors?.repositoryUrl && (
                    <p id="repositoryUrl-error" className={styles.fieldError}>
                        {errors.repositoryUrl[0]}
                    </p>
                )}
            </div>

            <div className={styles.actions}>
                <Link href="/projects" className={buttonClassName("secondary")}>
                    Cancelar
                </Link>
                <Button type="submit" disabled={pending}>
                    {pending ? "Salvando…" : submitLabel}
                </Button>
            </div>
        </form>
    );
}
