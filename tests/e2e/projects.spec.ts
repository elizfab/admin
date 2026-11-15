import { expect, test } from "@playwright/test";

import { E2E_BASE_URL } from "./support/e2e-env";

// Cada teste cria os próprios dados (nomes únicos) e não depende dos outros.

async function createProjectViaApi(
    request: import("@playwright/test").APIRequestContext,
    name: string,
) {
    const response = await request.post("/api/v1/projects", {
        data: { name },
        headers: { Origin: E2E_BASE_URL },
    });
    expect(response.status()).toBe(201);

    return (await response.json()).data as { id: string; name: string };
}

test("cria projeto, mantendo o texto quando a validação falha", async ({ page }) => {
    await page.goto("/projects/new");

    await page.getByLabel("Nome *").fill("AB");
    await page.getByLabel("Link do repositório").fill("http://inseguro.com");
    await page.getByRole("button", { name: "Criar projeto" }).click();

    await expect(page.getByText("O nome precisa ter pelo menos 3 caracteres.")).toBeVisible();
    await expect(page.getByText("Informe uma URL válida começando com https://.")).toBeVisible();
    await expect(page.getByLabel("Nome *")).toHaveValue("AB");

    await page.getByLabel("Nome *").fill("Projeto criado pela tela");
    await page.getByLabel("Link do repositório").fill("https://github.com/elizfab/admin");
    await page.getByLabel("Status").selectOption({ label: "Em andamento" });
    await page.getByRole("button", { name: "Criar projeto" }).click();

    await expect(page).toHaveURL(/\/projects$/);
    const item = page.getByRole("listitem").filter({ hasText: "Projeto criado pela tela" });
    await expect(item).toContainText("Em andamento");
});

test("impede renomear para um nome já usado", async ({ page, request }) => {
    await createProjectViaApi(request, "Nome ocupado");
    const project = await createProjectViaApi(request, "Projeto a renomear");

    await page.goto(`/projects/${project.id}/edit`);
    await page.getByLabel("Nome *").fill("Nome ocupado");
    await page.getByRole("button", { name: "Salvar alterações" }).click();

    await expect(page.locator("form").getByRole("alert")).toHaveText(
        "Já existe um projeto com este nome.",
    );
});

test("exclui só após confirmar no diálogo", async ({ page, request }) => {
    await createProjectViaApi(request, "Projeto descartável");
    await page.goto("/projects");

    const deleteButton = page.getByRole("button", {
        name: "Excluir o projeto Projeto descartável",
    });

    // Esc cancela: o projeto continua na lista.
    await deleteButton.click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toBeHidden();
    await expect(page.getByRole("heading", { name: "Projeto descartável" })).toBeVisible();

    // Confirmar exclui.
    await deleteButton.click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByRole("heading", { name: "Projeto descartável" })).toBeHidden();
});
