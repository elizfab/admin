import { act, fireEvent, render, screen } from "@testing-library/react";

import type { FormState } from "@/modules/construction/actions/project.actions";
import { NewConstructionProjectDialog } from "@/modules/construction/components/NewConstructionProjectDialog/NewConstructionProjectDialog";

// O SettingsForms também exporta formulários de parcelas, que importam Server Actions
// (internos do Next que não existem no jsdom): o modal não usa essas actions.
jest.mock("@/modules/construction/actions/purchase.actions", () => ({
    unpayInstallmentAction: jest.fn(),
}));

function fakeAction(result: FormState) {
    return jest.fn<Promise<FormState>, [FormState, FormData]>(async () => result);
}

function open() {
    fireEvent.click(screen.getByRole("button", { name: "Nova obra" }));
}

describe("NewConstructionProjectDialog", () => {
    it('abre o modal "Nova obra" com os campos do cadastro de obra', () => {
        render(<NewConstructionProjectDialog action={fakeAction(null)} />);

        open();

        expect(screen.getByRole("dialog", { name: "Nova obra" })).toBeInTheDocument();
        expect(screen.getByLabelText("Nome da obra *")).toHaveValue("");
        expect(screen.getByLabelText("Início")).toBeInTheDocument();
        expect(screen.getByLabelText("Fim previsto")).toBeInTheDocument();
    });

    it("envia para a action de criar obra e mostra o erro sem fechar", async () => {
        const action = fakeAction({ fieldErrors: { name: ["Informe o nome da obra."] } });
        render(<NewConstructionProjectDialog action={action} />);
        open();

        fireEvent.change(screen.getByLabelText("Nome da obra *"), { target: { value: "T" } });
        await act(async () => {
            fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
        });

        expect(action).toHaveBeenCalledTimes(1);
        expect(action.mock.calls[0][1].get("name")).toBe("T");
        expect(screen.getByText("Informe o nome da obra.")).toBeInTheDocument();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("Fechar cancela sem enviar; ao abrir de novo o formulário vem limpo", async () => {
        const action = fakeAction({ message: "Erro anterior" });
        render(<NewConstructionProjectDialog action={action} />);
        open();
        await act(async () => {
            fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
        });
        expect(screen.getByRole("alert")).toHaveTextContent("Erro anterior");

        fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

        open();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
});
