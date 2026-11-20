import { act, renderHook } from "@testing-library/react";

import { applyTheme } from "@/components/layout/Header/ThemeToggle/theme.utils";
import { useTheme } from "@/components/layout/Header/ThemeToggle/useTheme";

beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
});

describe("useTheme", () => {
    it("começa no tema aplicado no <html>", () => {
        document.documentElement.dataset.theme = "dark";

        const { result } = renderHook(() => useTheme());

        expect(result.current.theme).toBe("dark");
        expect(result.current.isDark).toBe(true);
    });

    it("toggleTheme alterna claro ↔ escuro", () => {
        const { result } = renderHook(() => useTheme());

        act(() => result.current.toggleTheme());
        expect(result.current.theme).toBe("dark");

        act(() => result.current.toggleTheme());
        expect(result.current.theme).toBe("light");
        expect(result.current.isDark).toBe(false);
    });

    it("setTheme aplica um tema específico", () => {
        const { result } = renderHook(() => useTheme());

        act(() => result.current.setTheme("dark"));

        expect(document.documentElement.dataset.theme).toBe("dark");
        expect(result.current.theme).toBe("dark");
    });

    it("acompanha troca feita fora do hook (outro componente)", () => {
        const { result } = renderHook(() => useTheme());

        act(() => applyTheme("dark"));

        expect(result.current.isDark).toBe(true);
    });
});
