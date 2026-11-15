# Passo 04 — Testes de autenticação

> **Fase:** 05 — Testes E2E\
> **Tempo estimado:** 30 min\
> **Depende de:** [Passo 03](03-global-setup-e-sessoes.md)

## Objetivo

Automatizar os fluxos obrigatórios de autenticação da seção 17.2:
redirecionamento sem sessão, credenciais inválidas, login, logout e
tentativa de reutilizar a sessão encerrada.

## 💡 Por que

### Localizadores “como uma pessoa”

```ts
page.getByLabel("E-mail")                   // ✅ pelo rótulo do campo
page.getByRole("button", { name: "Entrar" }) // ✅ pelo papel e nome acessível
page.locator(".LoginForm_submit__x7k2")      // ❌ pela classe (muda a cada build)
```

Os localizadores por **papel** e **rótulo** são os mesmos que um leitor de
tela usa. Se o teste não encontra o botão, provavelmente uma pessoa com
deficiência visual também não encontraria. 💡 O teste vira uma segunda
checagem de acessibilidade, de graça.

### `expect` que espera

As asserções do Playwright (`toHaveURL`, `toBeVisible`, `toHaveText`)
**tentam de novo** por alguns segundos até a condição ser verdadeira. Não é
preciso escrever `sleep`/`waitForTimeout`, que deixam os testes lentos e
instáveis.

### Visitante sem sessão

O projeto usa, por padrão, a sessão da dona (passo 02). Para simular uma
visitante, o arquivo começa com:

```ts
test.use({ storageState: { cookies: [], origins: [] } });
```

### Contando logins (rate limit)

O limite é de 5 tentativas de login por minuto. A suíte inteira faz **4**:
2 no setup e 2 neste arquivo. Por isso “entrar” e “sair” ficam no **mesmo**
teste. E por isso os outros arquivos reaproveitam as sessões salvas.

## Pré-requisitos

- Passo 03 concluído.

## Passo a passo

### 1. Criar `tests/e2e/auth.spec.ts`

`tests/e2e/auth.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

import { testUsers } from "./support/e2e-env";

// Estes testes simulam uma visitante SEM sessão.
test.use({ storageState: { cookies: [], origins: [] } });

const owner = testUsers.owner;

test("redireciona visitante sem sessão para o login", async ({ page }) => {
  await page.goto("/projects");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Bem-vinda de volta" })).toBeVisible();
});

test("mostra mensagem genérica para credenciais inválidas", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(owner.email);
  // exact: o botão do olhinho tem aria-label "Mostrar senha", que também
  // contém a palavra "Senha" — sem exact o localizador acha 2 elementos.
  await page.getByLabel("Senha", { exact: true }).fill("senha-errada-123");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.locator("form").getByRole("alert")).toHaveText("E-mail ou senha inválidos.");
  await expect(page).toHaveURL(/\/login$/);
});

test("faz login, mostra o nome, sai e não consegue voltar", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(owner.email);
  await page.getByLabel("Senha", { exact: true }).fill(owner.password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("banner")).toContainText(owner.name);

  await page.getByRole("button", { name: owner.name }).click();
  await page.getByRole("menuitem", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login$/);

  // A sessão foi encerrada no servidor: voltar ao dashboard não funciona.
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});
```

| Teste | O que prova |
|---|---|
| 1 | O `proxy.ts` + `requireSession()` mandam a visitante para o login |
| 2 | A mensagem é **genérica**, e a pessoa continua no login |
| 3 | Login funciona, o nome aparece no Header, o logout encerra a sessão **no servidor** |

💡 `page.locator("form").getByRole("alert")`: o Next.js tem um anunciador
de rotas próprio, também com `role="alert"`. Restringir ao `form` evita
pegar o elemento errado (encontrado durante a validação deste guia).

### 2. Rodar só este arquivo

```bash
npx playwright test auth.spec
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `tests/e2e/auth.spec.ts` | Criado | 3 testes de autenticação |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npx playwright test auth.spec` | `5 passed` (2 setups + 3 testes) |
| 2 | **Prova do alarme:** em `LoginForm.tsx`, troque a mensagem por `"Senha incorreta."` e rode de novo | O teste 2 **falha**, mostrando o texto esperado × o recebido. Desfaça |

**Critério de aceite:** os dois testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `strict mode violation: getByRole('alert') resolved to 2 elements` | Pegou também o anunciador de rotas do Next.js | Restringir: `page.locator("form").getByRole("alert")` |
| `strict mode violation: getByLabel('Senha') resolved to 2 elements` | O botão do olhinho tem `aria-label` "Mostrar senha" | Usar `getByLabel("Senha", { exact: true })` |
| Login falha com “Muitas tentativas” | Mais de 5 logins no mesmo minuto | Não criar testes que façam login pela tela; usar as sessões salvas |

## Commit sugerido

```bash
git add tests/e2e/auth.spec.ts
git commit -m "test(e2e): adiciona testes de autenticação"
```

## Referências

- [Playwright — Locators](https://playwright.dev/docs/locators)
- [Playwright — Assertions (auto-retrying)](https://playwright.dev/docs/test-assertions)
- [Testing Library — Priority of queries](https://testing-library.com/docs/queries/about#priority)
- ARCHITECTURE.md, seção 17.2

---

← [Passo anterior](03-global-setup-e-sessoes.md) · [Índice da fase](README.md) · [Próximo passo](05-testes-navegacao.md) →
