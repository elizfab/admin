"use client";

import { X } from "lucide-react";
import { Dialog as Primitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

import styles from "./Dialog.module.scss";

// Dialog (modal) para formulários. Radix cuida do foco preso, do Esc e do aria-modal.
// Para confirmar ações destrutivas, use o AlertDialog.

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;

export function DialogContent({
    className,
    children,
    ...props
}: ComponentProps<typeof Primitive.Content>) {
    return (
        <Primitive.Portal>
            <Primitive.Overlay className={styles.overlay} />
            <Primitive.Content className={cn(styles.content, className)} {...props}>
                {children}
                <Primitive.Close className={styles.close} aria-label="Fechar">
                    <X size={18} aria-hidden="true" />
                </Primitive.Close>
            </Primitive.Content>
        </Primitive.Portal>
    );
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof Primitive.Title>) {
    return <Primitive.Title className={cn(styles.title, className)} {...props} />;
}

export function DialogDescription({
    className,
    ...props
}: ComponentProps<typeof Primitive.Description>) {
    return <Primitive.Description className={cn(styles.description, className)} {...props} />;
}
