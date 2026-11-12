# Passo 03 — Padrão de erros e respostas da API

> **Fase:** 04 — Backend\
> **Tempo estimado:** 45 min\
> **Depende de:** [Passo 02](02-zod-schemas.md)

## Objetivo

Criar as classes de erro da aplicação, os helpers de resposta da API, o
helper `requireApiSession()` e aplicar o padrão ao `/api/v1/me`.

## 💡 Por que um padrão

Sem padrão, cada endpoint responde de um jeito: um devolve `{ msg }`, outro
`{ message }`, outro só um texto. Quem consome a API (a sua própria tela, um
app futuro, um teste) precisa de um “manual” diferente para cada rota.

Com o padrão, todo endpoint fala **a mesma língua**:

```jsonc
// sucesso
{ "data": { "id": "...", "name": "Portal" } }

// erro
{ "error": { "code": "VALIDATION_ERROR", "message": "Dados inválidos.",
             "fieldErrors": { "name": ["O nome precisa ter pelo menos 3 caracteres."] } } }
```

| Classe | HTTP | `code` | Quando |
|---|---|---|---|
| `ValidationError` | 400 | `VALIDATION_ERROR` | Formato inválido (Zod) ou JSON malformado |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` | Sem sessão válida |
| `ForbiddenError` | 403 | `FORBIDDEN` | Com sessão, mas sem permissão (ex.: papel) |
| `NotFoundError` | 404 | `NOT_FOUND` | Não existe **ou não é seu** |
| `ConflictError` | 409 | `CONFLICT` | Viola regra de unicidade (nome repetido) |
| qualquer outro | 500 | `INTERNAL_ERROR` | Erro inesperado: mensagem **genérica**, detalhe só no log |

💡 Os erros são como **etiquetas de devolução** no correio: o serviço
cola a etiqueta certa (“endereço inexistente”, “conteúdo recusado”), e o
balcão (`apiError`) só lê a etiqueta e carimba o código HTTP. Quem
inventa o motivo é o serviço; quem fala HTTP é a camada de entrada.

### Por que 404 (e não 403) para projeto de outra pessoa

Responder `403` confirmaria que o projeto **existe**. `404` não revela nada,
como o “e-mail ou senha inválidos” do login.

### Por que o health check não segue este formato

`/api/v1/health` é lido por ferramentas de monitoramento, que esperam um
formato próprio, simples e estável. É uma exceção documentada.

## Pré-requisitos

- Passo 02 concluído.

## Passo a passo

### 1. Classes de erro

```bash
mkdir -p src/lib/errors src/lib/http
```

`src/lib/errors/app-error.ts`:

```ts
/**
 * Erros de aplicação: cada um carrega o código HTTP e uma mensagem
 * SEGURA para mostrar ao cliente. Detalhes internos nunca vão aqui.
 */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT";

export type FieldErrors = Record<string, string[] | undefined>;

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number,
    public readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(fieldErrors?: FieldErrors, message = "Dados inválidos.") {
    super("VALIDATION_ERROR", message, 400, fieldErrors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autenticado.") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado.") {
    super("FORBIDDEN", message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado.") {
    super("NOT_FOUND", message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflito com um recurso existente.") {
    super("CONFLICT", message, 409);
  }
}
```

💡 `this.name = new.target.name` faz `error.name` ser `"NotFoundError"`, e
não `"Error"`. Isso ajuda a ler os logs.

### 2. Helpers de resposta

`src/lib/http/api-response.ts`:

```ts
import { NextResponse } from "next/server";

import { AppError, ValidationError } from "@/lib/errors/app-error";

/**
 * Formato padrão das respostas da API /api/v1:
 *   sucesso → { "data": ... }
 *   erro    → { "error": { "code", "message", "fieldErrors"? } }
 */

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function apiError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.fieldErrors && { fieldErrors: error.fieldErrors }),
        },
      },
      { status: error.status },
    );
  }

  // Erro inesperado: detalhe só no log do servidor; resposta genérica.
  console.error("[api] erro inesperado:", error);

  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Erro interno. Tente novamente." } },
    { status: 500 },
  );
}

/** Lê o corpo JSON; JSON malformado vira 400, e não 500. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError(undefined, "Corpo da requisição não é um JSON válido.");
  }
}
```

| Helper | Uso |
|---|---|
| `ok(data)` / `created(data)` | `200` / `201` com `{ data }` |
| `noContent()` | `204` sem corpo (ex.: exclusão) |
| `apiError(error)` | Converte **qualquer** erro na resposta padrão |
| `readJson(request)` | JSON malformado vira `400`, e não `500` |

### 3. `requireApiSession()`

No final de `src/lib/auth/session.ts`, adicione (e importe o
`UnauthorizedError` no topo do arquivo):

```ts
import { UnauthorizedError } from "@/lib/errors/app-error";
```

```ts
/**
 * Para Route Handlers e Server Actions: sem sessão, lança UnauthorizedError
 * (vira 401 na API). APIs não redirecionam.
 */
