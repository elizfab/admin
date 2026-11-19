import { act, fireEvent, render, screen } from "@testing-library/react";

import { deleteDashboardModuleAction } from "@/modules/dashboard/actions/dashboard-module.actions";
import { DeleteModuleButton } from "@/modules/dashboard/components/DeleteModuleButton/DeleteModuleButton";

jest.mock("@/modules/dashboard/actions/dashboard-module.actions", () => ({
    deleteDashboardModuleAction: jest.fn(),
}));

const deleteAction = jest.mocked(deleteDashboardModuleAction);

beforeEach(() => jest.resetAllMocks());

function openDialog() {
    render(<DeleteModuleButton moduleId="c1" moduleTitle="Release Control" />);
    fireEvent.click(screen.getByRole("button", { name: "Excluir o card Release Control" }));
}

describe("DeleteModuleButton", () => {
    it("pede confirmação antes de excluir", () => {
        openDialog();

        expect(screen.getByRole("alertdialog", { name: "Excluir card?" })).toHaveTextContent(
            "O card “Release Control” será excluído",
        );
        expect(deleteAction).not.toHaveBeenCalled();
    });

    it("exclui ao confirmar e fecha o diálogo", async () => {
        deleteAction.mockResolvedValue(null);
        openDialog();

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
        });

        expect(deleteAction).toHaveBeenCalledWith("c1");
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("mostra o erro e mantém o diálogo aberto quando falha", async () => {
        deleteAction.mockResolvedValue({ message: "Card não encontrado." });
        openDialog();

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
        });

        expect(screen.getByRole("alert")).toHaveTextContent("Card não encontrado.");
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
});
