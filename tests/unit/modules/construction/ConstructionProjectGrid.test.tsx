import { render, screen, within } from "@testing-library/react";

import { ConstructionProjectGrid } from "@/modules/construction/components/ConstructionProjectGrid/ConstructionProjectGrid";

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("ConstructionProjectGrid", () => {
    it("um card por obra, com link para a obra, datas e Configurar", () => {
        render(
            <ConstructionProjectGrid
                projects={[
                    {
                        id: "p1",
                        name: "Telhado da casa",
                        startDate: day("2026-12-01"),
                        plannedEndDate: day("2027-02-28"),
                    },
                    { id: "p2", name: "Lavanderia", startDate: null, plannedEndDate: null },
                ]}
            />,
        );

        const cards = screen.getAllByRole("listitem");
        expect(cards).toHaveLength(2);

        const telhado = within(cards[0]);
        expect(telhado.getByRole("link", { name: "Telhado da casa" })).toHaveAttribute(
            "href",
            "/finance/construction/p1",
        );
        expect(
            telhado.getByText("Início 01/12/2026 · Fim previsto 28/02/2027"),
        ).toBeInTheDocument();
        expect(
            telhado.getByRole("link", { name: "Configurar a obra Telhado da casa" }),
        ).toHaveAttribute("href", "/finance/construction/p1/settings");

        expect(within(cards[1]).getByText("Sem data de início")).toBeInTheDocument();
    });

    it("sem obras: mostra como começar", () => {
        render(<ConstructionProjectGrid projects={[]} />);

        expect(screen.queryByRole("list")).not.toBeInTheDocument();
        expect(screen.getByText(/Nenhuma obra ainda/)).toHaveTextContent("Nova obra");
    });
});
