import { render, screen } from "@testing-library/react";

import { EmptyState } from "@/components/shared/EmptyState/EmptyState";

describe("EmptyState", () => {
    it("usa h2 como título por padrão", () => {
        render(<EmptyState title="Sem dados" description="Nada por aqui." />);

        expect(screen.getByRole("heading", { level: 2, name: "Sem dados" })).toBeInTheDocument();
        expect(screen.getByText("Nada por aqui.")).toBeInTheDocument();
    });

    it("permite usar h1 quando for o conteúdo principal da página", () => {
        render(<EmptyState headingLevel="h1" title="Financeiro" description="Em breve." />);

        expect(screen.getByRole("heading", { level: 1, name: "Financeiro" })).toBeInTheDocument();
    });
});
