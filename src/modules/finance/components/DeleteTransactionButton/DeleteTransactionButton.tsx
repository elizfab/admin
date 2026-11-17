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

import { deleteTransactionAction } from "../../actions/transaction.actions";

type DeleteTransactionButtonProps = {
    transactionId: string;
    description: string;
};

export function DeleteTransactionButton({ transactionId, description }: DeleteTransactionButtonProps) {
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function handleConfirm() {
        startTransition(async () => {
            const result = await deleteTransactionAction(transactionId);

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
                <Button variant="secondary" aria-label={`Excluir a transação ${description}`}>
                    <Trash2 size={16} aria-hidden="true" />
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                <AlertDialogDescription>
                    A transação “{description}” será excluída permanentemente. Esta ação não pode ser
                    desfeita.
                </AlertDialogDescription>

                {error && <p role="alert">{error}</p>}

                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                        <Button variant="secondary">Cancelar</Button>
                    </AlertDialogCancel>
                    {/* Botão comum (e não AlertDialogAction) para o diálogo só fechar após o sucesso. */}
                    <Button variant="danger" onClick={handleConfirm} disabled={pending}>
                        {pending ? "Excluindo…" : "Excluir"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