export async function requireApiSession() {
  const session = await getSession();

  if (!session) {
    throw new UnauthorizedError();
  }

  return session;
}
```

### 4. Aplicar o padrão ao `/api/v1/me`

Substitua `src/app/api/v1/me/route.ts`:

`src/app/api/v1/me/route.ts`:

```ts
import { requireApiSession } from "@/lib/auth/session";
import { apiError, ok } from "@/lib/http/api-response";

export async function GET() {
  try {
    const session = await requireApiSession();
    const { id, name, email, role } = session.user;

    // Retorna somente o necessário — nunca tokens ou dados da sessão.
    return ok({ id, name, email, role });
  } catch (error) {
    return apiError(error);
  }
}
```

O `try { … } catch (error) { return apiError(error); }` é o **molde** de
todo Route Handler daqui em diante.

### 5. Testes

```bash
mkdir -p tests/unit/lib/http
```

`tests/unit/lib/http/api-response.test.ts`:

```ts
/**
 * @jest-environment node
 */
// Ambiente "node" (e não jsdom): Request/Response do servidor existem aqui.
import { ConflictError, ValidationError } from "@/lib/errors/app-error";
import { apiError, ok, readJson } from "@/lib/http/api-response";

describe("api-response", () => {
  it("envolve o sucesso em { data }", async () => {
    const response = ok({ id: "1" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { id: "1" } });
  });

  it("converte AppError no formato padrão com o status correto", async () => {
    const response = apiError(new ConflictError("Nome em uso."));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: { code: "CONFLICT", message: "Nome em uso." },
    });
  });

  it("inclui fieldErrors em erros de validação", async () => {
    const response = apiError(new ValidationError({ name: ["Obrigatório."] }));

    expect((await response.json()).error.fieldErrors).toEqual({ name: ["Obrigatório."] });
  });

  it("nunca expõe a mensagem de um erro inesperado", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const response = apiError(new Error("senha do banco: 123"));
    const body = JSON.stringify(await response.json());

    expect(response.status).toBe(500);
    expect(body).not.toContain("senha");
  });

  it("transforma JSON malformado em ValidationError", async () => {
    const request = new Request("http://localhost", { method: "POST", body: "{ruim" });

    await expect(readJson(request)).rejects.toBeInstanceOf(ValidationError);
  });
});
```

💡 O comentário `@jest-environment node` no topo troca o ambiente **só
deste arquivo**: as classes `Request`/`Response` usadas pelo
`NextResponse` existem no Node, mas não no jsdom (o navegador simulado
dos testes de componentes).

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/lib/errors/app-error.ts` | Criado | Erros da aplicação |
| `src/lib/http/api-response.ts` | Criado | Formato padrão das respostas |
| `src/lib/auth/session.ts` | Alterado | `requireApiSession()` |
| `src/app/api/v1/me/route.ts` | Alterado | Segue o padrão `{ data }` |
| `tests/unit/lib/http/api-response.test.ts` | Criado | 5 testes |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npx jest tests/unit/lib/http` | `Tests: 5 passed` |
| 2 | `curl -s http://localhost:3000/api/v1/me` (com `npm run dev`) | `{"error":{"code":"UNAUTHORIZED","message":"Não autenticado."}}` |
| 3 | `npm run typecheck && npm run lint` | Sem erros |

**Critério de aceite:** os três testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `ReferenceError: Request is not defined` no teste | Ambiente jsdom | Manter o bloco `@jest-environment node` **na primeira linha** do arquivo |
| Teste de 500 polui a saída com o log | `console.error` real | O teste usa `jest.spyOn(console, "error")` para silenciá-lo |

## Commit sugerido

```bash
git add src/lib/errors src/lib/http src/lib/auth/session.ts src/app/api/v1/me tests/unit/lib/http
git commit -m "feat(api): padroniza erros e respostas da API"
```

## Referências

- [MDN — Códigos de status HTTP](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status)
- [Next.js — Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Jest — testEnvironment por arquivo](https://jestjs.io/docs/configuration#testenvironment-string)
- ARCHITECTURE.md, seções 10.2 e 22.3

---

← [Passo anterior](02-zod-schemas.md) · [Índice da fase](README.md) · [Próximo passo](04-repositorio.md) →
