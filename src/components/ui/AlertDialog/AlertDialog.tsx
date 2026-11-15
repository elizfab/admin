"use client";

import { AlertDialog as Primitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

import styles from "./AlertDialog.module.scss";

// AlertDialog: confirmação de ações destrutivas.
// Diferente do Dialog comum, não fecha clicando fora: exige uma escolha.

export const AlertDialog = Primitive.Root;
export const AlertDialogTrigger = Primitive.Trigger;
export const AlertDialogCancel = Primitive.Cancel;
export const AlertDialogAction = Primitive.Action;

export function AlertDialogContent({
    className,
    ...props
}: ComponentProps<typeof Primitive.Content>) {
    return (
        <Primitive.Portal>
            <Primitive.Overlay className={styles.overlay} />
            <Primitive.Content className={cn(styles.content, className)} {...props} />
        </Primitive.Portal>
    );
}

export function AlertDialogTitle({ className, ...props }: ComponentProps<typeof Primitive.Title>) {
    return <Primitive.Title className={cn(styles.title, className)} {...props} />;
}

export function AlertDialogDescription({
    className,
    ...props
}: ComponentProps<typeof Primitive.Description>) {
    return <Primitive.Description className={cn(styles.description, className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }: ComponentProps<"div">) {
    return <div className={cn(styles.footer, className)} {...props} />;
}
