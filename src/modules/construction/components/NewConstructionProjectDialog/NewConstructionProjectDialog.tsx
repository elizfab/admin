"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/Dialog/Dialog";

import { ProjectSettingsForm } from "../ConstructionForms/SettingsForms";
import type { NewConstructionProjectDialogProps } from "./NewConstructionProjectDialog.types";

const EMPTY_PROJECT = { name: "", startDate: null, plannedEndDate: null };

/**
 * Botão "Nova obra" + modal com o MESMO formulário de obra da configuração
 * (ProjectSettingsForm) e a mesma action. Ao salvar, a action leva para a
 * configuração da obra nova (o modal some com a navegação).
 */
export function NewConstructionProjectDialog({ action }: NewConstructionProjectDialogProps) {
    const [open, setOpen] = useState(false);
    // Muda a cada abertura: o formulário nasce limpo (sem o erro da vez anterior).
    const [formKey, setFormKey] = useState(0);

    function handleOpenChange(next: boolean) {
        if (next) setFormKey((key) => key + 1);
        setOpen(next);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus size={16} aria-hidden="true" />
                    Nova obra
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogTitle>Nova obra</DialogTitle>
                <DialogDescription>
                    A obra já nasce com o ambiente “Geral” e a “Fase 01”. Campos com * são
                    obrigatórios.
                </DialogDescription>
                <ProjectSettingsForm key={formKey} action={action} project={EMPTY_PROJECT} />
            </DialogContent>
        </Dialog>
    );
}
