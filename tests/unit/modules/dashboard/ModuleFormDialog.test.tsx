import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { DashboardModuleFormState } from "@/modules/dashboard/actions/dashboard-module.actions";
import { ModuleFormDialog } from "@/modules/dashboard/components/ModuleFormDialog/ModuleFormDialog";

// A action real roda no servidor; aqui ela é um dublê que devolve o estado.
function fakeAction(result: DashboardModuleFormState) {
    return jest.fn<Promise<DashboardModuleFormState>, [DashboardModuleFormState, FormData]>(
        async () => result,
    );
}

const card = {
    slug: "studies",
    title: "Portal de Estudos",
    description: "Recursos e materiais para estudo.",
    href: "/studies",
    icon: "FilePenLine",
    status: "SOON",
};

async function submit() {
    await act(async () => {
        fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
    });
}

describe("ModuleFormDialog: cadastrar", () => {
    it('abre o modal "Novo card" com os campos e o status padrão Disponível', () => {
        render(<ModuleFormDialog action={fakeAction({ ok: true })} />);

        fireEvent.click(screen.getByRole("button", { name: "Novo card" }));

        expect(screen.getByRole("dialog", { name: "Novo card" })).toBeInTheDocument();
        for (const label of [
            "Identificador *",
            "Título *",
            "Descrição *",
            "Link *",
            "Ícone *",
            "Status",
        ]) {
            expect(screen.getByLabelText(label)).toBeInTheDocument();
        }
        expect(screen.getByLabelText("Status")).toHaveValue("AVAILABLE");
        expect(screen.getByRole("option", { name: "Poupança" })).toBeInTheDocument();
    });

    it("envia o formulário e fecha o modal quando salva", async () => {
        const action = fakeAction({ ok: true });
        render(<ModuleFormDialog action={action} />);
        fireEvent.click(screen.getByRole("button", { name: "Novo card" }));

        fireEvent.change(screen.getByLabelText("Identificador *"), {
            target: { value: "release" },
        });
        await submit();

        expect(action).toHaveBeenCalledTimes(1);
        const formData = action.mock.calls[0][1];
        expect(formData.get("slug")).toBe("release");
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("mostra a mensagem geral e os erros por campo, mantendo o que foi digitado", async () => {
        const action = fakeAction({
            message: "Já existe um card com este identificador.",
            fieldErrors: {
                slug: ["Use só letras minúsculas, números e hífen (ex.: release-control)."],
            },
            values: { ...card, slug: "Com Espaço" },
        });
        render(<ModuleFormDialog action={action} />);
        fireEvent.click(screen.getByRole("button", { name: "Novo card" }));

        await submit();

        expect(screen.getByRole("alert")).toHaveTextContent(
            "Já existe um card com este identificador.",
        );
        const slug = screen.getByLabelText("Identificador *");
        expect(slug).toHaveValue("Com Espaço");
        expect(slug).toHaveAttribute("aria-invalid", "true");
        expect(slug).toHaveAccessibleDescription(/Use só letras minúsculas/);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("Cancelar fecha sem enviar", () => {
        const action = fakeAction({ ok: true });
        render(<ModuleFormDialog action={action} />);
        fireEvent.click(screen.getByRole("button", { name: "Novo card" }));

        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(action).not.toHaveBeenCalled();
    });
});

describe("ModuleFormDialog: editar", () => {
    it("abre preenchido com os dados do card", () => {
        render(<ModuleFormDialog action={fakeAction({ ok: true })} module={card} />);

        fireEvent.click(screen.getByRole("button", { name: "Editar o card Portal de Estudos" }));

        expect(screen.getByRole("dialog", { name: "Editar card" })).toBeInTheDocument();
        expect(screen.getByLabelText("Título *")).toHaveValue("Portal de Estudos");
        expect(screen.getByLabelText("Ícone *")).toHaveValue("FilePenLine");
        expect(screen.getByLabelText("Status")).toHaveValue("SOON");
        expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument();
    });
});
