import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { LoginForm } from "@/modules/auth/components/LoginForm/LoginForm";

// Dublês: o teste não chama o servidor de verdade nem o roteador do Next.js.
const signInEmail = jest.fn();
const push = jest.fn();

jest.mock("@/lib/auth/auth-client", () => ({
    authClient: { signIn: { email: (...args: unknown[]) => signInEmail(...args) } },
}));

jest.mock("next/navigation", () => ({
    useRouter: () => ({ push, refresh: jest.fn() }),
}));

function fillAndSubmit(email: string, password: string) {
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: email } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: password } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
}

describe("LoginForm", () => {
    beforeEach(() => {
        signInEmail.mockReset();
        push.mockReset();
    });

    it("envia e-mail e senha e redireciona para o dashboard", async () => {
        signInEmail.mockResolvedValue({ error: null });
        render(<LoginForm />);

        fillAndSubmit("admin@example.com", "senha-correta-123");

        await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
        expect(signInEmail).toHaveBeenCalledWith({
            email: "admin@example.com",
            password: "senha-correta-123",
        });
    });

    it("mostra mensagem genérica quando as credenciais são inválidas", async () => {
        signInEmail.mockResolvedValue({ error: { status: 401 } });
        render(<LoginForm />);

        fillAndSubmit("admin@example.com", "errada");

        expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha inválidos.");
        expect(push).not.toHaveBeenCalled();
    });

    it("avisa quando o limite de tentativas foi atingido (429)", async () => {
        signInEmail.mockResolvedValue({ error: { status: 429 } });
        render(<LoginForm />);

        fillAndSubmit("admin@example.com", "errada");

        expect(await screen.findByRole("alert")).toHaveTextContent("Muitas tentativas");
    });
});
