import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Verificação automática de acessibilidade (WCAG 2.1 A e AA) com axe-core.
 * Pega uns 30–50% dos problemas (contraste, rótulos, ARIA inválido...);
 * o restante ainda exige teste manual com teclado e leitor de tela.
 * Cada página é verificada nos DOIS temas (claro e escuro).
 */

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const privatePages = ["/dashboard", "/projects", "/projects/new", "/documentation", "/finance"];

async function expectNoViolations(page: import("@playwright/test").Page) {
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
}

for (const path of privatePages) {
    test(`${path} não tem violações de acessibilidade (claro e escuro)`, async ({ page }) => {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expectNoViolations(page);

        // Tema escuro: o script inline do layout aplica prefers-color-scheme
        // quando não há "theme" no localStorage.
        await page.emulateMedia({ colorScheme: "dark" });
        await page.reload();
        await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
        await expectNoViolations(page);
    });
}

test.describe("páginas públicas", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("/login não tem violações de acessibilidade (claro e escuro)", async ({ page }) => {
        await page.goto("/login");
        await expectNoViolations(page);

        await page.emulateMedia({ colorScheme: "dark" });
        await page.reload();
        await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
        await expectNoViolations(page);
    });
});
