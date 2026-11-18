# Passo 05 — Testes

> **Fase:** 08 — Portal Dev protegido\
> **Tempo estimado:** 1h\
> **Depende de:** [Passo 04](04-pagina-documentacao.md)

## Objetivo

Provar a proteção com testes automáticos: 15 unitários para o resolvedor de
arquivos (incluindo path traversal) e 5 E2E para o `/portal` e o
`/documentation`, usando um **portal falso**.

## 💡 Por que um portal falso nos testes

O CI do Admin **não** tem o `PORTAL_DEV_TOKEN` (e não deve ter: o CI roda em
pull requests). Além disso, o teste não deve quebrar só porque alguém mudou um
texto no portal. 💡 É o **boneco de treino** dos bombeiros: tem a forma de uma
pessoa, mas é sempre igual, então dá para repetir o treino quantas vezes for
preciso.

O portal falso fica em `tests/e2e/fixtures/portal/`, com a mesma forma do build
do Docusaurus (`index.html`, `docs/intro.html`, `404.html`, `assets/js/…`,
`portal-build.json`). A variável `PORTAL_DIR` aponta o servidor de testes para lá.

| Teste | O que prova |
|---|---|
| Sem login → `/login` | A página não é entregue a quem não está logado |
| **Cookie falso** → 307 | O proxy deixa passar, mas a função valida no banco e barra |
| Headers | `text/html`, `private, no-cache`, `noindex`; assets `immutable` |
| Scripts carregam | O HTML do portal busca `/portal/assets/...` com a sessão |
| `..%2F..%2Fpackage.json` e `%2e%2e/%2e%2e/.env.example` | 404, sem vazar conteúdo de fora da pasta |
| `/documentation` | Lê o `portal-build.json` e o botão abre o portal |

## Pré-requisitos

- Passo 04 concluído.

## Passo a passo

### 1. Testes unitários do resolvedor

`tests/unit/lib/portal/portal-files.test.ts`:

```ts
/**
 * @jest-environment node
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
    cacheControlFor,
    contentTypeFor,
    isSafeSegments,
    readPortalBuildInfo,
    resolvePortalFile,
} from "@/lib/portal/portal-files";

// Um "portal" de mentira numa pasta temporária, com a mesma forma do build do Docusaurus.
let root: string;

beforeAll(() => {
    root = mkdtempSync(path.join(tmpdir(), "portal-"));
    const files: Record<string, string> = {
        "index.html": "home",
        "docs/intro.html": "intro",
        "docs/backend/index.html": "backend",
        "assets/js/main.abc123.js": "js",
        "portal-build.json": JSON.stringify({ commit: "abc1234", builtAt: "2026-11-17T20:00:00.000Z", sections: [] }),
    };

    for (const [file, content] of Object.entries(files)) {
        mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
        writeFileSync(path.join(root, file), content);
    }

    // Arquivo FORA do portal: nenhum caminho pode chegar até ele.
    writeFileSync(path.join(root, "..", "segredo.txt"), "não pode vazar");
    process.env.PORTAL_DIR = root;
});

afterAll(() => {
    rmSync(root, { recursive: true, force: true });
    rmSync(path.join(root, "..", "segredo.txt"), { force: true });
    delete process.env.PORTAL_DIR;
});

describe("resolvePortalFile", () => {
    it.each([
        [[], "index.html"],
        [["docs", "intro"], "docs/intro.html"],
        [["docs", "backend"], "docs/backend/index.html"],
        [["assets", "js", "main.abc123.js"], "assets/js/main.abc123.js"],
    ])("%p → %s", async (segments, expected) => {
        await expect(resolvePortalFile(segments)).resolves.toMatchObject({ relativePath: expected });
    });

    it("devolve null para o que não existe", async () => {
        await expect(resolvePortalFile(["docs", "nao-existe"])).resolves.toBeNull();
    });

    it.each([[[".."]], [["..", "segredo.txt"]], [["docs", "..", "..", "segredo.txt"]], [["..%2f"]], [["a\\b"]]])(
        "bloqueia tentativa de sair da pasta: %p",
        async (segments) => {
            await expect(resolvePortalFile(segments)).resolves.toBeNull();
        },
    );
});

describe("regras de segmento, tipo e cache", () => {
    it("isSafeSegments recusa '..', '.', vazio, barra invertida e byte nulo", () => {
        expect(isSafeSegments(["docs", "intro"])).toBe(true);
        for (const bad of ["..", ".", "", "a\\b", "a\0b", "a/b"]) {
            expect(isSafeSegments([bad])).toBe(false);
        }
    });

    it("contentTypeFor usa a extensão", () => {
        expect(contentTypeFor("docs/intro.html")).toBe("text/html; charset=utf-8");
        expect(contentTypeFor("assets/js/a.js")).toBe("text/javascript; charset=utf-8");
        expect(contentTypeFor("arquivo.desconhecido")).toBe("application/octet-stream");
    });

    it("cacheControlFor é sempre private (a CDN nunca guarda cópia)", () => {
        expect(cacheControlFor("assets/js/a.123.js")).toBe("private, max-age=31536000, immutable");
        expect(cacheControlFor("docs/intro.html")).toBe("private, no-cache");
        expect(cacheControlFor("img/logo.png")).toBe("private, max-age=3600");
    });
});

describe("readPortalBuildInfo", () => {
    it("lê o portal-build.json", async () => {
        await expect(readPortalBuildInfo()).resolves.toMatchObject({ commit: "abc1234" });
    });

    it("devolve null quando não há portal", async () => {
        process.env.PORTAL_DIR = path.join(root, "nao-existe");
        await expect(readPortalBuildInfo()).resolves.toBeNull();
        process.env.PORTAL_DIR = root;
    });
});
```

