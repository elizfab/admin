import { expect, test } from "@playwright/test";

import { testUsers } from "./support/e2e-env";

// Estes testes simulam uma visitante SEM sessão.
test.use({ storageState: { cookies: [], origins: [] } });

const owner = testUsers.owner;

test("redireciona visitante sem sessão para o login", async ({ page }) => {
    await page.goto("/projects");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Bem-vinda de volta" })).toBeVisible();
});

test("mostra mensagem genérica para credenciais inválidas", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(owner.email);
    await page.getByLabel("Senha", { exact: true }).fill("senha-errada-123");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.locator("form").getByRole("alert")).toHaveText("E-mail ou senha inválidos.");
    await expect(page).toHaveURL(/\/login$/);
});

test("faz login, mostra o nome, sai e não consegue voltar", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(owner.email);
    await page.getByLabel("Senha", { exact: true }).fill(owner.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("banner")).toContainText(owner.name);

    await page.getByRole("button", { name: owner.name }).click();
    await page.getByRole("menuitem", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login$/);

    // A sessão foi encerrada no servidor: voltar ao dashboard não funciona.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
});
