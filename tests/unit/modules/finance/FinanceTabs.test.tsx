import { render, screen, within } from "@testing-library/react";

import { FinanceTabs } from "@/modules/finance/components/FinanceTabs/FinanceTabs";

describe("FinanceTabs", () => {
    it("mostra as abas Transações e Construção dentro da navegação do Financeiro", () => {
        render(<FinanceTabs current="transactions" />);

        const nav = screen.getByRole("navigation", { name: "Seções do Financeiro" });

        expect(within(nav).getByRole("link", { name: "Transações" })).toHaveAttribute(
            "href",
            "/finance",
        );
        expect(within(nav).getByRole("link", { name: "Construção" })).toHaveAttribute(
            "href",
            "/finance/construction",
        );
    });

    it.each([
        ["transactions", "Transações", "Construção"],
        ["construction", "Construção", "Transações"],
    ] as const)("marca só a aba atual (%s)", (current, active, other) => {
        render(<FinanceTabs current={current} />);

        expect(screen.getByRole("link", { name: active })).toHaveAttribute("aria-current", "page");
        expect(screen.getByRole("link", { name: other })).not.toHaveAttribute("aria-current");
    });
});
