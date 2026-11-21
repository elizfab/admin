import { act, fireEvent, render, screen } from "@testing-library/react";

import type { FormState } from "@/modules/construction/actions/project.actions";
import {
    AddAreaForm,
    AddGoalForm,
    AddPhaseForm,
    PayInstallmentForm,
    ProjectSettingsForm,
    UnpayInstallmentButton,
} from "@/modules/construction/components/ConstructionForms/SettingsForms";
import { unpayInstallmentAction } from "@/modules/construction/actions/purchase.actions";

jest.mock("@/modules/construction/actions/purchase.actions", () => ({
    unpayInstallmentAction: jest.fn(),
}));

// A action real roda no servidor; aqui ela é um dublê que devolve o estado.
function fakeAction(result: FormState) {
    return jest.fn<Promise<FormState>, [FormState, FormData]>(async () => result);
}

async function submitForm(form: HTMLFormElement) {
    await act(async () => {
        fireEvent.submit(form);
    });
}

const project = {
    name: "Lavanderia",
    startDate: "2025-10-01",
    plannedEndDate: "2025-12-30",
    categoryIds: ["lavanderia"],
};

describe("ProjectSettingsForm", () => {
    it("renderiza nome, datas e as categorias do catálogo marcando as da obra", () => {
        render(<ProjectSettingsForm action={fakeAction(null)} project={project} />);

        expect(screen.getByLabelText(/Nome da obra/)).toHaveValue("Lavanderia");
        expect(screen.getByLabelText("Início")).toHaveValue("2025-10-01");
        expect(screen.getByLabelText("Fim previsto")).toHaveValue("2025-12-30");
        // Categorias vêm do catálogo único (grupo Lavanderia tem 3).
        expect(screen.getByLabelText("Lavanderia", { selector: "input" })).toBeChecked();
        expect(
            screen.getByLabelText("Escritório da Lavanderia", { selector: "input" }),
        ).not.toBeChecked();
        expect(
            screen.getByLabelText("Banheiro da Lavanderia", { selector: "input" }),
        ).not.toBeChecked();
    });

    it("mostra mensagem e erros por campo devolvidos pela action", async () => {
        render(
            <ProjectSettingsForm
                action={fakeAction({
                    message: "Revise os campos.",
                    fieldErrors: { name: ["Nome curto."], categoryIds: ["Inválida."] },
                })}
                project={project}
            />,
        );

        await submitForm(document.querySelector("form")!);

        expect(screen.getByRole("alert")).toHaveTextContent("Revise os campos.");
        expect(screen.getByText("Nome curto.")).toBeInTheDocument();
        expect(screen.getByText("Inválida.")).toBeInTheDocument();
    });
});

describe("AddAreaForm", () => {
    it("renderiza o campo e o botão", () => {
        render(<AddAreaForm action={fakeAction(null)} />);

        expect(screen.getByLabelText("Novo ambiente")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Adicionar" })).toBeInTheDocument();
    });

    it("mostra erro de validação do nome", async () => {
        render(
            <AddAreaForm
                action={fakeAction({ fieldErrors: { name: ["Mínimo 2 caracteres."] } })}
            />,
        );

        await submitForm(document.querySelector("form")!);

        expect(screen.getByText("Mínimo 2 caracteres.")).toBeInTheDocument();
    });
});

describe("AddPhaseForm", () => {
    it("renderiza número sugerido, nome opcional e botão", () => {
        render(<AddPhaseForm action={fakeAction(null)} suggestedNumber={4} />);

        expect(screen.getByLabelText("Número da fase")).toHaveValue(4);
        expect(screen.getByLabelText("Nome da fase")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Adicionar fase" })).toBeInTheDocument();
    });

    it("mostra mensagem e erro do número", async () => {
        render(
            <AddPhaseForm
                action={fakeAction({
                    message: "Falhou.",
                    fieldErrors: { number: ["A fase começa em 1."] },
                })}
                suggestedNumber={1}
            />,
        );

        await submitForm(document.querySelector("form")!);

        expect(screen.getByRole("alert")).toHaveTextContent("Falhou.");
        expect(screen.getByText("A fase começa em 1.")).toBeInTheDocument();
    });
});

describe("AddGoalForm", () => {
    const areas = [
        { id: "a1", name: "Geral" },
        { id: "a2", name: "Banheiro" },
    ];

    it("renderiza título e select de ambiente com as opções", () => {
        render(<AddGoalForm action={fakeAction(null)} areas={areas} />);

        expect(screen.getByLabelText("Nova meta")).toBeInTheDocument();
        const select = screen.getByLabelText("Ambiente da meta");
        expect(select).toHaveValue("");
        expect(screen.getByRole("option", { name: "Banheiro" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Adicionar meta" })).toBeInTheDocument();
    });

    it("mostra erro do título", async () => {
        render(
            <AddGoalForm
                action={fakeAction({ fieldErrors: { title: ["Informe a meta."] } })}
                areas={areas}
            />,
        );

        await submitForm(document.querySelector("form")!);

        expect(screen.getByText("Informe a meta.")).toBeInTheDocument();
    });
});

describe("PayInstallmentForm", () => {
    it("renderiza a data e o botão Confirmar", () => {
        render(<PayInstallmentForm action={fakeAction(null)} defaultDate="2026-06-10" />);

        expect(screen.getByLabelText("Data do pagamento")).toHaveValue("2026-06-10");
        expect(screen.getByRole("button", { name: "Confirmar" })).toBeInTheDocument();
    });

    it("mostra a mensagem de erro da action", async () => {
        render(
            <PayInstallmentForm
                action={fakeAction({ message: "Parcela já paga." })}
                defaultDate="2026-06-10"
            />,
        );

        await submitForm(document.querySelector("form")!);

        expect(screen.getByRole("alert")).toHaveTextContent("Parcela já paga.");
    });
});

describe("UnpayInstallmentButton", () => {
    it("chama a action de desfazer ao clicar", async () => {
        render(<UnpayInstallmentButton installmentId="i1" projectId="p1" />);

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Desfazer" }));
        });

        expect(unpayInstallmentAction).toHaveBeenCalledWith("i1", "p1");
    });
});
