import { render, screen, within } from "@testing-library/react";

import { ConstructionProjectGrid } from "@/modules/construction/components/ConstructionProjectGrid/ConstructionProjectGrid";

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("ConstructionProjectGrid", () => {
    it("um card por obra, com link para a obra, datas e 'Abrir obra'", () => {
        render(
            <ConstructionProjectGrid
                projects={[
                    {
                        id: "p1",
                        name: "Telhado da casa",
                        startDate: day("2026-12-01"),
                        plannedEndDate: day("2027-02-28"),
                        categoryIds: ["lavanderia"],
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
        expect(telhado.getByText("Lavanderia")).toBeInTheDocument();
        // "Abrir obra" abre a página de detalhes (OBRA-R18: era "Configurar").
        expect(telhado.getByRole("link", { name: "Abrir a obra Telhado da casa" })).toHaveAttribute(
            "href",
            "/finance/construction/p1",
        );

        expect(within(cards[1]).getByText("Sem data de início")).toBeInTheDocument();
    });

    it("'Ver mais' só aparece no ÚLTIMO card e só quando hasMore", () => {
        const projects = Array.from({ length: 12 }, (_, i) => ({
            id: `p${i}`,
            name: `Obra ${i + 1}`,
            startDate: null,
            plannedEndDate: null,
        }));

        const { rerender } = render(
            <ConstructionProjectGrid
                projects={projects}
                hasMore
                moreHref="/finance/construction?categoria=lavanderia&offset=12"
            />,
        );

        const cards = screen.getAllByRole("listitem");
        expect(cards).toHaveLength(12);
        expect(within(cards[10]).queryByRole("link", { name: "Ver mais" })).not.toBeInTheDocument();
        expect(within(cards[11]).getByRole("link", { name: "Ver mais" })).toHaveAttribute(
            "href",
            "/finance/construction?categoria=lavanderia&offset=12",
        );

        rerender(<ConstructionProjectGrid projects={projects} hasMore={false} />);
        expect(screen.queryByRole("link", { name: "Ver mais" })).not.toBeInTheDocument();
    });

    it("sem obras: mostra como começar", () => {
        render(<ConstructionProjectGrid projects={[]} />);

        expect(screen.queryByRole("list")).not.toBeInTheDocument();
        expect(screen.getByText(/Nenhuma obra nesta categoria/)).toHaveTextContent("Nova obra");
    });
});
