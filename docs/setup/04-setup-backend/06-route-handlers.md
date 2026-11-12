# Passo 06 — Route Handlers `/api/v1/projects`

> **Fase:** 04 — Backend\
> **Tempo estimado:** 45 min\
> **Depende de:** [Passo 05](05-servico.md)

## Objetivo

Expor o módulo como API REST, com as operações listar, criar, consultar,
atualizar e excluir.

## 💡 Por que (e quando) Route Handlers

A Server Action (passo 07) atende as **telas da própria aplicação**. O Route
Handler é a porta para **quem está de fora**: um app independente, um script,
o `curl`, os testes E2E (seção 9.3). Os dois chamam o **mesmo** serviço.

| Método | Rota | Ação | Sucesso |
|---|---|---|---|
| `GET` | `/api/v1/projects` | Listar os projetos da usuária | `200` |
| `POST` | `/api/v1/projects` | Criar | `201` |
| `GET` | `/api/v1/projects/:id` | Consultar | `200` |
| `PATCH` | `/api/v1/projects/:id` | Atualizar parcialmente | `200` |
| `DELETE` | `/api/v1/projects/:id` | Excluir | `204` (sem corpo) |

### O molde de todo handler

```text
try:
  1. sessão      → requireApiSession()            (401 se não houver)
  2. entrada     → readJson + schema.safeParse     (400 se inválida)
  3. regra       → serviço(session.user.id, dados) (404 / 409)
  4. resposta    → ok / created / noContent
catch:
  apiError(error)                                  (formato padrão)
```

💡 O `ownerId` sai **sempre** de `session.user.id`. Mesmo que alguém envie
`"ownerId": "outra-pessoa"` no JSON, o Zod descarta o campo, e ele nunca
chega ao serviço (validado no passo 10).

### `RouteContext` e `params` assíncronos (Next.js 16)

No Next.js 16, `params` é uma **Promise**: precisa de `await ctx.params`. O
tipo global `RouteContext<"/api/v1/projects/[id]">`, gerado pelo `next
typegen`, dá os tipos de `params` a partir do caminho da rota.

## Pré-requisitos

- Passo 05 concluído.

## Passo a passo

### 1. Coleção: listar e criar

```bash
mkdir -p "src/app/api/v1/projects/[id]"
```

`src/app/api/v1/projects/route.ts`:

```ts
import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, created, ok, readJson } from "@/lib/http/api-response";
import { toFieldErrors } from "@/lib/validations/common.schema";
import { createProjectSchema } from "@/modules/projects";
import { createProject, listProjects } from "@/modules/projects/server";

export async function GET() {
  try {
    const session = await requireApiSession();
    const projects = await listProjects(session.user.id);

    return ok(projects);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    const parsed = createProjectSchema.safeParse(await readJson(request));

    if (!parsed.success) {
      throw new ValidationError(toFieldErrors(parsed.error));
    }

    // ownerId vem da SESSÃO, nunca do corpo da requisição.
    const project = await createProject(session.user.id, parsed.data);

    return created(project);
  } catch (error) {
    return apiError(error);
  }
}
```

### 2. Item: consultar, atualizar e excluir

`src/app/api/v1/projects/[id]/route.ts`:

```ts
import { requireApiSession } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { apiError, noContent, ok, readJson } from "@/lib/http/api-response";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import { updateProjectSchema } from "@/modules/projects";
import { deleteProject, getProject, updateProject } from "@/modules/projects/server";

type Context = RouteContext<"/api/v1/projects/[id]">;

async function parseId(ctx: Context) {
  const { id } = await ctx.params;
  const parsed = idSchema.safeParse(id);

  if (!parsed.success) {
    throw new ValidationError({ id: ["Identificador inválido."] });
  }

  return parsed.data;
}

export async function GET(_request: Request, ctx: Context) {
  try {
    const session = await requireApiSession();
    const project = await getProject(session.user.id, await parseId(ctx));

    return ok(project);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, ctx: Context) {
  try {
    const session = await requireApiSession();
    const id = await parseId(ctx);
    const parsed = updateProjectSchema.safeParse(await readJson(request));

    if (!parsed.success) {
      throw new ValidationError(toFieldErrors(parsed.error));
    }

    const project = await updateProject(session.user.id, id, parsed.data);

    return ok(project);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, ctx: Context) {
  try {
    const session = await requireApiSession();
    await deleteProject(session.user.id, await parseId(ctx));

    return noContent();
  } catch (error) {
    return apiError(error);
  }
}
```

