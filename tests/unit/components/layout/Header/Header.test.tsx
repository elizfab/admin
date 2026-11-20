import { render, screen, within } from "@testing-library/react";

import { Header } from "@/components/layout/Header/Header";

jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));
jest.mock("@/lib/auth/auth-client", () => ({ authClient: { signOut: jest.fn() } }));

describe("Header", () => {
    it("é o banner da página, com o título e as ações (tema e conta)", () => {
        render(<Header userName="Liza" />);

        const banner = screen.getByRole("banner");
        expect(within(banner).getByText("Painel administrativo")).toBeInTheDocument();
        expect(
            within(banner).getByRole("button", { name: "Ativar tema escuro" }),
        ).toBeInTheDocument();
        expect(within(banner).getByRole("button", { name: /Liza/ })).toBeInTheDocument();
    });
});
