import { DEFAULT_THEME, THEME_CHANGE_EVENT, THEME_STORAGE_KEY } from "./theme.constants";
import type { Theme } from "./theme.types";

// Funções que leem, aplicam e observam o tema (DOM, localStorage e eventos).
// Sem React: o hook useTheme é quem liga isto aos componentes.

export function getOppositeTheme(theme: Theme): Theme {
    return theme === "dark" ? "light" : "dark";
}

/** Tema aplicado no <html data-theme>; qualquer outro valor conta como o padrão. */
export function readTheme(): Theme {
    return document.documentElement.dataset.theme === "dark" ? "dark" : DEFAULT_THEME;
}

/** No servidor não há <html> do navegador: vale o padrão (o script inline corrige antes da pintura). */
export function getServerTheme(): Theme {
    return DEFAULT_THEME;
}

/** Aplica no <html>, persiste a escolha e avisa quem observa (useTheme). */
export function applyTheme(theme: Theme) {
    document.documentElement.dataset.theme = theme;

    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
        // localStorage pode estar indisponível (ex.: modo privado restrito).
    }

    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

/** Observa trocas de tema nesta aba e em outras (storage). Devolve a função que para de observar. */
export function subscribeToTheme(callback: () => void) {
    window.addEventListener(THEME_CHANGE_EVENT, callback);
    window.addEventListener("storage", callback);

    return () => {
        window.removeEventListener(THEME_CHANGE_EVENT, callback);
        window.removeEventListener("storage", callback);
    };
}
