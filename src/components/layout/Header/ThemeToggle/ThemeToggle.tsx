"use client";

import { MoonStar, Sun } from "lucide-react";

import { THEME_ICON_SIZE, THEME_TOGGLE_LABEL } from "./theme.constants";
import styles from "./ThemeToggle.module.scss";
import { useTheme } from "./useTheme";

/** Botão de alternar o tema: só renderiza (a lógica fica no useTheme). */
export function ThemeToggle() {
    const { theme, isDark, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            className={styles.iconButton}
            onClick={toggleTheme}
            aria-label={THEME_TOGGLE_LABEL[theme]}
        >
            {isDark ? (
                <MoonStar size={THEME_ICON_SIZE} aria-hidden="true" />
            ) : (
                <Sun size={THEME_ICON_SIZE} aria-hidden="true" />
            )}
        </button>
    );
}
