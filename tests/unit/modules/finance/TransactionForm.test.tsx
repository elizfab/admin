import { act, fireEvent, render, screen } from "@testing-library/react";

import type { TransactionFormState } from "@/modules/finance/actions/transaction.actions";
import { TransactionForm } from "@/modules/finance/components/TransactionForm/TransactionForm";

// Os campos da obra têm componente e testes próprios: aqui basta saber se aparecem.
jest.mock(
    "@/modules/construction/components/ConstructionPaymentFields/ConstructionPaymentFields",
    () => ({
        ConstructionPaymentFields: ({ message }: { message?: string }) => (
            <div data-testid="construction-fields">{message}</div>
        ),
    }),
);

type Action = (state: TransactionFormState, formData: FormData) => Promise<TransactionFormState>;
const fakeAction = (result: TransactionFormState) =>
    jest.fn<ReturnType<Action>, Parameters<Action>>(async () => result);

const defaults = {
    defaultDate: "2026-11-20",
    cancelHref: "/finance?month=2026-11",
    submitLabel: "Salvar transação",
};
const projects = [{ projectId: "p1", projectName: "Telhado", areas: [], phases: [], services: [] }];

async function submit() {
    await act(async () => {
        fireEvent.submit(document.querySelector("form")!);
    });
}

describe("TransactionForm", () => {
    it("nova transação: despesa, categoria Outros, data padrão, Cancelar e salvar", () => {
        render(<TransactionForm action={fakeAction(null)} {...defaults} />);

        expect(screen.getByRole("radio", { name: "Despesa" })).toBeChecked();
        expect(screen.getByLabelText("Categoria")).toHaveValue("OTHER");
        expect(screen.getByLabelText("Data *")).toHaveValue("2026-11-20");
        expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute(
            "href",
            "/finance?month=2026-11",
        );
        expect(screen.getByRole("button", { name: "Salvar transação" })).toBeInTheDocument();
        // Sem obras, não há a opção do atalho da Construção.
        expect(screen.queryByRole("option", { name: "Construção" })).not.toBeInTheDocument();
    });

    it("edição: começa com os dados da transação", () => {
        render(
            <TransactionForm
                action={fakeAction(null)}
                {...defaults}
                transaction={{
                    type: "INCOME",
                    description: "Salário",
                    amountCents: 123456,
                    category: "SALARY",
                    occurredOn: new Date("2026-11-05T00:00:00.000Z"),
                }}
            />,
        );

        expect(screen.getByRole("radio", { name: "Receita" })).toBeChecked();
        expect(screen.getByLabelText("Descrição *")).toHaveValue("Salário");
        expect(screen.getByLabelText("Valor (R$) *")).toHaveValue("1.234,56");
        expect(screen.getByLabelText("Data *")).toHaveValue("2026-11-05");
    });

    it("erro: mensagem geral, erros por campo e o que foi digitado continua", async () => {
        const action = fakeAction({
            message: "Revise os campos.",
            fieldErrors: {
                type: ["Escolha o tipo."],
                description: ["Informe a descrição."],
                amountCents: ["Informe um valor válido, por exemplo 1.234,56."],
                occurredOn: ["Informe a data."],
            },
            values: {
                type: "EXPENSE",
                description: "M",
                amountCents: "abc",
                category: "FOOD",
                occurredOn: "",
            },
        });
        render(<TransactionForm action={action} {...defaults} />);

        await submit();

        expect(screen.getByRole("alert")).toHaveTextContent("Revise os campos.");
        expect(screen.getByText("Escolha o tipo.")).toBeInTheDocument();
        expect(screen.getByLabelText("Descrição *")).toHaveAccessibleDescription(
            "Informe a descrição.",
        );
        expect(screen.getByLabelText("Valor (R$) *")).toHaveValue("abc");
        expect(screen.getByLabelText("Valor (R$) *")).toHaveAttribute("aria-invalid", "true");
        expect(screen.getByLabelText("Data *")).toHaveAccessibleDescription("Informe a data.");
    });

    it('atalho "Construção": troca os campos pelos da obra e o envio para registrar pagamento', async () => {
        const action = fakeAction(null);
        const constructionAction = jest.fn(async () => ({ message: "Escolha o serviço." }));
        render(
            <TransactionForm
                action={action}
                constructionAction={constructionAction}
                obraProjects={projects}
                {...defaults}
            />,
        );

        fireEvent.change(screen.getByLabelText("Categoria"), {
            target: { value: "__OBRA_PAYMENT__" },
        });

        expect(screen.getByRole("option", { name: "Construção" })).toBeInTheDocument();
        expect(screen.getByTestId("construction-fields")).toBeInTheDocument();
        expect(screen.queryByLabelText("Descrição *")).not.toBeInTheDocument();

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Registrar pagamento" }));
        });

        expect(constructionAction).toHaveBeenCalledTimes(1);
        expect(action).not.toHaveBeenCalled();
        expect(screen.getByTestId("construction-fields")).toHaveTextContent("Escolha o serviço.");
    });

    it("voltar para uma categoria comum restaura os campos da transação", () => {
        render(<TransactionForm action={fakeAction(null)} obraProjects={projects} {...defaults} />);
        const category = screen.getByLabelText("Categoria");

        fireEvent.change(category, { target: { value: "__OBRA_PAYMENT__" } });
        // Sem constructionAction, o botão continua sendo o de salvar a transação.
        expect(screen.getByRole("button", { name: "Salvar transação" })).toBeInTheDocument();

        fireEvent.change(category, { target: { value: "FOOD" } });
        expect(screen.getByLabelText("Descrição *")).toBeInTheDocument();
    });
});
