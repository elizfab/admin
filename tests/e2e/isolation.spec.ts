import { expect, test } from "@playwright/test";

import { E2E_BASE_URL, testUsers } from "./support/e2e-env";

/**
 * Isolamento entre usuárias (OWASP API1 — Broken Object Level Authorization):
 * a "outra" não pode ver, alterar nem excluir o projeto da "dona".
 */

let projectId: string;
// Nome único por execução: o teste precisa passar com --repeat-each=3 (nome único por dona).
const projectName = `Projeto confidencial da dona ${Date.now()}`;

test.beforeAll(async ({ playwright }) => {
    const owner = await playwright.request.newContext({
        baseURL: E2E_BASE_URL,
        storageState: testUsers.owner.storageState,
    });

    const response = await owner.post("/api/v1/projects", {
        data: { name: projectName },
        headers: { Origin: E2E_BASE_URL },
    });
    expect(response.status()).toBe(201);
    projectId = (await response.json()).data.id;

    await owner.dispose();
});

test.describe("como a OUTRA usuária", () => {
    test.use({ storageState: testUsers.other.storageState });

    test("a API responde 404 para ler, alterar e excluir", async ({ request }) => {
        const headers = { Origin: E2E_BASE_URL };
        const url = `/api/v1/projects/${projectId}`;

        expect((await request.get(url)).status()).toBe(404);
        expect((await request.patch(url, { data: { name: "invadido" }, headers })).status()).toBe(
            404,
        );
        expect((await request.delete(url, { headers })).status()).toBe(404);
    });

    test("a lista não mostra o projeto da dona", async ({ page }) => {
        await page.goto("/projects");

        await expect(page.getByText(projectName)).toBeHidden();
    });

    test("a tela de edição responde página não encontrada", async ({ page }) => {
        await page.goto(`/projects/${projectId}/edit`);

        await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
    });
});

test.afterAll(async ({ playwright }) => {
    const owner = await playwright.request.newContext({
        baseURL: E2E_BASE_URL,
        storageState: testUsers.owner.storageState,
    });
    await owner.delete(`/api/v1/projects/${projectId}`, { headers: { Origin: E2E_BASE_URL } });
    await owner.dispose();
});

test("o projeto da dona continua intacto", async ({ request }) => {
    const response = await request.get(`/api/v1/projects/${projectId}`);

    expect(response.status()).toBe(200);
    expect((await response.json()).data.name).toBe(projectName);
});

test.describe("Financeiro: a OUTRA usuária não acessa transações da dona", () => {
    let transactionId: string;

    test.beforeAll(async ({ playwright }) => {
        const owner = await playwright.request.newContext({
            baseURL: E2E_BASE_URL,
            storageState: testUsers.owner.storageState,
        });

        const response = await owner.post("/api/v1/finance/transactions", {
            data: {
                type: "EXPENSE",
                description: "Despesa confidencial da dona",
                amountCents: 12300,
                occurredOn: "2026-06-15",
            },
            headers: { Origin: E2E_BASE_URL },
        });
        expect(response.status()).toBe(201);
        transactionId = (await response.json()).data.id;

        await owner.dispose();
    });

    test.use({ storageState: testUsers.other.storageState });

    test("API responde 404 e o resumo da outra não soma a despesa", async ({ request }) => {
        const headers = { Origin: E2E_BASE_URL };
        const url = `/api/v1/finance/transactions/${transactionId}`;

        expect((await request.get(url)).status()).toBe(404);
        const patch = await request.patch(url, { data: { description: "invadido" }, headers });
        expect(patch.status()).toBe(404);
        expect((await request.delete(url, { headers })).status()).toBe(404);

        const summary = await request.get("/api/v1/finance/summary?month=2026-06");
        expect((await summary.json()).data.expenseCents).toBe(0);
    });

    test("a tela de edição responde página não encontrada", async ({ page }) => {
        await page.goto(`/finance/transactions/${transactionId}/edit`);

        await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
    });
});

test.describe("Dashboard: a OUTRA usuária não acessa os cards da dona (T-0007)", () => {
    let cardId: string;

    test.beforeAll(async ({ playwright }) => {
        const owner = await playwright.request.newContext({
            baseURL: E2E_BASE_URL,
            storageState: testUsers.owner.storageState,
        });

        const response = await owner.post("/api/v1/dashboard/modules", {
            data: {
                slug: `e2e-confidencial-${Date.now()}`,
                title: "Card confidencial da dona",
                description: "Só a dona vê.",
                href: "/projects",
                icon: "FolderKanban",
            },
            headers: { Origin: E2E_BASE_URL },
        });
        expect(response.status()).toBe(201);
        cardId = (await response.json()).data.id;

        await owner.dispose();
    });

    test.afterAll(async ({ playwright }) => {
        const owner = await playwright.request.newContext({
            baseURL: E2E_BASE_URL,
            storageState: testUsers.owner.storageState,
        });
        await owner.delete(`/api/v1/dashboard/modules/${cardId}`, {
            headers: { Origin: E2E_BASE_URL },
        });
        await owner.dispose();
    });

    test.describe("como a OUTRA usuária", () => {
        test.use({ storageState: testUsers.other.storageState });

        test("a API responde 404 para ler, alterar e excluir", async ({ request }) => {
            const headers = { Origin: E2E_BASE_URL };
            const url = `/api/v1/dashboard/modules/${cardId}`;

            expect((await request.get(url)).status()).toBe(404);
            expect(
                (await request.patch(url, { data: { title: "invadido" }, headers })).status(),
            ).toBe(404);
            expect((await request.delete(url, { headers })).status()).toBe(404);
        });

        test("o dashboard e a lista da API não mostram o card da dona", async ({
            page,
            request,
        }) => {
            await page.goto("/dashboard");
            await expect(page.getByText("Card confidencial da dona")).toBeHidden();

            const { data } = await (await request.get("/api/v1/dashboard/modules")).json();
            expect(data.map((m: { id: string }) => m.id)).not.toContain(cardId);
        });
    });

    test("o card da dona continua intacto", async ({ request }) => {
        const response = await request.get(`/api/v1/dashboard/modules/${cardId}`);

        expect(response.status()).toBe(200);
        expect((await response.json()).data.title).toBe("Card confidencial da dona");
    });
});
