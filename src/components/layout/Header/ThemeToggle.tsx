"use client";

import { useSyncExternalStore } from "react";
import { MoonStar, Sun } from "lucide-react";

import styles from "./Header.module.scss";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const THEME_EVENT = "admin:theme-change";

function applyTheme(theme: Theme) {
    document.documentElement.dataset.theme = theme;

    try {
        localStorage.setItem(STORAGE_KEY, theme);
    } catch {
        // localStorage pode estar indisponível (ex.: modo privado restrito).
    }

    window.dispatchEvent(new Event(THEME_EVENT));
}

function subscribe(callback: () => void) {
    window.addEventListener(THEME_EVENT, callback);
    window.addEventListener("storage", callback);

    return () => {
        window.removeEventListener(THEME_EVENT, callback);
        window.removeEventListener("storage", callback);
    };
}

function getSnapshot() {
    return document.documentElement.dataset.theme === "dark";
}

function getServerSnapshot() {
    return false;
}

export function ThemeToggle() {
    const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    function toggleTheme() {
        applyTheme(isDark ? "light" : "dark");
    }

    return (
        <button
            type="button"
            className={styles.iconButton}
            onClick={toggleTheme}
            aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
        >
            {isDark ? (
                <MoonStar size={18} aria-hidden="true" />
            ) : (
                <Sun size={18} aria-hidden="true" />
            )}
        </button>
    );
}
