import { render, screen, within } from "@testing-library/react";

import { FinanceTabs } from "@/modules/finance/components/FinanceTabs/FinanceTabs";

describe("FinanceTabs", () => {
    it("mostra as abas Dashboard, Transações e Construção (role=tab, ETAPA 04)", () => {
        render(<FinanceTabs current="dashboard" />);

        const tablist = screen.getByRole("tablist");

        expect(within(tablist).getByRole("tab", { name: "Dashboard" })).toHaveAttribute(
            "href",
            "/finance",
        );
        expect(within(tablist).getByRole("tab", { name: "Transações" })).toHaveAttribute(
            "href",
            "/finance/transactions",
        );
        expect(within(tablist).getByRole("tab", { name: "Construção" })).toHaveAttribute(
            "href",
            "/finance/construction",
        );
    });

    it.each([
        ["dashboard", "Dashboard", "Transações"],
        ["transactions", "Transações", "Construção"],
        ["construction", "Construção", "Dashboard"],
    ] as const)("marca só a aba atual (%s) com aria-selected", (current, active, other) => {
        render(<FinanceTabs current={current} />);

        expect(screen.getByRole("tab", { name: active })).toHaveAttribute("aria-selected", "true");
        expect(screen.getByRole("tab", { name: other })).toHaveAttribute("aria-selected", "false");
        // Abas não usam aria-current (ETAPA 04).
        expect(screen.getByRole("tab", { name: active })).not.toHaveAttribute("aria-current");
    });
});
