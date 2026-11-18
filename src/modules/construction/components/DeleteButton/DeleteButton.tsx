"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/AlertDialog/AlertDialog";
import { Button } from "@/components/ui/Button/Button";

import type { FormState } from "../../actions/project.actions";
import styles from "./DeleteButton.module.scss";

type DeleteButtonProps = {
    /** Rótulo acessível do botão (ex.: "Excluir o pagamento de 03/10/2025"). */
    label: string;
    /** Título do diálogo de confirmação. */
    title: string;
    /** Texto de aviso do diálogo. */
    description: string;
    action: () => Promise<FormState>;
};

/**
 * Botão genérico de exclusão com AlertDialog (mesmo padrão do
 * DeleteTransactionButton): o diálogo só fecha depois do sucesso.
 */
export function DeleteButton({ label, title, description, action }: DeleteButtonProps) {
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function handleConfirm() {
        startTransition(async () => {
            const result = await action();

            if (result?.message) {
                setError(result.message);
                return;
            }

            setOpen(false);
        });
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="secondary" aria-label={label} className={styles.trigger}>
                    <Trash2 size={16} aria-hidden="true" />
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription>{description}</AlertDialogDescription>

                {error && <p role="alert">{error}</p>}

                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                        <Button variant="secondary">Cancelar</Button>
                    </AlertDialogCancel>
                    <Button variant="danger" onClick={handleConfirm} disabled={pending}>
                        {pending ? "Excluindo…" : "Excluir"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