💡 O comentário `@jest-environment node` na primeira linha troca o ambiente
**só deste arquivo**: o padrão do projeto é `jsdom` (um navegador simulado),
e este código roda no servidor, com `fs` e caminhos de verdade. O teste também
passaria no `jsdom`, mas o ambiente certo deixa a intenção explícita e evita
surpresas se o código passar a usar outra API do Node.

### 2. O portal falso

Crie os 5 arquivos:

`tests/e2e/fixtures/portal/index.html`:

```html
<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Portal Dev (fixture)</title></head>
<body><main><h1>Portal Dev (fixture)</h1><a href="/portal/docs/intro">Introdução</a></main></body></html>
```

`tests/e2e/fixtures/portal/docs/intro.html`:

```html
<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Introdução (fixture)</title>
<script src="/portal/assets/js/app.abc123.js"></script></head>
<body><main><h1>Introdução (fixture)</h1></main></body></html>
```

`tests/e2e/fixtures/portal/404.html`:

```html
<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Não encontrado (fixture)</title></head>
<body><main><h1>Página do portal não encontrada (fixture)</h1></main></body></html>
```

`tests/e2e/fixtures/portal/assets/js/app.abc123.js`:

```js
document.documentElement.dataset.portalFixture = "ok";
```

`tests/e2e/fixtures/portal/portal-build.json`:

```json
{
  "commit": "e2e0001",
  "builtAt": "2026-11-17T20:00:00.000Z",
  "sections": [
    { "label": "Frontend", "href": "/portal/docs/frontend" },
    { "label": "Backend", "href": "/portal/docs/backend" }
  ]
}
```

### 3. Apontar o servidor de testes para o portal falso

Em `tests/e2e/support/e2e-env.ts`, no final do `e2eServerEnv`:

```ts
    BETTER_AUTH_SECRET: "segredo-apenas-para-testes-e2e-nao-usar-em-producao",
    // Portal falso (fixture): os testes não dependem do repositório portal-dev.
    PORTAL_DIR: "tests/e2e/fixtures/portal",
};
```

### 4. Testes E2E

