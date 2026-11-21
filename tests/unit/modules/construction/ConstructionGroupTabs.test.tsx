import { render, screen } from "@testing-library/react";

import { ConstructionGroupTabs } from "@/modules/construction/components/ConstructionGroupTabs/ConstructionGroupTabs";

describe("ConstructionGroupTabs", () => {
    it("renderiza os grupos do catálogo como abas", () => {
        render(<ConstructionGroupTabs grupo="lavanderia" />);

        const tabs = screen.getAllByRole("tab");
        expect(tabs.map((tab) => tab.textContent)).toEqual(["Lavanderia", "Residência"]);
        expect(tabs[0]).toHaveAttribute("href", "/finance/construction?grupo=lavanderia");
        expect(tabs[0]).toHaveAttribute("aria-selected", "true");
        expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    });

    it("com showUncategorized adiciona a aba 'Sem categoria'", () => {
        render(<ConstructionGroupTabs grupo="sem-categoria" showUncategorized />);

        const tabs = screen.getAllByRole("tab");
        expect(tabs).toHaveLength(3);
        expect(tabs[2]).toHaveTextContent("Sem categoria");
        expect(tabs[2]).toHaveAttribute("href", "/finance/construction?grupo=sem-categoria");
        expect(tabs[2]).toHaveAttribute("aria-selected", "true");
    });

    it("sem showUncategorized a aba 'Sem categoria' não existe", () => {
        render(<ConstructionGroupTabs grupo="residencia" />);

        expect(screen.queryByRole("tab", { name: "Sem categoria" })).not.toBeInTheDocument();
        expect(screen.getByRole("tab", { name: "Residência" })).toHaveAttribute(
            "aria-selected",
            "true",
        );
    });
});
