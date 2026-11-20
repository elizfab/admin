/** Temas da paleta Dracula (tokens em src/styles/themes/_light.scss e _dark.scss). */
export type Theme = "light" | "dark";

/** O que o hook useTheme entrega aos componentes. */
export type UseThemeResult = {
    theme: Theme;
    isDark: boolean;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
};
