# Passo 05 — Testes de navegação

> **Fase:** 05 — Testes E2E\
> **Tempo estimado:** 20 min\
> **Depende de:** [Passo 04](04-testes-autenticacao.md)

## Objetivo

Garantir que a raiz leva ao dashboard, que todos os módulos abrem pela
sidebar com o item ativo correto e que a página 404 aparece em português.

## 💡 Por que

São testes de **fumaça** (*smoke tests*): rápidos e amplos, eles
respondem “o básico está de pé?”. Se a navegação quebra, quase todo o resto
quebra junto, e este é o primeiro lugar a olhar. 💡 Antes de testar cada
cômodo, confere-se se as portas abrem.

### Um laço, várias verificações

Em vez de escrever um teste por módulo, a lista `modules` e um `for`
verificam todos. Ao criar um módulo novo, basta acrescentar uma linha.

## Pré-requisitos

- Passo 04 concluído.

## Passo a passo

### 1. Criar `tests/e2e/navigation.spec.ts`

`tests/e2e/navigation.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

// Usa a sessão da "dona" (storageState padrão do projeto chromium).

// Módulos do menu lateral (src/components/layout/Sidebar/navigation.ts).
const modules = [
  { label: "Dashboard", path: "/dashboard" },
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
    await expect(nav.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("card do dashboard abre a página de documentação", async ({ page }) => {
  await page.goto("/dashboard");

  await page.getByRole("link", { name: /Documentação/ }).click();

  await expect(page).toHaveURL(/\/documentation$/);
  await expect(page.getByRole("heading", { level: 1, name: "Documentação" })).toBeVisible();
});

test("mostra a página 404 em português", async ({ page }) => {
  await page.goto("/rota-que-nao-existe");

  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
});
```

> **Adaptação ao projeto real:** a sidebar tem **3** itens (Dashboard,
> Estudos, Financeiro — `/projects` tem páginas próprias mas não entra no
> menu) e o dashboard tem **2** cards (Documentação e Financeiro). O teste
> do card cobre a rota `/documentation`, que não está na sidebar.

| Verificação | O que prova |
|---|---|
| `toHaveURL(...)` | O link leva à rota certa |
| `toHaveAttribute("aria-current", "page")` | O destaque do item ativo é **acessível**, e não só visual |
| `getByRole("heading", { level: 1 })` | Toda página tem um `<h1>` (regra da Fase 01) |
| `toHaveCount(2)` no dashboard | Os dois cards de módulo existem |

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `tests/e2e/navigation.spec.ts` | Criado | 4 testes de navegação |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npx playwright test navigation.spec` | `6 passed` (2 setups + 4 testes) |

**Critério de aceite:** o teste passa.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `toHaveCount(2)` recebe outro número | Um card foi adicionado ou removido do mock | Atualizar o número esperado junto com o mock |

## Commit sugerido

```bash
git add tests/e2e/navigation.spec.ts
git commit -m "test(e2e): adiciona testes de navegação"
```

## Referências

- [Playwright — Writing tests](https://playwright.dev/docs/writing-tests)
- [Playwright — toHaveAttribute](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-attribute)

---

← [Passo anterior](04-testes-autenticacao.md) · [Índice da fase](README.md) · [Próximo passo](06-testes-projetos.md) →
