import { randomUUID } from "node:crypto";

import { expect, test, type APIRequestContext } from "@playwright/test";

import { E2E_BASE_URL, testUsers } from "./support/e2e-env";

/**
 * Financeiro → Obra (Fase 09): cada teste cria a PRÓPRIA obra (nome com
 * randomUUID), então nada se soma entre testes nem entre retries.
 * Dados de montagem entram pela API (rápido); os fluxos principais
 * passam pela tela.
 */

const headers = { Origin: E2E_BASE_URL };

type Project = {
    id: string;
    name: string;
    areas: { id: string; name: string }[];
    phases: { id: string; number: number; name: string | null }[];
};

async function api(request: APIRequestContext, method: string, path: string, data?: unknown) {
    return request.fetch(path, { method, data, headers });
}

async function createProject(request: APIRequestContext, name: string): Promise<Project> {
    const response = await api(request, "POST", "/api/v1/finance/construction/projects", { name });
    expect(response.status()).toBe(201);
    const { data } = (await response.json()) as { data: Project };
    return data;
}

async function getProject(request: APIRequestContext, id: string): Promise<Project> {
    const response = await api(request, "GET", `/api/v1/finance/construction/projects/${id}`);
    expect(response.status()).toBe(200);
    const { data } = (await response.json()) as { data: Project };
    return data;
}

async function createService(
    request: APIRequestContext,
    projectId: string,
    phaseId: string,
    contractedCents: number,
    description = "Reboque da parede",
) {
    const response = await api(
        request,
        "POST",
        `/api/v1/finance/construction/projects/${projectId}/services`,
        {
            phaseId,
            trade: "MASON",
            professionalName: "Seu Zé",
            description,
            contractedCents,
        },
    );
    expect(response.status()).toBe(201);
    const { data } = (await response.json()) as { data: { id: string } };
    return data;
}

async function payService(
    request: APIRequestContext,
    serviceId: string,
    amountCents: number,
    paidOn = "2026-06-10",
) {
    const response = await api(request, "POST", "/api/v1/finance/construction/payments", {
        serviceId,
        paidOn,
        amountCents,
        method: "PIX",
    });
    expect(response.status()).toBe(201);
}

test.describe("Construção: listagem e Nova obra (T-0022/T-0023)", () => {
    test("Nova obra abre o modal, valida e cria a obra (vai para a configuração dela)", async ({
        page,
    }) => {
        const name = `Telhado E2E ${randomUUID().slice(0, 8)}`;
        await page.goto("/finance/construction");

        // Sem título/descrição antigos: entram os sub-grupos e os cards de categoria.
        await expect(page.getByRole("tab", { name: "Lavanderia" })).toBeVisible();
        await expect(page.getByRole("link", { name: /Banheiro da Lavanderia/ })).toBeVisible();

        await page.getByRole("button", { name: "Nova obra" }).click();
        const dialog = page.getByRole("dialog", { name: "Nova obra" });

        await dialog.getByLabel("Nome da obra *").fill("T");
        await dialog.getByRole("button", { name: "Salvar obra" }).click();
        await expect(dialog.getByText("Informe o nome da obra.")).toBeVisible();

        await dialog.getByLabel("Nome da obra *").fill(name);
        await dialog.getByLabel("Início").fill("2026-12-01");
        // Categoria vem do catálogo único (select/checkbox, não fixo no componente).
        await dialog.getByLabel("Lavanderia", { exact: true }).check();
        await dialog.getByRole("button", { name: "Salvar obra" }).click();

        await expect(page).toHaveURL(/\/finance\/construction\/[^/]+\/settings$/);
        // A obra categorizada aparece ao clicar no card da categoria (breadcrumb).
        await page.goto("/finance/construction?categoria=lavanderia");
        await expect(page.getByRole("link", { name: "Lavanderia" }).first()).toBeVisible();
        const card = page
            .getByRole("list", { name: "Obras" })
            .getByRole("listitem")
            .filter({ hasText: name });
        await expect(card.getByRole("link", { name, exact: true })).toBeVisible();
        await expect(card.getByRole("link", { name: `Abrir a obra ${name}` })).toBeVisible();
        await expect(card).toContainText("Início 01/12/2026");
    });

    test("Fechar o modal não cria nada", async ({ page }) => {
        await page.goto("/finance/construction?categoria=lavanderia");
        const obras = page.getByRole("list", { name: "Obras" });
        const before = await obras.getByRole("listitem").count();

        await page.getByRole("button", { name: "Nova obra" }).click();
        await page
            .getByRole("dialog", { name: "Nova obra" })
            .getByLabel("Nome da obra *")
            .fill("Não salvar");
        await page.getByRole("button", { name: "Fechar" }).click();

        await expect(page.getByRole("dialog")).toBeHidden();
        await expect(obras.getByRole("listitem")).toHaveCount(before);
    });

    test("grid com até 6 obras por linha no desktop e 1 no celular", async ({ page, request }) => {
        for (let i = 0; i < 7; i++) {
            await createProject(request, `Grid E2E ${randomUUID().slice(0, 8)}`);
        }
        const tops = async () => {
            // Obras criadas pela API nascem sem categoria → grupo "Sem categoria".
            await page.goto("/finance/construction?grupo=sem-categoria");
            const cards = page.getByRole("list", { name: "Obras" }).getByRole("listitem");
            const ys = await cards.evaluateAll((items) =>
                items.slice(0, 7).map((li) => Math.round(li.getBoundingClientRect().top)),
            );
            return ys;
        };

        await page.setViewportSize({ width: 1440, height: 900 });
        const desktop = await tops();
        // Desktop: 4 colunas por linha (painel de 12 cards).
        expect(desktop.slice(0, 4).every((y) => y === desktop[0])).toBe(true);
        expect(desktop[4]).toBeGreaterThan(desktop[0]);

        await page.setViewportSize({ width: 390, height: 844 });
        const mobile = await tops();
        expect(mobile[1]).toBeGreaterThan(mobile[0]);
    });
});

