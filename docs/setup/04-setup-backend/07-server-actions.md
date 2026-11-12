# Passo 07 — Server Actions

> **Fase:** 04 — Backend\
> **Tempo estimado:** 40 min\
> **Depende de:** [Passo 06](06-route-handlers.md)

## Objetivo

Criar as Server Actions de criar, editar e excluir projetos, usadas pelas
telas do passo 09.

## 💡 Por que

### O que é uma Server Action

É uma função marcada com `"use server"` que o **formulário chama
diretamente**, sem você criar uma URL nem escrever `fetch`. O Next.js cria
por baixo um endpoint `POST` e cuida do envio. É como um interfone direto
com a cozinha: o garçom não precisa atravessar o salão.

### ⚠️ “Sem URL” não significa “privada”

O Next.js gera um endpoint real para cada action. Qualquer pessoa com o
identificador dela pode chamá-la (seção 9.2). Por isso **toda action** repete
o molde dos Route Handlers: **sessão → validação → serviço**.

### Por que devolver `values` no estado

No React 19, um `<form action={…}>` é **resetado** automaticamente quando a
action termina. Sem cuidado, um erro de validação **apaga tudo** o que a
pessoa digitou (validado durante a escrita deste guia). A action devolve os
valores enviados (`values`), e o formulário os usa como valor inicial.

### Por que `redirect()` fica fora do `try`

O `redirect()` funciona **lançando uma exceção especial** que o Next.js
captura para fazer o redirecionamento. Dentro do `try`, o `catch` a
“engoliria” e o redirecionamento não aconteceria.

## Pré-requisitos

- Passo 06 concluído.

## Passo a passo

### 1. Actions

```bash
mkdir -p src/modules/projects/actions
```

`src/modules/projects/actions/project.actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireApiSession } from "@/lib/auth/session";
import { AppError, ValidationError, type FieldErrors } from "@/lib/errors/app-error";
import { idSchema, toFieldErrors } from "@/lib/validations/common.schema";
import { createProjectSchema, updateProjectSchema } from "@/modules/projects";
import { createProject, deleteProject, updateProject } from "@/modules/projects/server";

/**
 * Server Actions são pontos de entrada do servidor, como uma API:
 * TODA action valida sessão, dados e permissão (ARCHITECTURE.md, seção 9.2).
 */

export type ProjectFormValues = {
  name: string;
  description: string;
  status: string;
  repositoryUrl: string;
};

export type ProjectFormState = {
  message?: string;
  fieldErrors?: FieldErrors;
  /** Valores enviados: o React 19 limpa o formulário após a action, então devolvemos o que foi digitado. */
  values?: ProjectFormValues;
} | null;

function readProjectForm(formData: FormData): ProjectFormValues {
  const text = (key: string) => String(formData.get(key) ?? "");

  return {
    name: text("name"),
    description: text("description"),
    status: text("status"),
    repositoryUrl: text("repositoryUrl"),
  };
}

function toFormState(error: unknown, values?: ProjectFormValues): ProjectFormState {
  if (error instanceof AppError) {
    return { message: error.message, fieldErrors: error.fieldErrors, values };
  }

  console.error("[projects] erro inesperado na action:", error);
  return { message: "Erro inesperado. Tente novamente.", values };
}

export async function createProjectAction(
  _previousState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const values = readProjectForm(formData);

  try {
    const session = await requireApiSession();
    const parsed = createProjectSchema.safeParse(values);

    if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));

    await createProject(session.user.id, parsed.data);
  } catch (error) {
    return toFormState(error, values);
  }

  // redirect() fica FORA do try: ele funciona lançando uma exceção especial.
  revalidatePath("/projects");
  redirect("/projects");
}

export async function updateProjectAction(
  id: string,
  _previousState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const values = readProjectForm(formData);

  try {
    const session = await requireApiSession();
    const projectId = idSchema.parse(id);
    const parsed = updateProjectSchema.safeParse(values);

    if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));

    await updateProject(session.user.id, projectId, parsed.data);
  } catch (error) {
    return toFormState(error, values);
  }

  revalidatePath("/projects");
  redirect("/projects");
}

export async function deleteProjectAction(id: string): Promise<ProjectFormState> {
  try {
    const session = await requireApiSession();

    await deleteProject(session.user.id, idSchema.parse(id));
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/projects");
  return null;
}
```

| Trecho | Explicação |
|---|---|
| `"use server"` no topo | Todas as funções exportadas viram Server Actions |
| `_previousState` | Assinatura exigida pelo `useActionState` (o estado anterior), aqui não utilizado |
| `updateProjectAction(id, …)` | O `id` é fixado com `.bind` na página (passo 09) e **validado de novo aqui** |
| `revalidatePath("/projects")` | Garante que a lista mostre os dados novos |
| `deleteProjectAction` retorna `null` no sucesso | O componente sabe que pode fechar o diálogo |

💡 Repare que o arquivo exporta um **tipo** (`ProjectFormState`). Isso é
permitido em `"use server"`, porque tipos somem na compilação. Já exportar
uma **constante** ou função não assíncrona daria erro.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/modules/projects/actions/project.actions.ts` | Criado | Server Actions do módulo |

## ✅ Como testar

O teste funcional acontece com as telas (passo 09). Agora:

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run typecheck` | Sem erros |
| 2 | `npm run lint` | Sem erros |
| 3 | `npm run build` | Sem erros |

**Critério de aceite:** os três testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Only async functions are allowed to be exported in a "use server" file` | Exportou constante ou função síncrona | Mover para outro arquivo (ex.: `types/`) |
| Redirecionamento não acontece | `redirect()` dentro do `try` | Mover para depois do `try/catch` |

## Commit sugerido

```bash
git add src/modules/projects/actions
git commit -m "feat(projects): adiciona Server Actions de criar, editar e excluir"
```

## Referências

- [Next.js — Updating data (Server Functions)](https://nextjs.org/docs/app/getting-started/updating-data)
- [Next.js — Data security: Server Actions](https://nextjs.org/docs/app/guides/data-security)
- [React — useActionState](https://react.dev/reference/react/useActionState)
- ARCHITECTURE.md, seção 9.2

---

← [Passo anterior](06-route-handlers.md) · [Índice da fase](README.md) · [Próximo passo](08-componentes-ui.md) →
