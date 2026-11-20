import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { E2E_BASE_URL } from "./support/e2e-env";

/**
 * Verificação automática de acessibilidade (WCAG 2.1 A e AA) com axe-core.
 * Pega uns 30–50% dos problemas (contraste, rótulos, ARIA inválido...);
 * o restante ainda exige teste manual com teclado e leitor de tela.
 * Cada página é verificada nos DOIS temas (claro e escuro).
 */

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const privatePages = [
    "/dashboard",
    "/projects",
    "/projects/new",
    "/documentation",
    "/finance",
    "/finance/transactions/new",
    "/finance/construction",
    "/studies",
];

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

test('modal "Novo card" do Dashboard não tem violações (claro e escuro)', async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Novo card" }).click();
    await expect(page.getByRole("dialog", { name: "Novo card" })).toBeVisible();
    await expectNoViolations(page);

    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: "Novo card" }).click();
    await expect(page.getByRole("dialog", { name: "Novo card" })).toBeVisible();
    await expectNoViolations(page);
});

test('modal "Nova obra" da Construção não tem violações (claro e escuro)', async ({ page }) => {
    await page.goto("/finance/construction");
    await page.getByRole("button", { name: "Nova obra" }).click();
    await expect(page.getByRole("dialog", { name: "Nova obra" })).toBeVisible();
    await expectNoViolations(page);

    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: "Nova obra" }).click();
    await expect(page.getByRole("dialog", { name: "Nova obra" })).toBeVisible();
    await expectNoViolations(page);
});

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

test.describe("telas da obra (Fase 09)", () => {
    let base: string;
    let phaseNumber: number;

    test.beforeAll(async ({ request }) => {
        const created = await request.post("/api/v1/finance/construction/projects", {
            data: { name: `Obra A11y ${Date.now()}` },
            headers: { Origin: E2E_BASE_URL },
        });
        expect(created.status()).toBe(201);
        const { data: createdProject } = (await created.json()) as { data: { id: string } };
        // O POST devolve a obra sem os includes; busca com ambientes/fases.
        const detail = await request.get(
            `/api/v1/finance/construction/projects/${createdProject.id}`,
        );
        const { data: project } = (await detail.json()) as {
            data: { id: string; phases: { number: number }[] };
        };
        base = `/finance/construction/${project.id}`;
        phaseNumber = project.phases[0].number;
    });

    const obraPages = () => [
        base,
        `${base}/phases/${phaseNumber}`,
        `${base}/services`,
        `${base}/services/new`,
        `${base}/payments`,
        `${base}/payments/new`,
        `${base}/purchases`,
        `${base}/purchases/new`,
        `${base}/goals`,
        `${base}/settings`,
    ];

    test("nenhuma tela da obra tem violações (claro)", async ({ page }) => {
        for (const path of obraPages()) {
            await page.goto(path);
            await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
            await expectNoViolations(page);
        }
    });

    test("dashboard da obra não tem violações (escuro)", async ({ page }) => {
        await page.goto(base);
        await page.emulateMedia({ colorScheme: "dark" });
        await page.reload();
        await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
        await expectNoViolations(page);
    });
});
