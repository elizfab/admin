# Passo 07 — Testes de isolamento entre usuárias

> **Fase:** 05 — Testes E2E\
> **Tempo estimado:** 30 min\
> **Depende de:** [Passo 06](06-testes-projetos.md)

## Objetivo

Automatizar o roteiro manual de isolamento da Fase 04 (passo 10): a
**outra** usuária não consegue ver, alterar nem excluir o projeto da
**dona**, nem pela API nem pela tela.

## 💡 Por que

Este é o teste mais importante da fase. A falha que ele vigia (OWASP API1,
*Broken Object Level Authorization*) é a vulnerabilidade **mais comum** em
APIs: basta um desenvolvedor esquecer o `ownerId` em **uma** consulta. Na
Fase 04 o roteiro era manual: alguém precisava lembrar de rodá-lo. Agora ele
roda **sempre**, sozinho.

### Duas usuárias no mesmo teste

| Recurso | Uso |
|---|---|
| `test.beforeAll` + `playwright.request.newContext({ storageState: owner })` | A **dona** cria o projeto uma vez, antes dos testes |
| `test.describe` + `test.use({ storageState: other })` | Dentro do bloco, tudo roda como a **outra** |
| Último teste (fora do bloco) | De volta à dona: o projeto continua intacto |

## Pré-requisitos

- Passo 06 concluído.

## Passo a passo

### 1. Criar `tests/e2e/isolation.spec.ts`

`tests/e2e/isolation.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

import { E2E_BASE_URL, testUsers } from "./support/e2e-env";

/**
 * Isolamento entre usuárias (OWASP API1 — Broken Object Level Authorization):
 * a "outra" não pode ver, alterar nem excluir o projeto da "dona".
 */

let projectId: string;

test.beforeAll(async ({ playwright }) => {
  const owner = await playwright.request.newContext({
    baseURL: E2E_BASE_URL,
    storageState: testUsers.owner.storageState,
  });

  const response = await owner.post("/api/v1/projects", {
    data: { name: "Projeto confidencial da dona" },
    headers: { Origin: E2E_BASE_URL },
  });
  expect(response.status()).toBe(201);
  projectId = (await response.json()).data.id;

  await owner.dispose();
});

test.describe("como a OUTRA usuária", () => {
  test.use({ storageState: testUsers.other.storageState });

  test("a API responde 404 para ler, alterar e excluir", async ({ request }) => {
    const headers = { Origin: E2E_BASE_URL };
    const url = `/api/v1/projects/${projectId}`;

    expect((await request.get(url)).status()).toBe(404);
    expect((await request.patch(url, { data: { name: "invadido" }, headers })).status()).toBe(404);
    expect((await request.delete(url, { headers })).status()).toBe(404);
  });

  test("a lista não mostra o projeto da dona", async ({ page }) => {
    await page.goto("/projects");

    await expect(page.getByText("Projeto confidencial da dona")).toBeHidden();
  });

  test("a tela de edição responde página não encontrada", async ({ page }) => {
    await page.goto(`/projects/${projectId}/edit`);

    await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  });
});

test("o projeto da dona continua intacto", async ({ request }) => {
  const response = await request.get(`/api/v1/projects/${projectId}`);

  expect(response.status()).toBe(200);
  expect((await response.json()).data.name).toBe("Projeto confidencial da dona");
});
```

💡 O teste final (“continua intacto”) é essencial: se o `DELETE` da outra
tivesse funcionado **e** respondido `404` por engano, só esse teste
perceberia.

### 2. Prova do alarme (obrigatória)

Introduza de propósito o bug de segurança, rode e confirme que os testes
**pegam** o problema:

1. Em `src/modules/projects/repositories/project.repository.ts`, no
   `findByIdForOwner`, troque `{ where: { id, ownerId } }` por `{ where: { id } }`.
2. Rode `npx playwright test isolation.spec`.
3. Esperado: **testes falhando** (`Expected: 404 / Received: 200`).
4. **Desfaça a alteração** e rode de novo: tudo passa.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `tests/e2e/isolation.spec.ts` | Criado | 4 testes de isolamento |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npx playwright test isolation.spec` | `6 passed` |
| 2 | Prova do alarme (item 2) | Falha com o bug; passa sem ele |
| 3 | `git diff src/` | Vazio (o bug foi desfeito) |

**Critério de aceite:** os três testes passam.

## Commit sugerido

```bash
git add tests/e2e/isolation.spec.ts
git commit -m "test(e2e): automatiza testes de isolamento entre usuárias"
```

## Referências

- [OWASP API Security — API1:2023 BOLA](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)
- [Playwright — Multiple contexts / roles](https://playwright.dev/docs/auth#testing-multiple-roles-together)
- [Playwright — Hooks (beforeAll)](https://playwright.dev/docs/api/class-test#test-before-all)

---

← [Passo anterior](06-testes-projetos.md) · [Índice da fase](README.md) · [Próximo passo](08-testes-acessibilidade.md) →
