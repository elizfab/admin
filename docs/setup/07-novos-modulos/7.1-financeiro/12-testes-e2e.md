# Passo 12 — Testes E2E do módulo

> **Fase:** 07 — Novos Módulos\
> **Tempo estimado:** 1h\
> **Depende de:** [Passo 11](11-registrar-modulo.md)

## Objetivo

Cobrir o Financeiro com Playwright: criar pela tela (com erro de validação),
resumo do mês, navegação de meses, editar e excluir, regras da API,
**isolamento** entre usuárias e **acessibilidade** nos dois temas.

## 💡 Como os testes não atrapalham uns aos outros

Os testes do Financeiro compartilham o mesmo banco e a mesma usuária. Se dois
testes lançassem despesas em novembro, o total de um apareceria no outro.

💡 A solução é dar a cada teste **seu próprio mês**, como alunas que fazem a
prova em carteiras separadas: março para o teste de criação, abril para o
resumo, maio para edição/exclusão, junho para o isolamento. Assim a soma de
abril só contém o que o teste de abril criou.

E cada teste começa **apagando o próprio mês** (`clearMonth`), pela própria
API. 💡 É a aluna que apaga a lousa antes de começar: se o CI repetir um teste
que falhou (os *retries*), a segunda tentativa não encontra os dados da
primeira e não soma em dobro.

| Teste | Mês usado | Prova |
|---|---|---|
| Criar pela tela | 2026-03 | Erro mantém o texto; salvar volta ao mês certo |
| Resumo | 2026-04 | Totais da tela = totais da API |
| Navegar meses | 2026-01 → 2025-12 | Virada do ano |
| Editar e excluir | 2026-05 | Valor `40,00` aparece formatado; exclusão confirma |
| API | — | `?month=2026-13` → 400; `amountCents: 10.5` → 400 |
| Isolamento | 2026-06 | Outra usuária: 404 e resumo zerado |

## Pré-requisitos

- Passo 11 concluído.

## Passo a passo

### 1. Criar `tests/e2e/finance.spec.ts`

`tests/e2e/finance.spec.ts`:

```ts
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
```

💡 No teste de exclusão, a verificação final é "o diálogo fechou" e "a lista
ficou vazia", e não "o texto 'Cinema e pipoca' sumiu". Enquanto o diálogo
está aberto, o mesmo texto aparece **duas vezes** (na lista e na pergunta
"A transação 'Cinema e pipoca' será excluída…"), e o Playwright recusa um
seletor ambíguo (*strict mode violation*).

### 2. Estender o teste de isolamento

No **final** de `tests/e2e/isolation.spec.ts`, acrescente:

```ts
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
```

💡 O teste do **resumo** é o mais importante do isolamento: uma falha de
filtro numa **soma** não mostra o dado alheio na tela, mas soma o dinheiro
da outra pessoa no seu total. Sem esse teste, o vazamento seria invisível.

### 3. Incluir as telas novas na verificação de acessibilidade

Em `tests/e2e/accessibility.spec.ts`:

```ts
const privatePages = [
    "/dashboard",
    "/projects",
    "/projects/new",
    "/documentation",
    "/finance",
    "/finance/transactions/new",
];
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `tests/e2e/finance.spec.ts` | Criado | 5 testes |
| `tests/e2e/isolation.spec.ts` | Alterado | + 2 testes do Financeiro |
| `tests/e2e/accessibility.spec.ts` | Alterado | + 1 página (claro e escuro) |

## ✅ Como testar

```bash
npm run test:e2e
```

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run test:e2e` | `30 passed` |
| 2 | `npx playwright test tests/e2e/finance.spec.ts --repeat-each=3` | `17 passed` (5 testes × 3 + os 2 logins do setup): repetir não muda o resultado |

**Critério de aceite:** 30 testes passando, sem *flaky*.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `strict mode violation: getByText(...) resolved to 2 elements` | Mesmo texto na lista e no diálogo | Verifique o diálogo fechar, ou use `getByRole("listitem").filter(...)` |
| Total do resumo maior que o esperado | Outro teste usou o mesmo mês | Cada teste com seu mês (tabela acima) |
| `color-contrast` no `/finance` | Cor fora dos tokens | Use apenas `var(--green)`, `var(--red)`, `var(--text-color-secondary)` |
| Passa sozinho, falha no `--repeat-each` ou no retry do CI | Teste depende de o mês estar vazio | Chame `clearMonth` no início do teste |

## Commit sugerido

```bash
git add tests/e2e
git commit -m "test(e2e): cobre o Financeiro (CRUD, isolamento e acessibilidade)"
```

## Referências

- [Playwright — Locators (strictness)](https://playwright.dev/docs/locators#strictness)
- [OWASP API1:2023 — Broken Object Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)

---

← [Passo anterior](11-registrar-modulo.md) · [Índice da fase](README.md) · [Próximo passo](13-validacao-e-deploy.md) →
