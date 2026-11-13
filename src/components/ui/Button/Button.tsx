import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

import styles from "./Button.module.scss";

export type ButtonVariant = "primary" | "secondary" | "danger";

/** Classes do botão, para reutilizar em <Link> com aparência de botão. */
export function buttonClassName(variant: ButtonVariant = "primary", className?: string) {
    return cn(styles.button, styles[variant], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant };

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
    return <button type={type} className={buttonClassName(variant, className)} {...props} />;
}
