import { expect, test } from "@playwright/test";

import { E2E_BASE_URL, testUsers } from "./support/e2e-env";

/**
 * Isolamento entre usuárias (OWASP API1 — Broken Object Level Authorization):
 * a "outra" não pode ver, alterar nem excluir o projeto da "dona".
 */

let projectId: string;

test.beforeAll(async ({ playwright }) => {
    const owner = await playwright.request.newContext({
        baseURL: E2E_BASE_URL,
        storageState: testUsers.owner.storageState,
    });

    const response = await owner.post("/api/v1/projects", {
        data: { name: "Projeto confidencial da dona" },
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

        await expect(page.getByText("Projeto confidencial da dona")).toBeHidden();
    });

    test("a tela de edição responde página não encontrada", async ({ page }) => {
        await page.goto(`/projects/${projectId}/edit`);

        await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
    });
});

test("o projeto da dona continua intacto", async ({ request }) => {
    const response = await request.get(`/api/v1/projects/${projectId}`);

    expect(response.status()).toBe(200);
    expect((await response.json()).data.name).toBe("Projeto confidencial da dona");
});
