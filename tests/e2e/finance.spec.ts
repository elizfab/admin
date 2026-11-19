import { expect, test, type APIRequestContext } from "@playwright/test";

import { E2E_BASE_URL } from "./support/e2e-env";

/**
 * Financeiro: cada teste usa um MÊS PRÓPRIO e começa APAGANDO esse mês.
 * Assim ele não soma valores de outro teste nem de uma tentativa anterior
 * (retries do CI). Os dados entram pela API (rápido) e a tela é verificada
 * pelo navegador.
 */

/** Exclui todas as transações do mês (da usuária logada) pela própria API. */
async function clearMonth(request: APIRequestContext, month: string) {
    const response = await request.get(`/api/v1/finance/transactions?month=${month}`);
    const { data } = (await response.json()) as { data: { id: string }[] };

    for (const { id } of data) {
        const deleted = await request.delete(`/api/v1/finance/transactions/${id}`, {
            headers: { Origin: E2E_BASE_URL },
        });
        expect(deleted.status()).toBe(204);
    }
}

async function createTransactionViaApi(
    request: APIRequestContext,
    data: {
        type: "INCOME" | "EXPENSE";
        description: string;
        amountCents: number;
        occurredOn: string;
        category?: string;
    },
) {
    const response = await request.post("/api/v1/finance/transactions", {
        data,
        headers: { Origin: E2E_BASE_URL },
    });
    expect(response.status()).toBe(201);

    return (await response.json()).data as { id: string };
}

test("cria despesa pela tela, mantendo o texto quando a validação falha", async ({
    page,
    request,
}) => {
    await clearMonth(request, "2026-03");
    await page.goto("/finance");
    await page.getByRole("link", { name: "Nova transação" }).click();
    await expect(page).toHaveURL(/\/finance\/transactions\/new$/);

    await page.getByLabel("Descrição *").fill("Mercado do mês");
    await page.getByLabel("Valor (R$) *").fill("abc");
    await page.getByRole("button", { name: "Salvar transação" }).click();

    await expect(page.getByText("Informe um valor válido, por exemplo 1.234,56.")).toBeVisible();
    await expect(page.getByLabel("Descrição *")).toHaveValue("Mercado do mês");

    await page.getByLabel("Valor (R$) *").fill("1.234,56");
    await page.getByLabel("Data *").fill("2026-03-10");
    await page.getByLabel("Categoria").selectOption({ label: "Alimentação" });
    await page.getByRole("button", { name: "Salvar transação" }).click();

    // Volta para o painel NO MÊS da transação.
    await expect(page).toHaveURL(/\/finance\?month=2026-03$/);
    const item = page.getByRole("listitem").filter({ hasText: "Mercado do mês" });
    await expect(item).toContainText("10/03/2026 · Alimentação");
    await expect(item).toContainText("1.234,56");
});

test("resumo do mês soma receitas e despesas", async ({ page, request }) => {
    await clearMonth(request, "2026-04");
    const april = (day: string) => `2026-04-${day}`;

    await createTransactionViaApi(request, {
        type: "INCOME",
        description: "Salário",
        amountCents: 500000,
        occurredOn: april("05"),
        category: "SALARY",
    });
    await createTransactionViaApi(request, {
        type: "EXPENSE",
        description: "Aluguel",
        amountCents: 150000,
        occurredOn: april("10"),
        category: "HOUSING",
    });
    await createTransactionViaApi(request, {
        type: "EXPENSE",
        description: "Feira",
        amountCents: 25050,
        occurredOn: april("12"),
        category: "FOOD",
    });

    await page.goto("/finance?month=2026-04");

    await expect(page.getByRole("heading", { level: 2, name: /abril de 2026/i })).toBeVisible();
    const summary = page.getByRole("region", { name: "Resumo do mês" });
    await expect(summary).toContainText("Receitas");
    await expect(summary).toContainText("5.000,00");
    await expect(summary).toContainText("1.750,50");
    await expect(summary).toContainText("3.249,50");
    // Moradia é a maior despesa: aparece primeiro.
    await expect(summary.getByRole("listitem").first()).toContainText("Moradia");

    // A API devolve o mesmo resumo.
    const response = await request.get("/api/v1/finance/summary?month=2026-04");
    expect((await response.json()).data).toMatchObject({
        incomeCents: 500000,
        expenseCents: 175050,
        balanceCents: 324950,
    });
});

test("navega entre meses pelos links", async ({ page }) => {
    await page.goto("/finance?month=2026-01");

    await page.getByRole("link", { name: /Mês anterior/ }).click();
    await expect(page).toHaveURL(/month=2025-12$/);
    await expect(page.getByRole("heading", { level: 2, name: /dezembro de 2025/i })).toBeVisible();
});

test("edita e exclui uma transação", async ({ page, request }) => {
    await clearMonth(request, "2026-05");
    const { id } = await createTransactionViaApi(request, {
        type: "EXPENSE",
        description: "Cinema",
        amountCents: 4000,
        occurredOn: "2026-05-20",
    });

    await page.goto(`/finance/transactions/${id}/edit`);
    await expect(page.getByLabel("Valor (R$) *")).toHaveValue("40,00");
    await page.getByLabel("Descrição *").fill("Cinema e pipoca");
    await page.getByLabel("Valor (R$) *").fill("55,90");
    await page.getByRole("button", { name: "Salvar alterações" }).click();

    await expect(page).toHaveURL(/month=2026-05$/);
    await expect(page.getByText("Cinema e pipoca")).toBeVisible();

    await page.getByRole("button", { name: "Excluir a transação Cinema e pipoca" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Excluir" }).click();
    // Após confirmar, o diálogo fecha e a lista do mês fica vazia.
    await expect(page.getByRole("alertdialog")).toBeHidden();
    await expect(page.getByText("Nenhuma transação neste mês.")).toBeVisible();
});

test("API: mês inválido é 400 e valor fracionado é recusado", async ({ request }) => {
    expect((await request.get("/api/v1/finance/transactions?month=2026-13")).status()).toBe(400);

    const response = await request.post("/api/v1/finance/transactions", {
        data: { type: "EXPENSE", description: "X", amountCents: 10.5, occurredOn: "2026-05-01" },
        headers: { Origin: E2E_BASE_URL },
    });
    expect(response.status()).toBe(400);
});

// FIN-R11 (T-0008): abas Transações | Obra, com a aba atual marcada.
test("navega pelas abas Transações e Obra", async ({ page }) => {
    await page.goto("/finance");
    const tabs = page.getByRole("navigation", { name: "Seções do Financeiro" });

    await expect(tabs.getByRole("link", { name: "Transações" })).toHaveAttribute(
        "aria-current",
        "page",
    );
    // "Nova transação" fica dentro do conteúdo da aba, não no cabeçalho.
    await expect(
        page
            .getByRole("region", { name: "Transações" })
            .getByRole("link", { name: "Nova transação" }),
    ).toBeVisible();

    await tabs.getByRole("link", { name: "Obra" }).click();

    await expect(page).toHaveURL(/\/finance\/construction$/);
    await expect(
        page
            .getByRole("navigation", { name: "Seções do Financeiro" })
            .getByRole("link", { name: "Obra" }),
    ).toHaveAttribute("aria-current", "page");
});
