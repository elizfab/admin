# Passo 06 — Testes do CRUD de projetos

> **Fase:** 05 — Testes E2E\
> **Tempo estimado:** 40 min\
> **Depende de:** [Passo 05](05-testes-navegacao.md)

## Objetivo

Testar pela tela o ciclo de vida de um projeto: criação (com erro de
validação mantendo o texto), conflito de nome e exclusão com confirmação.

## 💡 Por que

### Cada teste prepara os próprios dados

Um teste que depende de outro (“o teste 3 edita o projeto que o teste 2
criou”) quebra em cadeia e não pode ser rodado sozinho. Aqui, cada teste
**cria pela API** o que precisa, o que é rápido, e só usa a **tela** para o
que está sendo testado. 💡 Cada receita traz a própria lista de
ingredientes, sem contar com as sobras da receita anterior.

| Teste | Prepara pela API | Exercita pela tela |
|---|---|---|
| Criar | — | Erro de validação **e** criação válida |
| Renomear | 2 projetos | Edição com nome já usado |
| Excluir | 1 projeto | Diálogo: `Esc` cancela; “Excluir” confirma |

### Os bugs que estes testes vigiam

- O formulário que **apagava o texto** após um erro (corrigido na Fase 04).
- A exclusão **sem confirmação**: o teste verifica que `Esc` não exclui.

### O `request` já vem logado

O fixture `request` usa o mesmo `storageState` da página (a dona). Por isso
`request.post("/api/v1/projects")` cria o projeto **na conta dela**.

## Pré-requisitos

- Passo 05 concluído.

## Passo a passo

### 1. Criar `tests/e2e/projects.spec.ts`

`tests/e2e/projects.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

import { E2E_BASE_URL } from "./support/e2e-env";

// Cada teste cria os próprios dados (nomes únicos) e não depende dos outros.

async function createProjectViaApi(
  request: import("@playwright/test").APIRequestContext,
  name: string,
) {
  const response = await request.post("/api/v1/projects", {
    data: { name },
    headers: { Origin: E2E_BASE_URL },
  });
  expect(response.status()).toBe(201);

  return (await response.json()).data as { id: string; name: string };
}

test("cria projeto, mantendo o texto quando a validação falha", async ({ page }) => {
  await page.goto("/projects/new");

  await page.getByLabel("Nome *").fill("AB");
  await page.getByLabel("Link do repositório").fill("http://inseguro.com");
  await page.getByRole("button", { name: "Criar projeto" }).click();

  await expect(page.getByText("O nome precisa ter pelo menos 3 caracteres.")).toBeVisible();
  await expect(page.getByText("Informe uma URL válida começando com https://.")).toBeVisible();
  await expect(page.getByLabel("Nome *")).toHaveValue("AB");

  await page.getByLabel("Nome *").fill("Projeto criado pela tela");
  await page.getByLabel("Link do repositório").fill("https://github.com/elizfab/admin");
  await page.getByLabel("Status").selectOption({ label: "Em andamento" });
  await page.getByRole("button", { name: "Criar projeto" }).click();

  await expect(page).toHaveURL(/\/projects$/);
  const item = page.getByRole("listitem").filter({ hasText: "Projeto criado pela tela" });
  await expect(item).toContainText("Em andamento");
});

test("impede renomear para um nome já usado", async ({ page, request }) => {
  await createProjectViaApi(request, "Nome ocupado");
  const project = await createProjectViaApi(request, "Projeto a renomear");

  await page.goto(`/projects/${project.id}/edit`);
  await page.getByLabel("Nome *").fill("Nome ocupado");
  await page.getByRole("button", { name: "Salvar alterações" }).click();

  await expect(page.locator("form").getByRole("alert")).toHaveText(
    "Já existe um projeto com este nome.",
  );
});

test("exclui só após confirmar no diálogo", async ({ page, request }) => {
  await createProjectViaApi(request, "Projeto descartável");
  await page.goto("/projects");

  const deleteButton = page.getByRole("button", { name: "Excluir o projeto Projeto descartável" });

  // Esc cancela: o projeto continua na lista.
  await deleteButton.click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("alertdialog")).toBeHidden();
  await expect(page.getByRole("heading", { name: "Projeto descartável" })).toBeVisible();

  // Confirmar exclui.
  await deleteButton.click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Excluir" }).click();
  await expect(page.getByRole("heading", { name: "Projeto descartável" })).toBeHidden();
});
```

| Trecho | Explicação |
|---|---|
| `getByLabel("Nome *")` | O rótulo inclui o asterisco de obrigatório |
| `toHaveValue("AB")` | Prova que o texto **continua** no campo após o erro |
| `selectOption({ label: "Em andamento" })` | Escolhe pelo texto visível, e não pelo valor interno (`IN_PROGRESS`) |
| `filter({ hasText: ... })` | Acha o item certo da lista |
| `toBeHidden()` | Espera o diálogo fechar ou o item sumir |

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `tests/e2e/projects.spec.ts` | Criado | 3 testes do CRUD |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npx playwright test projects.spec` | `5 passed` |
| 2 | **Prova do alarme:** no `ProjectForm.tsx`, troque `defaultValue={values.name}` por `defaultValue={project?.name}` e rode | “cria projeto, mantendo o texto…” **falha** em `toHaveValue("AB")`. Desfaça |

**Critério de aceite:** os dois testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `expect(response.status()).toBe(201)` recebe `409` | Nome repetido entre execuções | O global setup limpa o banco; confira se ele rodou (passo 03) |
| `getByLabel("Nome *")` não encontra | Rótulo diferente no formulário | O texto do `<label>` precisa ser exatamente igual |

## Commit sugerido

```bash
git add tests/e2e/projects.spec.ts
git commit -m "test(e2e): adiciona testes do CRUD de projetos"
```

## Referências

- [Playwright — API testing (request)](https://playwright.dev/docs/api-testing)
- [Playwright — Actions](https://playwright.dev/docs/input)
- [Playwright — Dialogs e filtros](https://playwright.dev/docs/locators#filtering-locators)

---

← [Passo anterior](05-testes-navegacao.md) · [Índice da fase](README.md) · [Próximo passo](07-testes-isolamento.md) →
