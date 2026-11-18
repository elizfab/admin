import { render, screen } from "@testing-library/react";

import { Sidebar } from "@/components/layout/Sidebar/Sidebar";

// A Sidebar usa usePathname(), que só existe dentro do Next.js.
// No teste, simulamos (mock) o hook para controlar a rota atual.
jest.mock("next/navigation", () => ({
    usePathname: () => "/finance",
}));

describe("Sidebar", () => {
    it("exibe a navegação principal com todos os módulos", () => {
        render(<Sidebar />);

        const nav = screen.getByRole("navigation", { name: "Navegação principal" });
        expect(nav).toBeInTheDocument();

        for (const label of ["Dashboard", "Projetos", "Estudos", "Financeiro"]) {

            expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
        }
    });

    it("marca apenas o link da rota atual como página ativa", () => {
        render(<Sidebar />);

        expect(screen.getByRole("link", { name: "Financeiro" })).toHaveAttribute(
            "aria-current",
            "page",
        );
        expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
            "aria-current",
        );
    });
});
