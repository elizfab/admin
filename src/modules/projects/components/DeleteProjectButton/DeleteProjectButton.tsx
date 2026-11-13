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

import { deleteProjectAction } from "../../actions/project.actions";

type DeleteProjectButtonProps = {
    projectId: string;
    projectName: string;
};

export function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function handleConfirm() {
        startTransition(async () => {
            const result = await deleteProjectAction(projectId);

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
                <Button variant="secondary" aria-label={`Excluir o projeto ${projectName}`}>
                    <Trash2 size={16} aria-hidden="true" />
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
                <AlertDialogDescription>
                    O projeto “{projectName}” será excluído permanentemente. Esta ação não pode ser
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
