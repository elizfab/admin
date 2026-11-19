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
    // Dois cards no dashboard: Documentação e Financeiro (modules.mock.ts).
    await expect(page.locator("main a[href^='/']")).toHaveCount(2);
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

// PLAT-R16 (T-0009): páginas de módulo têm "Voltar ao início".
for (const path of ["/finance", "/finance/construction", "/projects", "/studies"]) {
    test(`${path} tem "Voltar ao início" para o Dashboard`, async ({ page }) => {
        await page.goto(path);

        await page.getByRole("link", { name: "Voltar ao início" }).click();

        await expect(page).toHaveURL(/\/dashboard$/);
    });
}

test("mostra a página 404 em português", async ({ page }) => {
    await page.goto("/rota-que-nao-existe");

    await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
});
