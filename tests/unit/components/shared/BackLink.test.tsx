import { render, screen } from "@testing-library/react";

import { BackLink } from "@/components/shared/BackLink/BackLink";

describe("BackLink", () => {
    it('leva ao Dashboard com o texto "Voltar ao início"', () => {
        render(<BackLink />);

        expect(screen.getByRole("link", { name: "Voltar ao início" })).toHaveAttribute(
            "href",
            "/dashboard",
        );
    });

    it("aceita uma classe extra (ex.: alinhar numa barra de ações)", () => {
        render(<BackLink className="extra" />);

        expect(screen.getByRole("link", { name: "Voltar ao início" })).toHaveClass("extra");
    });

    it("aceita outro destino e outro texto", () => {
        render(<BackLink href="/finance" label="Voltar ao Financeiro" />);

        expect(screen.getByRole("link", { name: "Voltar ao Financeiro" })).toHaveAttribute(
            "href",
            "/finance",
        );
    });
});
