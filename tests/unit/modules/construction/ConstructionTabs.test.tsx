import { render, screen, within } from "@testing-library/react";

import { ConstructionTabs } from "@/modules/construction/components/ConstructionTabs/ConstructionTabs";

const PROJECT = "cjld2cjxh0000qzrmn831i7rn";

describe("ConstructionTabs", () => {
    it("renderiza as 7 abas na ordem da especificação, todas com role=tab", () => {
        render(<ConstructionTabs projectId={PROJECT} active="dashboard" />);

        const tabs = screen.getAllByRole("tab");
        expect(tabs.map((tab) => tab.textContent)).toEqual([
            "Dashboard",
            "Fases",
            "Serviços",
            "Pagamentos",
            "Compras",
            "Metas",
            "Dados da obra",
        ]);
    });

    it("links apontam para as rotas da obra e a aba ativa tem aria-selected", () => {
        render(<ConstructionTabs projectId={PROJECT} active="payments" />);

        const tabs = screen.getAllByRole("tab");
        expect(tabs[0]).toHaveAttribute("href", `/finance/construction/${PROJECT}`);
        expect(tabs[1]).toHaveAttribute("href", `/finance/construction/${PROJECT}/phases`);
        expect(tabs[6]).toHaveAttribute("href", `/finance/construction/${PROJECT}/settings`);

        expect(tabs[3]).toHaveAttribute("aria-selected", "true");
        for (const tab of tabs.filter((_, i) => i !== 3)) {
            expect(tab).toHaveAttribute("aria-selected", "false");
        }
        // Abas não usam aria-current (ETAPA 04).
        for (const tab of tabs) {
            expect(tab).not.toHaveAttribute("aria-current");
        }
    });

    it("cada aba marca aria-selected só nela (Fases)", () => {
        render(<ConstructionTabs projectId={PROJECT} active="phases" />);

        const tabs = screen.getAllByRole("tab");
        expect(tabs[1]).toHaveAttribute("aria-selected", "true");
        expect(within(tabs[1] as HTMLElement).getByText("Fases")).toBeInTheDocument();
    });
});
