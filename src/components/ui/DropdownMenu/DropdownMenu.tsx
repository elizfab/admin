"use client";

import { DropdownMenu as Primitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

import styles from "./DropdownMenu.module.scss";

// O Radix cuida de comportamento (teclado, foco, ARIA).
// Este wrapper só aplica a identidade visual do projeto.

export const DropdownMenu = Primitive.Root;
export const DropdownMenuTrigger = Primitive.Trigger;

export function DropdownMenuContent({
    className,
    sideOffset = 8,
    align = "end",
    ...props
}: ComponentProps<typeof Primitive.Content>) {
    return (
        <Primitive.Portal>
            <Primitive.Content
                className={cn(styles.content, className)}
                sideOffset={sideOffset}
                align={align}
                {...props}
            />
        </Primitive.Portal>
    );
}

export function DropdownMenuItem({
    className,
    ...props
}: ComponentProps<typeof Primitive.Item>) {
    return <Primitive.Item className={cn(styles.item, className)} {...props} />;
}

export function DropdownMenuLabel({
    className,
    ...props
}: ComponentProps<typeof Primitive.Label>) {
    return <Primitive.Label className={cn(styles.label, className)} {...props} />;
}

export function DropdownMenuSeparator({
    className,
    ...props
}: ComponentProps<typeof Primitive.Separator>) {
    return (
        <Primitive.Separator className={cn(styles.separator, className)} {...props} />
    );
}
