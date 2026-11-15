# Passo 08 — Testes de acessibilidade com axe

> **Fase:** 05 — Testes E2E\
> **Tempo estimado:** 25 min\
> **Depende de:** [Passo 07](07-testes-isolamento.md)

## Objetivo

Verificar automaticamente as regras WCAG 2.1 (níveis A e AA) nas principais
páginas, com o axe-core.

## 💡 Por que

As fases anteriores cuidaram da acessibilidade **à mão**: `aria-label`,
contraste, foco visível. O axe é um **inspetor automático** que confere
dezenas de regras em cada página, a cada execução. Se alguém trocar uma cor
e o contraste cair abaixo de 4.5:1, o teste falha.

⚠️ **Limite importante:** ferramentas automáticas encontram só parte dos
problemas (estimativas comuns: de 30% a 50%). Elas não sabem, por exemplo,
se a **ordem** do foco faz sentido ou se um texto alternativo é **útil**.
O teste com teclado e leitor de tela continua necessário. 💡 O axe é o
detector de fumaça, não o bombeiro.

| Tag | Significado |
|---|---|
| `wcag2a`, `wcag21a` | Nível A: o mínimo |
| `wcag2aa`, `wcag21aa` | Nível AA: o padrão de mercado e de leis de acessibilidade |

## Pré-requisitos

- Passo 07 concluído.

## Passo a passo

### 1. Criar `tests/e2e/accessibility.spec.ts`

`tests/e2e/accessibility.spec.ts`:

```ts
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
```

> **Por que os dois temas:** o primeiro axe pegou um contraste falho só no
> tema **escuro** (`--text-color-secondary` claro demais sobre o card) e o
> item ativo da sidebar no **claro** (`--accent-color` sobre
> `--selection-color` = 4.05:1). As correções foram o token
> `--accent-on-selection` (nos dois temas) e o novo valor de
> `--text-color-secondary` no escuro — ambas em `src/styles/themes/`.

| Trecho | Explicação |
|---|---|
| `await expect(heading).toBeVisible()` | Espera a página renderizar antes de analisar |
| `withTags(WCAG_TAGS)` | Restringe às regras WCAG 2.1 A/AA |
| `expect(results.violations).toEqual([])` | Se houver violação, o Playwright mostra a lista completa (regra, elemento, como corrigir) |

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `tests/e2e/accessibility.spec.ts` | Criado | 6 páginas verificadas, nos dois temas |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npx playwright test accessibility.spec` | `8 passed` (2 setups + 6 testes) |
| 2 | **Prova do alarme:** em `src/styles/themes/_light.scss`, troque `--text-color-secondary` por `#b0b0b0` e rode | Falha com a regra **`color-contrast`**. Desfaça |

**Critério de aceite:** os dois testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Violação `color-contrast` | Cor de texto clara demais sobre o fundo | Escurecer o token no tema; conferir em <https://webaim.org/resources/contrastchecker/> |
| Violação `label` | Campo de formulário sem `<label>` | Associar com `htmlFor`/`id` |
| Violação `button-name` | Botão só com ícone, sem nome | Adicionar `aria-label` ao botão |

## Commit sugerido

```bash
git add tests/e2e/accessibility.spec.ts
git commit -m "test(e2e): adiciona verificação automática de acessibilidade"
```

## Referências

- [Playwright — Accessibility testing](https://playwright.dev/docs/accessibility-testing)
- [axe-core — Regras](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WCAG 2.1 — Visão geral (W3C)](https://www.w3.org/WAI/standards-guidelines/wcag/)

---

← [Passo anterior](07-testes-isolamento.md) · [Índice da fase](README.md) · [Próximo passo](09-testes-integracao.md) →
