import { useCallback, useSyncExternalStore } from "react";

import type { UseThemeResult } from "./theme.types";
import {
    applyTheme,
    getOppositeTheme,
    getServerTheme,
    readTheme,
    subscribeToTheme,
} from "./theme.utils";

/**
 * Liga o React ao tema do documento. useSyncExternalStore mantém todos os
 * componentes em dia quando o tema muda (nesta aba ou em outra).
 */
export function useTheme(): UseThemeResult {
    const theme = useSyncExternalStore(subscribeToTheme, readTheme, getServerTheme);

    const toggleTheme = useCallback(() => applyTheme(getOppositeTheme(theme)), [theme]);

    return { theme, isDark: theme === "dark", setTheme: applyTheme, toggleTheme };
}
