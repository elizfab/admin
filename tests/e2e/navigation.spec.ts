import { expect, test } from "@playwright/test";

// Usa a sessão da "dona" (storageState padrão do projeto chromium).

// Módulos do menu lateral (src/components/layout/Sidebar/navigation.ts).
const modules = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Projetos", path: "/projects" },
    { label: "Estudos", path: "/studies" },
    { label: "Financeiro", path: "/finance" },
];

test("raiz leva ao dashboard com os cards de módulo", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
    // Cards iniciais vindos do banco (seed / migration, T-0007).
    await expect(page.getByRole("link", { name: /Portal Financeiro/ })).toBeVisible();
});

test("navega por todos os módulos pela sidebar", async ({ page }) => {
    await page.goto("/dashboard");
    const nav = page.getByRole("navigation", { name: "Navegação principal" });

    for (const { label, path } of modules) {
        await nav.getByRole("link", { name: label }).click();

        await expect(page).toHaveURL(new RegExp(`${path}$`));
        await expect(nav.getByRole("link", { name: label })).toHaveAttribute(
            "aria-current",
            "page",
        );
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
});

test("card do dashboard abre a página de documentação", async ({ page }) => {
    await page.goto("/dashboard");

    await page.getByRole("link", { name: /Documentação/ }).click();

    await expect(page).toHaveURL(/\/documentation$/);
    await expect(page.getByRole("heading", { level: 1, name: "Documentação" })).toBeVisible();
});

// PLAT-R16 (T-0009, alterada em T-0021): Voltar sobe um nível.
// Módulos voltam ao início (Dashboard); a aba Construção volta ao Financeiro.
for (const { path, label, target } of [
    { path: "/finance", label: "Voltar ao início", target: /\/dashboard$/ },
    { path: "/finance/construction", label: "Voltar ao Financeiro", target: /\/finance$/ },
    { path: "/projects", label: "Voltar ao início", target: /\/dashboard$/ },
    { path: "/studies", label: "Voltar ao início", target: /\/dashboard$/ },
]) {
    test(`${path}: "${label}"`, async ({ page }) => {
        await page.goto(path);

        await page.getByRole("link", { name: label }).click();

        await expect(page).toHaveURL(target);
    });
}

test("mostra a página 404 em português", async ({ page }) => {
    await page.goto("/rota-que-nao-existe");

    await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
});