`tests/e2e/portal.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

/**
 * Portal Dev protegido (/portal/*): usa o portal FALSO de
 * tests/e2e/fixtures/portal (PORTAL_DIR em e2e-env.ts).
 */

test.describe("sem login", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("página e arquivo do portal levam ao /login", async ({ page, request }) => {
        await page.goto("/portal/docs/intro");
        await expect(page).toHaveURL(/\/login$/);

        // Mesmo com um cookie de sessão FALSO, o Route Handler valida no banco.
        const response = await request.get("/portal/assets/js/app.abc123.js", {
            headers: { Cookie: "better-auth.session_token=falso.falso" },
            maxRedirects: 0,
        });
        expect(response.status()).toBe(307);
        expect(response.headers()["location"]).toMatch(/\/login$/);
    });
});

test("com login, entrega HTML e assets com cache privado", async ({ request }) => {
    const page = await request.get("/portal/docs/intro");
    expect(page.status()).toBe(200);
    expect(page.headers()["content-type"]).toBe("text/html; charset=utf-8");
    expect(page.headers()["cache-control"]).toBe("private, no-cache");
    expect(page.headers()["x-robots-tag"]).toBe("noindex, nofollow");
    expect(await page.text()).toContain("Introdução (fixture)");

    const asset = await request.get("/portal/assets/js/app.abc123.js");
    expect(asset.headers()["content-type"]).toBe("text/javascript; charset=utf-8");
    expect(asset.headers()["cache-control"]).toBe("private, max-age=31536000, immutable");
});

test("o HTML do portal carrega os próprios scripts no navegador", async ({ page }) => {
    await page.goto("/portal/docs/intro");

    await expect(page.getByRole("heading", { name: "Introdução (fixture)" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-portal-fixture", "ok");
});

test("caminho inexistente ou fora da pasta responde 404", async ({ request }) => {
    const missing = await request.get("/portal/docs/nao-existe");
    expect(missing.status()).toBe(404);
    expect(await missing.text()).toContain("Página do portal não encontrada (fixture)");

    for (const attempt of ["/portal/..%2F..%2Fpackage.json", "/portal/%2e%2e/%2e%2e/.env.example"]) {
        const response = await request.get(attempt);
        expect(response.status(), attempt).toBe(404);
        expect(await response.text()).not.toContain("DATABASE_URL");
    }
});

test("/documentation lista as seções e abre o portal", async ({ page }) => {
    await page.goto("/documentation");

    await expect(page.getByRole("link", { name: "Frontend" })).toHaveAttribute(
        "href",
        "/portal/docs/frontend",
    );
    await expect(page.getByText("e2e0001")).toBeVisible();

    await page.getByRole("link", { name: "Abrir o Portal Dev" }).click();
    await expect(page.getByRole("heading", { name: "Portal Dev (fixture)" })).toBeVisible();
});
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `tests/unit/lib/portal/portal-files.test.ts` | Criado | 15 testes |
| `tests/e2e/fixtures/portal/*` | Criado | Portal falso (5 arquivos) |
| `tests/e2e/support/e2e-env.ts` | Alterado | `PORTAL_DIR` |
| `tests/e2e/portal.spec.ts` | Criado | 5 testes |

## ✅ Como testar

Simule o CI (sem `.portal/` e sem `.env.local`):

```bash
mv .env.local /tmp/env.bak; rm -rf .portal .next
npm run typecheck && npm run lint && npm test && npm run test:e2e && npm run test:integration
mv /tmp/env.bak .env.local
```

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm test` | `Tests: 94 passed` |
| 2 | `npm run test:e2e` | `35 passed` (inclui a acessibilidade da `/documentation` nos dois temas) |
| 3 | `npm run test:integration` | `Tests: 8 passed` |

**Critério de aceite:** o pipeline completo passa **sem** `.portal/`, como no CI.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `/documentation` mostra "não publicado" no E2E | `PORTAL_DIR` não chegou ao servidor | O `webServer` usa `env: e2eServerEnv`; confira a chave |
| Teste do cookie falso recebe 200 | Route Handler usando só o proxy, sem `getSession()` | A validação **tem** de estar no `route.ts` |
| Unitário deixa `segredo.txt` na pasta temporária | Teste interrompido no meio | Apague `/tmp/segredo.txt`; o `afterAll` limpa nas execuções normais |

## Commit sugerido

```bash
git add tests
git commit -m "test(portal): unitários do resolvedor e E2E com portal falso"
```

## Referências

- [Jest — `@jest-environment`](https://jestjs.io/docs/configuration#testenvironment-string)
- [Playwright — API testing (`request`)](https://playwright.dev/docs/api-testing)

---

← [Passo anterior](04-pagina-documentacao.md) · [Índice da fase](README.md) · [Próximo passo](06-token-e-variaveis.md) →
