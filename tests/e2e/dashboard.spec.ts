import { expect, test, type APIRequestContext } from "@playwright/test";

import { E2E_BASE_URL } from "./support/e2e-env";

// T-0007: cards do dashboard no banco. Sessão da "dona" (storageState padrão).
// Cada teste cria cards com identificador único e o afterAll apaga o que sobrou.

const headers = { Origin: E2E_BASE_URL };
const unique = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

async function cleanup(request: APIRequestContext) {
    const response = await request.get("/api/v1/dashboard/modules");
    const { data } = (await response.json()) as { data: { id: string; slug: string }[] };

    for (const card of data.filter((m) => m.slug.startsWith("e2e-"))) {
        await request.delete(`/api/v1/dashboard/modules/${card.id}`, { headers });
    }
}

test.afterAll(async ({ request }) => cleanup(request));

test("mostra os 3 cards iniciais com o status em português", async ({ page }) => {
    await page.goto("/dashboard");

    for (const [title, status] of [
        ["Portal de Documentação Dev", "Aplicação externa"],
        ["Portal Financeiro", "Em breve"],
        ["Portal de Estudos", "Em breve"],
    ]) {
        await expect(page.getByRole("link", { name: new RegExp(title) })).toContainText(status);
    }
});

test("cadastra um card pelo modal e ele aparece no dashboard", async ({ page }) => {
    const slug = unique();
    await page.goto("/dashboard");

    await page.getByRole("button", { name: "Novo card" }).click();
    const dialog = page.getByRole("dialog", { name: "Novo card" });
    await dialog.getByLabel("Identificador *").fill(slug);
    await dialog.getByLabel("Título *").fill("Release Control");
    await dialog.getByLabel("Descrição *").fill("Controle de versões e deploys.");
    await dialog.getByLabel("Link *").fill("/release");
    await dialog.getByLabel("Ícone *").selectOption({ label: "Foguete" });
    await dialog.getByLabel("Status").selectOption({ label: "Em breve" });
    await dialog.getByRole("button", { name: "Salvar card" }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByRole("link", { name: /Release Control/ })).toContainText("Em breve");
});

test("identificador repetido mostra o erro e mantém o que foi digitado", async ({ page }) => {
    await page.goto("/dashboard");

    await page.getByRole("button", { name: "Novo card" }).click();
    const dialog = page.getByRole("dialog", { name: "Novo card" });
    await dialog.getByLabel("Identificador *").fill("finance");
    await dialog.getByLabel("Título *").fill("Outro financeiro");
    await dialog.getByLabel("Descrição *").fill("Duplicado de propósito.");
    await dialog.getByLabel("Link *").fill("/finance");
    await dialog.getByRole("button", { name: "Salvar card" }).click();

    await expect(dialog.getByRole("alert")).toHaveText("Já existe um card com este identificador.");
    await expect(dialog.getByLabel("Título *")).toHaveValue("Outro financeiro");
});

test("edita o título e exclui com confirmação", async ({ page, request }) => {
    const slug = unique();
    const created = await request.post("/api/v1/dashboard/modules", {
        headers,
        data: {
            slug,
            title: "Card temporário",
            description: "Para editar e excluir.",
            href: "/studies",
            icon: "FileText",
        },
    });
    expect(created.status()).toBe(201);

    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Editar o card Card temporário" }).click();
    const dialog = page.getByRole("dialog", { name: "Editar card" });
    await dialog.getByLabel("Título *").fill("Card editado");
    await dialog.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("link", { name: /Card editado/ })).toBeVisible();

    await page.getByRole("button", { name: "Excluir o card Card editado" }).click();
    const confirm = page.getByRole("alertdialog", { name: "Excluir card?" });
    await confirm.getByRole("button", { name: "Excluir" }).click();

    await expect(confirm).toBeHidden();
    await expect(page.getByRole("link", { name: /Card editado/ })).toHaveCount(0);
});

test("API: contrato de criação, validação e conflito", async ({ request }) => {
    const slug = unique();
    const body = {
        slug,
        title: "Via API",
        description: "Criado pela API.",
        href: "https://docs.example.com",
        icon: "Code",
    };

    const created = await request.post("/api/v1/dashboard/modules", { headers, data: body });
    expect(created.status()).toBe(201);
    const { data } = await created.json();
    expect(data).toMatchObject({ ...body, status: "AVAILABLE" });
    expect(data.ownerId).toBeDefined();

    const read = await request.get(`/api/v1/dashboard/modules/${data.id}`);
    expect(read.status()).toBe(200);

    const patched = await request.patch(`/api/v1/dashboard/modules/${data.id}`, {
        headers,
        data: { status: "EXTERNAL" },
    });
    expect((await patched.json()).data).toMatchObject({ status: "EXTERNAL", title: "Via API" });

    const duplicate = await request.post("/api/v1/dashboard/modules", { headers, data: body });
    expect(duplicate.status()).toBe(409);

    const invalid = await request.post("/api/v1/dashboard/modules", {
        headers,
        data: { ...body, slug: "Com Espaço", icon: "Skull" },
    });
    expect(invalid.status()).toBe(400);
    const { error } = await invalid.json();
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(Object.keys(error.fieldErrors)).toEqual(expect.arrayContaining(["slug", "icon"]));

    expect((await request.get("/api/v1/dashboard/modules/nao-e-cuid")).status()).toBe(400);
    expect(
        (await request.delete(`/api/v1/dashboard/modules/${data.id}`, { headers })).status(),
    ).toBe(204);
});
