import { render, screen, within } from "@testing-library/react";

import { FinanceLayout } from "@/modules/finance/components/FinanceLayout/FinanceLayout";

describe("FinanceLayout (topo igual nas duas abas — FIN-R12)", () => {
    it("mostra o título, a descrição, o Voltar e as abas, com o conteúdo dentro do container", () => {
        render(
            <FinanceLayout current="transactions">
                <p>conteúdo da aba</p>
            </FinanceLayout>,
        );

        expect(
            screen.getByRole("heading", { level: 1, name: "Painel Financeiro" }),
        ).toBeInTheDocument();
        expect(screen.getByText("Receitas, despesas, saldo e construção.")).toBeInTheDocument();
        expect(
            screen.getByRole("navigation", { name: "Seções do Financeiro" }),
        ).toBeInTheDocument();
        expect(screen.getByText("conteúdo da aba")).toBeInTheDocument();
    });

    it("em Transações, Voltar leva ao início (Dashboard)", () => {
        render(<FinanceLayout current="transactions">x</FinanceLayout>);

        expect(screen.getByRole("link", { name: "Voltar ao início" })).toHaveAttribute(
            "href",
            "/dashboard",
        );
    });

    it("em Construção, Voltar leva ao Financeiro (um nível acima)", () => {
        render(<FinanceLayout current="construction">x</FinanceLayout>);

        expect(screen.getByRole("link", { name: "Voltar ao Financeiro" })).toHaveAttribute(
            "href",
            "/finance",
        );
    });

    it("mostra as ações da aba ao lado do Voltar (mesma barra)", () => {
        render(
            <FinanceLayout
                current="construction"
                actions={<button type="button">Nova obra</button>}
            >
                x
            </FinanceLayout>,
        );

        const back = screen.getByRole("link", { name: "Voltar ao Financeiro" });
        const toolbar = back.parentElement as HTMLElement;
        expect(within(toolbar).getByRole("button", { name: "Nova obra" })).toBeInTheDocument();
    });
});