💡 O `parseId` valida o formato do `id` **antes** de consultar o banco: um
`/api/v1/projects/abc` nem chega ao Prisma.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/app/api/v1/projects/route.ts` | Criado | `GET` (lista) e `POST` (cria) |
| `src/app/api/v1/projects/[id]/route.ts` | Criado | `GET`, `PATCH` e `DELETE` |

## ✅ Como testar

Com `npm run dev` rodando. Primeiro, faça login pelo `curl` e guarde o cookie:

```bash
B=http://localhost:3000
curl -s -c /tmp/sessao.txt -o /dev/null -H "Origin: $B" -H "Content-Type: application/json" \
  -d '{"email":"SEU-EMAIL","password":"SUA-SENHA"}' $B/api/auth/sign-in/email
```

| # | Comando | Resultado esperado |
|---|---|---|
| 1 | `curl -s $B/api/v1/projects` | `401` `{"error":{"code":"UNAUTHORIZED",…}}` |
| 2 | `curl -s -b /tmp/sessao.txt -H "Origin: $B" -H "Content-Type: application/json" -d '{"name":"Personal Platform","repositoryUrl":"https://github.com/elizfab/admin"}' $B/api/v1/projects` | `201` `{"data":{"id":"…","status":"PLANNED",…}}`. **Copie o `id`** |
| 3 | Repetir o comando 2 | `409` `CONFLICT` “Já existe um projeto com este nome.” |
| 4 | `curl -s -b /tmp/sessao.txt -H "Origin: $B" -H "Content-Type: application/json" -d '{"name":"AB","repositoryUrl":"http://x.com"}' $B/api/v1/projects` | `400` com `fieldErrors` de `name` e `repositoryUrl` |
| 5 | `curl -s -b /tmp/sessao.txt -H "Origin: $B" -H "Content-Type: application/json" -d '{ruim' $B/api/v1/projects` | `400` “Corpo da requisição não é um JSON válido.” |
| 6 | `curl -s -b /tmp/sessao.txt -X PATCH -H "Origin: $B" -H "Content-Type: application/json" -d '{"status":"IN_PROGRESS"}' $B/api/v1/projects/ID` | `200` com `"status":"IN_PROGRESS"` e o **nome mantido** |
| 7 | `curl -s -b /tmp/sessao.txt $B/api/v1/projects/abc` | `400` “Identificador inválido.” |
| 8 | `curl -s -o /dev/null -w "%{http_code}\n" -b /tmp/sessao.txt -X DELETE -H "Origin: $B" $B/api/v1/projects/ID` | `204` |
| 9 | `curl -s -b /tmp/sessao.txt $B/api/v1/projects/ID` | `404` “Projeto não encontrado.” |

> Dica: acrescente `-w "  ← HTTP %{http_code}\n"` ao `curl` para ver o
> código de status ao lado do corpo.

**Critério de aceite:** os nove resultados conferem. Depois, apague o arquivo
do cookie: `rm /tmp/sessao.txt`.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Cannot find name 'RouteContext'` | Tipos de rota não gerados | `npm run typecheck` (roda o `next typegen`) |
| `params` é `undefined` / Promise | Faltou `await ctx.params` | Usar o `parseId(ctx)` |
| `401` mesmo após o login | Cookie não enviado | Conferir o `-b /tmp/sessao.txt` |

## Commit sugerido

```bash
git add src/app/api/v1/projects
git commit -m "feat(api): adiciona endpoints REST de projetos"
```

## Referências

- [Next.js — Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Next.js — route.js (RouteContext)](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [MDN — PATCH](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Methods/PATCH)
- ARCHITECTURE.md, seções 9.1, 10.1 e 10.2

---

← [Passo anterior](05-servico.md) · [Índice da fase](README.md) · [Próximo passo](07-server-actions.md) →
