import { render, screen } from "@testing-library/react";

import { ModuleCard } from "@/modules/dashboard/components/ModuleCard/ModuleCard";

const base = {
    id: "c1",
    slug: "finance",
    title: "Portal Financeiro",
    description: "Receitas, despesas, saldo e obra.",
    href: "/finance",
    icon: "PiggyBank",
    status: "AVAILABLE" as const,
};

describe("ModuleCard", () => {
    it("mostra título, descrição e o rótulo do status em português", () => {
        render(<ModuleCard module={base} />);

        const link = screen.getByRole("link", { name: /Portal Financeiro/ });
        expect(link).toHaveAttribute("href", "/finance");
        expect(link).not.toHaveAttribute("target");
        expect(screen.getByText("Receitas, despesas, saldo e obra.")).toBeInTheDocument();
        expect(screen.getByText("Disponível")).toBeInTheDocument();
    });

    it.each([
        ["EXTERNAL", "Aplicação externa"],
        ["SOON", "Em breve"],
    ] as const)("status %s → %s", (status, label) => {
        render(<ModuleCard module={{ ...base, status }} />);

        expect(screen.getByText(label)).toBeInTheDocument();
    });

    it("link https:// abre em nova aba, com aviso para leitor de tela", () => {
        render(<ModuleCard module={{ ...base, href: "https://docs.example.com" }} />);

        const link = screen.getByRole("link", { name: /Portal Financeiro.*abre em nova aba/ });
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("mostra as ações (editar/excluir) fora do link", () => {
        render(<ModuleCard module={base} actions={<button type="button">Editar</button>} />);

        const link = screen.getByRole("link", { name: /Portal Financeiro/ });
        const action = screen.getByRole("button", { name: "Editar" });
        expect(link).not.toContainElement(action);
    });
});
