/**
 * Junta nomes de classes CSS, ignorando valores falsos.
 * Útil com SCSS Modules: cn(styles.item, isActive && styles.itemActive)
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(" ");
}
