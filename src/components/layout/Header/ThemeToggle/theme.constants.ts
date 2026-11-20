import type { Theme } from "./theme.types";

/**
 * Chave do tema no localStorage. É a MESMA lida pelo script inline do
 * src/app/layout.tsx, que aplica o tema antes da pintura (não mude uma sem a outra).
 */
export const THEME_STORAGE_KEY = "theme";

/** Evento disparado nesta aba quando o tema muda (outras abas usam o evento "storage"). */
export const THEME_CHANGE_EVENT = "admin:theme-change";

/** Tema usado quando nada foi aplicado (e no servidor, que não conhece o navegador). */
export const DEFAULT_THEME: Theme = "light";

/** Nome acessível do botão: descreve a AÇÃO a partir do tema atual. */
export const THEME_TOGGLE_LABEL: Record<Theme, string> = {
    light: "Ativar tema escuro",
    dark: "Ativar tema claro",
};

export const THEME_ICON_SIZE = 18;
