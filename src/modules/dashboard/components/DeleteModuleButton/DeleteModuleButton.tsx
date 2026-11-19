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

import { deleteDashboardModuleAction } from "../../actions/dashboard-module.actions";

type DeleteModuleButtonProps = {
    moduleId: string;
    moduleTitle: string;
};

export function DeleteModuleButton({ moduleId, moduleTitle }: DeleteModuleButtonProps) {
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function handleConfirm() {
        startTransition(async () => {
            const result = await deleteDashboardModuleAction(moduleId);

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
                <Button variant="secondary" aria-label={`Excluir o card ${moduleTitle}`}>
                    <Trash2 size={16} aria-hidden="true" />
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogTitle>Excluir card?</AlertDialogTitle>
                <AlertDialogDescription>
                    O card “{moduleTitle}” será excluído do Dashboard. O módulo em si não muda.
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
