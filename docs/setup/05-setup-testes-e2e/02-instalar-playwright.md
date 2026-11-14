# Passo 02 — Instalar e configurar o Playwright

> **Fase:** 05 — Testes E2E\
> **Tempo estimado:** 30 min\
> **Depende de:** [Passo 01](01-ambiente-de-teste.md)

## Objetivo

Instalar o Playwright e o Chromium, criar o `playwright.config.ts`, os
scripts e os ignores do Git e do ESLint.

## 💡 Por que

O Playwright é um **robô que usa o navegador**: abre páginas, clica,
digita e confere o que aparece, como uma pessoa faria, só que em segundos e
sem se cansar.

### Por que instalar manualmente, e não com `npm init playwright@latest`

O instalador interativo cria arquivos de exemplo e uma configuração genérica
que precisariam ser apagados ou reescritos. Instalar o pacote e escrever a
configuração à mão (como foi feito com o Prisma) deixa o projeto limpo e
mostra o que cada opção faz.

### As decisões da configuração

| Opção | Valor | 💡 Por quê |
|---|---|---|
| `webServer.command` | `prepare-database` + `build` + `start` | Cria o banco de teste, depois testa a aplicação **de produção** (e não o modo dev) |
| `webServer.env` | `e2eServerEnv` | O servidor de teste usa o `admin_test` |
| `webServer.url` | `/api/v1/health` | O Playwright só começa quando o health check (Fase 02) responde **200** |
| `reuseExistingServer` | `true` localmente | Se um servidor de teste já estiver de pé na 3100, reaproveita |
| `workers: 1` | Em série | Todos os testes usam o mesmo banco; em série o resultado é previsível |
| `projects: setup → chromium` | Dependência | O login das usuárias (passo 03) acontece **antes** dos testes |
| `storageState` | Sessão da dona | Por padrão, os testes já começam logados |
| `trace` / `screenshot` | Só em falhas | Evidência para investigar, sem pesar nas execuções que passam |
| `locale` / `timezoneId` | `pt-BR` / São Paulo | Datas e formatos iguais aos da usuária real |

💡 O Next.js 16 grava o build do `next dev` em uma pasta separada
(`.next/dev`). Por isso o `build` dos testes não atrapalha um `npm run dev`
aberto em outro terminal.

⚠️ **Ordem de execução (importante):** o Playwright sobe o `webServer` e
espera a `url` responder **antes** de rodar o `globalSetup`. Como o health
check responde `503` enquanto o banco não existe, o banco precisa ser criado
**dentro do próprio `webServer.command`** — caso contrário o servidor nunca
fica "pronto" e os testes falham com `Process from config.webServer exited
early`. O script `prepare-database.ts` é criado no passo 03.

## Pré-requisitos

- Passo 01 concluído.

## Passo a passo

### 1. Instalar

```bash
npm install -D @playwright/test @axe-core/playwright
npx playwright install chromium
```

| Pacote | Papel |
|---|---|
| `@playwright/test` | O executor de testes e a API do navegador |
| `@axe-core/playwright` | Verificação automática de acessibilidade (passo 08) |
| `playwright install chromium` | Baixa o navegador usado nos testes (~130 MB, uma vez) |

> No Linux, se aparecer erro de biblioteca do sistema ausente ao rodar os
> testes: `sudo npx playwright install-deps chromium`.

### 2. Configuração — `playwright.config.ts` (na raiz)

`playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

import { E2E_BASE_URL, E2E_PORT, e2eServerEnv, testUsers } from "./tests/e2e/support/e2e-env";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",

  // Um worker: os testes compartilham o mesmo banco; em série fica previsível.
  workers: 1,
  fullyParallel: false,

  // No CI: falha se alguém esquecer um test.only; tenta de novo 2x.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: E2E_BASE_URL,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    // Evidências só quando algo falha.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: testUsers.owner.storageState },
      dependencies: ["setup"],
    },
  ],

  // Sobe a aplicação de PRODUÇÃO (build + start) apontando para o banco de teste.
  webServer: {
    // O banco precisa existir ANTES do servidor subir: o health check
    // responde 503 sem ele e o Playwright nunca liberaria o webServer
    // para rodar o globalSetup (que é quem migraria/semeia o banco).
    command: `npx tsx tests/e2e/support/prepare-database.ts && npm run build && npm run start -- --port ${E2E_PORT}`,
    url: `${E2E_BASE_URL}/api/v1/health`,
    env: e2eServerEnv,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
```

### 3. Scripts no `package.json`

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:report": "playwright show-report"
```

### 4. Ignorar os artefatos

No final do `.gitignore`:

```gitignore
# playwright
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
/playwright/.auth/
```

⚠️ A pasta `playwright/.auth/` guarda **cookies de sessão** das contas de
teste. Nunca versione.

No `eslint.config.mjs`, dentro de `globalIgnores([...])`, depois de
`"next-env.d.ts",`:

```js
    // Relatórios e artefatos gerados pelo Playwright:
    "playwright-report/**",
    "test-results/**",
    "blob-report/**",
    "playwright/.cache/**",
```

💡 Sem isso, o `npm run lint` analisa o JavaScript minificado do relatório
HTML e mostra **milhares** de avisos (validado).

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `package.json` / `package-lock.json` | Alterado | Dependências e scripts |
| `playwright.config.ts` | Criado | Configuração do Playwright |
| `.gitignore` | Alterado | Artefatos e sessões de teste |
| `eslint.config.mjs` | Alterado | Ignora relatórios |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npx playwright --version` | `Version 1.x` |
| 2 | `npm run typecheck && npm run lint` | Sem erros |

Ainda não há testes para rodar: o `global-setup.ts` é criado no passo 03.

**Critério de aceite:** os dois testes passam.

## Commit sugerido

```bash
git add package.json package-lock.json playwright.config.ts .gitignore eslint.config.mjs
git commit -m "test(e2e): instala e configura o Playwright"
```

## Referências

- [Playwright — Installation](https://playwright.dev/docs/intro)
- [Playwright — Configuration](https://playwright.dev/docs/test-configuration)
- [Playwright — Web server](https://playwright.dev/docs/test-webserver)
- [Playwright — Projects e dependências](https://playwright.dev/docs/test-projects)

---

← [Passo anterior](01-ambiente-de-teste.md) · [Índice da fase](README.md) · [Próximo passo](03-global-setup-e-sessoes.md) →
