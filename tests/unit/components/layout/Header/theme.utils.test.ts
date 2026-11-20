import {
    THEME_CHANGE_EVENT,
    THEME_STORAGE_KEY,
} from "@/components/layout/Header/ThemeToggle/theme.constants";
import {
    applyTheme,
    getOppositeTheme,
    getServerTheme,
    readTheme,
    subscribeToTheme,
} from "@/components/layout/Header/ThemeToggle/theme.utils";

beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
});

describe("readTheme", () => {
    it("lê o tema aplicado no <html> (data-theme)", () => {
        document.documentElement.dataset.theme = "dark";

        expect(readTheme()).toBe("dark");
    });

    it.each([undefined, "light", "azul"])("data-theme %j → light (padrão)", (value) => {
        if (value) document.documentElement.dataset.theme = value;

        expect(readTheme()).toBe("light");
    });
});

it("getServerTheme: no servidor não há <html> do navegador, vale o padrão", () => {
    expect(getServerTheme()).toBe("light");
});

it.each([
    ["light", "dark"],
    ["dark", "light"],
] as const)("getOppositeTheme(%s) → %s", (theme, opposite) => {
    expect(getOppositeTheme(theme)).toBe(opposite);
});

describe("applyTheme", () => {
    it("aplica no <html>, persiste no localStorage e avisa quem observa", () => {
        const listener = jest.fn();
        window.addEventListener(THEME_CHANGE_EVENT, listener);

        applyTheme("dark");

        expect(document.documentElement.dataset.theme).toBe("dark");
        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
        expect(listener).toHaveBeenCalledTimes(1);
        window.removeEventListener(THEME_CHANGE_EVENT, listener);
    });

    it("continua funcionando quando o localStorage está indisponível", () => {
        const setItem = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("modo privado");
        });

        expect(() => applyTheme("dark")).not.toThrow();
        expect(document.documentElement.dataset.theme).toBe("dark");
        setItem.mockRestore();
    });
});

describe("subscribeToTheme", () => {
    it("chama o callback na troca de tema desta aba e de outra aba (storage)", () => {
        const callback = jest.fn();
        const unsubscribe = subscribeToTheme(callback);

        window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
        window.dispatchEvent(new Event("storage"));

        expect(callback).toHaveBeenCalledTimes(2);

        unsubscribe();
        window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
        window.dispatchEvent(new Event("storage"));

        expect(callback).toHaveBeenCalledTimes(2);
    });
});
