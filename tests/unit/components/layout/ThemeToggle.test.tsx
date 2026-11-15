import { fireEvent, render, screen } from "@testing-library/react";

import { ThemeToggle } from "@/components/layout/Header/ThemeToggle";

describe("ThemeToggle", () => {
    beforeEach(() => {
        localStorage.clear();
        delete document.documentElement.dataset.theme;
    });

    it("renderiza um botão de alternância de tema", () => {
        render(<ThemeToggle />);

        expect(
            screen.getByRole("button", { name: "Ativar tema escuro" }),
        ).toBeInTheDocument();
    });

    it("alterna para o tema escuro e persiste a escolha", () => {
        render(<ThemeToggle />);

        fireEvent.click(screen.getByRole("button"));

        expect(document.documentElement.dataset.theme).toBe("dark");
        expect(localStorage.getItem("theme")).toBe("dark");
        expect(
            screen.getByRole("button", { name: "Ativar tema claro" }),
        ).toBeInTheDocument();
    });

    it("volta para o tema claro ao clicar novamente", () => {
        document.documentElement.dataset.theme = "dark";
        render(<ThemeToggle />);

        fireEvent.click(screen.getByRole("button", { name: "Ativar tema claro" }));

        expect(document.documentElement.dataset.theme).toBe("light");
        expect(localStorage.getItem("theme")).toBe("light");
    });
});