test.describe("Obra", () => {
    test("serviço pela tela + pagamento deixa o card Quitado na fase", async ({
        page,
        request,
    }) => {
        const project = await createProject(request, `Obra E2E ${randomUUID().slice(0, 8)}`);
        const full = await getProject(request, project.id);
        const phase = full.phases[0];

        // Serviço pela TELA.
        await page.goto(`/finance/construction/${project.id}/services/new`);
        await page.getByLabel("Descrição do serviço *").fill("Piso porcelanato");
        await page.getByLabel("Valor contratado (R$) *").fill("1.500,00");
        await page.getByRole("button", { name: "Salvar serviço" }).click();
        await expect(page).toHaveURL(new RegExp(`/finance/construction/${project.id}/services$`));
        await expect(page.getByText("Piso porcelanato")).toBeVisible();

        // Pagamento pela TELA.
        await page.goto(`/finance/construction/${project.id}/payments/new`);
        await page.getByLabel("Valor pago (R$) *").fill("1.500,00");
        await page.getByRole("button", { name: "Registrar pagamento" }).click();
        // A action volta para a FASE do serviço, onde o card mostra o pagamento.
        await expect(page).toHaveURL(new RegExp(`/phases/${phase.number}$`));
        await expect(page.getByRole("heading", { name: "Piso porcelanato" })).toBeVisible();
        await expect(page.getByText("Quitado").first()).toBeVisible();
    });

    test("pagamento acima da falta mostra erro e não grava", async ({ page, request }) => {
        const project = await createProject(request, `Obra E2E ${randomUUID().slice(0, 8)}`);
        const full = await getProject(request, project.id);
        const service = await createService(request, project.id, full.phases[0].id, 10_000);

        await page.goto(`/finance/construction/${project.id}/payments/new?serviceId=${service.id}`);
        await page.getByLabel("Valor pago (R$) *").fill("200,00");
        await page.getByRole("button", { name: "Registrar pagamento" }).click();

        await expect(page.getByText(/passa do que falta pagar/)).toBeVisible();
        await expect(page).toHaveURL(/\/payments\/new/);
    });

    test("compra 3x: paga a 1ª parcela pela tela e desfaz", async ({ page, request }) => {
        const project = await createProject(request, `Obra E2E ${randomUUID().slice(0, 8)}`);

        const purchase = await api(
            request,
            "POST",
            `/api/v1/finance/construction/projects/${project.id}/purchases`,
            {
                item: "Cimento CP-II 50kg",
                purchasedOn: "2026-06-01",
                totalCents: 30_000,
                method: "CREDIT_CARD",
                installmentsCount: 3,
                firstDueOn: "2026-07-10",
            },
        );
        expect(purchase.status()).toBe(201);
        const list = await api(
            request,
            "GET",
            `/api/v1/finance/construction/projects/${project.id}/purchases`,
        );
        const { data: purchases } = (await list.json()) as {
            data: { installments: { id: string; paidOn: string | null }[] }[];
        };
        expect(purchases[0].installments[0].paidOn).toBeNull();

        // Paga a 1ª parcela pela tela.
        await page.goto(`/finance/construction/${project.id}/purchases`);
        await expect(page.getByRole("heading", { name: "Cimento CP-II 50kg" })).toBeVisible();
        await page.getByLabel("Data do pagamento").first().fill("2026-07-10");
        await page.getByRole("button", { name: "Confirmar" }).first().click();
        await expect(page.getByText("10/07/2026").first()).toBeVisible();
        await expect(page.getByRole("button", { name: "Desfazer" })).toHaveCount(1);

        // Desfaz: volta a não ter nenhum "Desfazer".
        await page.getByRole("button", { name: "Desfazer" }).click();
        await expect(page.getByRole("button", { name: "Desfazer" })).toHaveCount(0);
    });

    test("Nova transação → Obra registra pagamento e volta ao mês", async ({ page, request }) => {
        const project = await createProject(request, `Obra E2E ${randomUUID().slice(0, 8)}`);
        const full = await getProject(request, project.id);
        // Descrição única: o teste passa com --repeat-each (o mês 2026-06 acumula lançamentos).
        const description = `Reboque ${randomUUID().slice(0, 8)}`;
        const service = await createService(
            request,
            project.id,
            full.phases[0].id,
            800_000,
            description,
        );

        await page.goto("/finance/transactions/new");
        await page.getByLabel("Categoria").selectOption({ label: "Construção" });

        // Selects encadeados: obra → serviço.
        await page
            .getByLabel("Obra · Ambiente *")
            .selectOption({ label: `${project.name} (todos os ambientes)` });
        await page.getByLabel("Serviço *").selectOption(service.id);
        await expect(page.getByText("Falta pagar")).toBeVisible();

        await page.getByLabel("Data do pagamento *").fill("2026-06-10");
        await page.getByLabel("Valor pago (R$) *").fill("2.000,00");
        await page.getByRole("button", { name: "Registrar pagamento" }).click();

        await expect(page).toHaveURL(/\/finance\/transactions\?month=2026-06/);
        await expect(
            page.getByText(`Pedreiro Seu Zé: ${description}`, { exact: false }),
        ).toBeVisible();
        await expect(page.getByText("Construção", { exact: true }).first()).toBeVisible();
    });

    test("lançamento Obra não tem editar/excluir e a API responde 409", async ({
        page,
        request,
    }) => {
        const project = await createProject(request, `Obra E2E ${randomUUID().slice(0, 8)}`);
        const full = await getProject(request, project.id);
        const service = await createService(request, project.id, full.phases[0].id, 500_000);
        await payService(request, service.id, 100_000);

        // A transação gerada aparece no Financeiro com selo e "Ver na obra".
        await page.goto("/finance/transactions?month=2026-06");
        const item = page.locator("li", { hasText: "Reboque da parede" }).first();
        await expect(item.getByText("Construção", { exact: true })).toBeVisible();
        await expect(item.getByRole("link", { name: "Ver na obra" })).toBeVisible();
        await expect(item.getByRole("link", { name: /Editar/ })).toHaveCount(0);

        // A API também bloqueia a exclusão direta (409).
        const list = await api(request, "GET", "/api/v1/finance/transactions?month=2026-06");
        const { data } = (await list.json()) as { data: { id: string; description: string }[] };
        const generated = data.find((t) => t.description.includes("Reboque da parede"));
        expect(generated).toBeTruthy();

        const del = await api(request, "DELETE", `/api/v1/finance/transactions/${generated!.id}`);
        expect(del.status()).toBe(409);
    });

    test("isolamento: a outra usuária recebe 404 na obra, serviço e dashboard", async ({
        playwright,
    }) => {
        const owner = await playwright.request.newContext({
            baseURL: E2E_BASE_URL,
            storageState: testUsers.owner.storageState,
        });
        const project = await createProject(owner, `Obra E2E ${randomUUID().slice(0, 8)}`);
        const full = await getProject(owner, project.id);
        const service = await createService(owner, project.id, full.phases[0].id, 100_000);
        await payService(owner, service.id, 10_000);

        const other = await playwright.request.newContext({
            baseURL: E2E_BASE_URL,
            storageState: testUsers.other.storageState,
        });

        for (const path of [
            `/api/v1/finance/construction/projects/${project.id}`,
            `/api/v1/finance/construction/projects/${project.id}/dashboard`,
            `/api/v1/finance/construction/services/${service.id}`,
        ]) {
            expect((await other.get(path)).status()).toBe(404);
        }

        await owner.dispose();
        await other.dispose();
    });

    test("dashboard mostra os números do cenário", async ({ page, request }) => {
        const project = await createProject(request, `Obra E2E ${randomUUID().slice(0, 8)}`);
        const full = await getProject(request, project.id);
        const service = await createService(request, project.id, full.phases[0].id, 10_000);
        await payService(request, service.id, 4_000);

        await page.goto(`/finance/construction/${project.id}`);
        await expect(page.getByText("Investimento total")).toBeVisible();
        await expect(page.getByText("R$ 100,00", { exact: true })).toBeVisible(); // 10.000 centavos
        await expect(page.getByText("Mão de obra")).toBeVisible();
    });
});
