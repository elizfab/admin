import { render, screen } from "@testing-library/react";

import { MonthNavigator } from "@/modules/finance/components/MonthNavigator/MonthNavigator";

describe("MonthNavigator", () => {
    it("navega para o mês anterior e seguinte na base /finance por padrão", () => {
        render(<MonthNavigator month="2026-04" />);

        expect(screen.getByRole("heading", { name: /abril de 2026/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Mês anterior/ })).toHaveAttribute(
            "href",
            "/finance?month=2026-03",
        );
        expect(screen.getByRole("link", { name: /Próximo mês/ })).toHaveAttribute(
            "href",
            "/finance?month=2026-05",
        );
    });

    it("usa basePath customizado (aba Transações)", () => {
        render(<MonthNavigator month="2026-11" basePath="/finance/transactions" />);

        expect(screen.getByRole("link", { name: /Mês anterior/ })).toHaveAttribute(
            "href",
            "/finance/transactions?month=2026-10",
        );
        expect(screen.getByRole("link", { name: /Próximo mês/ })).toHaveAttribute(
            "href",
            "/finance/transactions?month=2026-12",
        );
    });
});
