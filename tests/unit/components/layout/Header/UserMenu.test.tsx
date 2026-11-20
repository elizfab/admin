import { act, fireEvent, render, screen } from "@testing-library/react";

import { UserMenu } from "@/components/layout/Header/UserMenu/UserMenu";
import { useSignOut } from "@/components/layout/Header/UserMenu/useSignOut";

jest.mock("@/components/layout/Header/UserMenu/useSignOut", () => ({ useSignOut: jest.fn() }));

const signOut = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useSignOut).mockReturnValue(signOut);
});

function openMenu() {
    // Radix abre o menu pelo teclado (Enter) no botão do usuário.
    fireEvent.keyDown(screen.getByRole("button", { name: /Liza/ }), { key: "Enter" });
}

describe("UserMenu", () => {
    it("mostra o nome da usuária no botão (visível no desktop, sempre acessível)", () => {
        render(<UserMenu userName="Liza" />);

        expect(screen.getByRole("button", { name: /Liza/ })).toHaveAttribute(
            "aria-haspopup",
            "menu",
        );
    });

    it("abre o menu da conta com Perfil (desabilitado) e Sair", () => {
        render(<UserMenu userName="Liza" />);

        openMenu();

        expect(screen.getByRole("menu")).toHaveTextContent("Conta");
        expect(screen.getByRole("menuitem", { name: /Perfil/ })).toHaveAttribute("data-disabled");
        expect(screen.getByRole("menuitem", { name: "Sair" })).toBeInTheDocument();
    });

    it('"Sair" encerra a sessão', async () => {
        render(<UserMenu userName="Liza" />);
        openMenu();

        await act(async () => {
            fireEvent.click(screen.getByRole("menuitem", { name: "Sair" }));
        });

        expect(signOut).toHaveBeenCalledTimes(1);
    });
});
