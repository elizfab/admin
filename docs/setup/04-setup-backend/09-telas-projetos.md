# Passo 09 — Telas de Projetos

> **Fase:** 04 — Backend\
> **Tempo estimado:** 90 min\
> **Depende de:** [Passo 08](08-componentes-ui.md)

## Objetivo

Substituir a página “em breve” de `/projects` pelo módulo real: lista,
criação, edição, exclusão com confirmação e uma página 404 em português.

## 💡 Por que

### Mapa das telas

| Rota | Arquivo | Tipo | O que faz |
|---|---|---|---|
| `/projects` | `(private)/projects/page.tsx` | Server | Lista os projetos da usuária (ou estado vazio) |
| `/projects/new` | `(private)/projects/new/page.tsx` | Server | Formulário de criação |
| `/projects/:id/edit` | `(private)/projects/[id]/edit/page.tsx` | Server | Formulário preenchido; `404` se não for dela |
| — | `ProjectForm` | **Client** | Usa `useActionState` (estado, erros, “Salvando…”) |
| — | `DeleteProjectButton` | **Client** | Abre o `AlertDialog` e chama a action |
| — | `ProjectList` | Server | Monta a lista (não precisa de interatividade) |

### Por que a página chama `requireSession()` se o layout já chama

A página **busca dados**, e precisa do `ownerId`. A recomendação do Next.js
é verificar a autorização **perto do dado**, e não confiar só no layout. O
`cache()` do `getSession` faz as duas chamadas custarem **uma** consulta.

### Formulário “progressivo”

O `ProjectForm` usa `<form action={formAction}>`, e não `onSubmit` com
`fetch`. Se o JavaScript ainda não carregou, o navegador envia o formulário
mesmo assim. 💡 É como uma porta que abre com o botão eletrônico **e** com
a chave: se a energia cair, ainda dá para entrar.

## Pré-requisitos

- Passo 08 concluído.

## Passo a passo

### 1. Formulário

```bash
mkdir -p src/modules/projects/components/{ProjectForm,ProjectList,DeleteProjectButton}
```

`src/modules/projects/components/ProjectForm/ProjectForm.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, buttonClassName } from "@/components/ui/Button/Button";

import type { ProjectFormState } from "../../actions/project.actions";
import { projectStatusValues } from "../../schemas/project.schema";
import { projectStatusLabel, type Project } from "../../types/project.types";
import styles from "./ProjectForm.module.scss";

type ProjectFormProps = {
  action: (state: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  project?: Pick<Project, "name" | "description" | "status" | "repositoryUrl">;
  submitLabel: string;
};

export function ProjectForm({ action, project, submitLabel }: ProjectFormProps) {
  // state: resultado da última execução da action; pending: enviando.
  const [state, formAction, pending] = useActionState(action, null);
  const errors = state?.fieldErrors;
  // Depois de um erro, mostra o que foi enviado; senão, os dados do projeto (edição).
  const values = state?.values ?? {
    name: project?.name ?? "",
    description: project?.description ?? "",
    status: project?.status ?? "PLANNED",
    repositoryUrl: project?.repositoryUrl ?? "",
  };

  return (
    <form action={formAction} className={styles.form} noValidate>
      {state?.message && (
        <p className={styles.formError} role="alert">
          {state.message}
        </p>
      )}

      <div className={styles.field}>
        <label htmlFor="name">Nome *</label>
        <input
          id="name"
          name="name"
          defaultValue={values.name}
          required
          maxLength={100}
          aria-invalid={Boolean(errors?.name)}
          aria-describedby={errors?.name ? "name-error" : undefined}
        />
        {errors?.name && (
          <p id="name-error" className={styles.fieldError}>
            {errors.name[0]}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="description">Descrição</label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={500}
          defaultValue={values.description}
          aria-invalid={Boolean(errors?.description)}
          aria-describedby={errors?.description ? "description-error" : undefined}
        />
        {errors?.description && (
          <p id="description-error" className={styles.fieldError}>
            {errors.description[0]}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={values.status}>
          {projectStatusValues.map((status) => (
            <option key={status} value={status}>
              {projectStatusLabel[status]}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="repositoryUrl">Link do repositório</label>
        <input
          id="repositoryUrl"
          name="repositoryUrl"
          type="url"
          placeholder="https://github.com/..."
          defaultValue={values.repositoryUrl}
          aria-invalid={Boolean(errors?.repositoryUrl)}
          aria-describedby={errors?.repositoryUrl ? "repositoryUrl-error" : undefined}
        />
        {errors?.repositoryUrl && (
          <p id="repositoryUrl-error" className={styles.fieldError}>
            {errors.repositoryUrl[0]}
          </p>
        )}
      </div>

      <div className={styles.actions}>
        <Link href="/projects" className={buttonClassName("secondary")}>
          Cancelar
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
```

| Trecho | Explicação |
|---|---|
| `useActionState(action, null)` | `state` = retorno da última execução; `pending` = enviando |
| `state?.values ?? {…}` | Após um erro, mostra o que foi digitado (o React 19 reseta o form) |
| `noValidate` | Desliga os balões nativos do navegador; quem valida é o servidor (Zod), com mensagens em português |
| `aria-invalid` + `aria-describedby` | O leitor de tela anuncia “inválido” e lê a mensagem de erro do campo |
| `<select>` nativo | Acessível e suficiente aqui; o `Select` do Radix fica para quando houver necessidade visual |

`src/modules/projects/components/ProjectForm/ProjectForm.module.scss`:

```scss
@use "@/styles/abstracts" as *;

.form {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  max-width: 640px;
  padding: $space-5;
  background: var(--card-background);
  border: 1px solid var(--border);
  border-radius: $radius-lg;
}

.field {
  display: flex;
  flex-direction: column;
  gap: $space-1;

  label {
    font-size: $font-size-sm;
    font-weight: 600;
  }

  input,
  textarea,
  select {
    padding: $space-3;
    font: inherit;
    background: var(--card-background);
    border: 1px solid var(--border);
    border-radius: $radius-sm;

    &:focus-visible {
      @include focus-ring;
    }

    &[aria-invalid="true"] {
      border-color: var(--red);
    }
  }
}

.fieldError {
  margin: 0;
  font-size: $font-size-sm;
  color: var(--red);
}

.formError {
  margin: 0;
  padding: $space-2 $space-3;
  color: var(--red);
  background: color-mix(in srgb, var(--red) 10%, transparent);
  border-radius: $radius-sm;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
}
```

### 2. Botão de excluir com confirmação

`src/modules/projects/components/DeleteProjectButton/DeleteProjectButton.tsx`:

```tsx
"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/AlertDialog/AlertDialog";
import { Button } from "@/components/ui/Button/Button";

import { deleteProjectAction } from "../../actions/project.actions";

type DeleteProjectButtonProps = {
  projectId: string;
  projectName: string;
};

export function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteProjectAction(projectId);

      if (result?.message) {
        setError(result.message);
        return;
      }

      setOpen(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="secondary" aria-label={`Excluir o projeto ${projectName}`}>
          <Trash2 size={16} aria-hidden="true" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
        <AlertDialogDescription>
          O projeto “{projectName}” será excluído permanentemente. Esta ação não pode ser
          desfeita.
        </AlertDialogDescription>

        {error && <p role="alert">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="secondary">Cancelar</Button>
          </AlertDialogCancel>
          {/* Botão comum (e não AlertDialogAction) para o diálogo só fechar após o sucesso. */}
          <Button variant="danger" onClick={handleConfirm} disabled={pending}>
            {pending ? "Excluindo…" : "Excluir"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

💡 `useTransition` mantém a tela respondendo enquanto a action roda, e dá o
`pending` para mostrar “Excluindo…”.

### 3. Lista

`src/modules/projects/components/ProjectList/ProjectList.tsx`:

```tsx
import { ExternalLink, Pencil } from "lucide-react";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/Button/Button";
import { cn } from "@/lib/utils/cn";

import { projectStatusLabel, type Project } from "../../types/project.types";
import { DeleteProjectButton } from "../DeleteProjectButton/DeleteProjectButton";
import styles from "./ProjectList.module.scss";

type ProjectListProps = {
  projects: Project[];
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function ProjectList({ projects }: ProjectListProps) {
  return (
    <ul className={styles.list}>
      {projects.map((project) => (
        <li key={project.id} className={styles.item}>
          <div className={styles.info}>
            <div className={styles.titleRow}>
              <h2 className={styles.name}>{project.name}</h2>
              <span className={cn(styles.status, styles[`status_${project.status}`])}>
                {projectStatusLabel[project.status]}
              </span>
            </div>

            {project.description && <p className={styles.description}>{project.description}</p>}

            <p className={styles.meta}>
              Atualizado em {dateFormatter.format(project.updatedAt)}
              {project.repositoryUrl && (
                <>
                  {" · "}
                  <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">
                    Repositório <ExternalLink size={12} aria-hidden="true" />
                    <span className="visually-hidden"> (abre em nova aba)</span>
                  </a>
                </>
              )}
            </p>
          </div>

          <div className={styles.actions}>
            <Link
              href={`/projects/${project.id}/edit`}
              className={buttonClassName("secondary")}
              aria-label={`Editar o projeto ${project.name}`}
            >
              <Pencil size={16} aria-hidden="true" />
            </Link>
            <DeleteProjectButton projectId={project.id} projectName={project.name} />
          </div>
        </li>
      ))}
    </ul>
  );
}
```

| Trecho | Explicação |
|---|---|
| `Intl.DateTimeFormat` com `timeZone: "America/Sao_Paulo"` | O banco guarda em UTC; a conversão acontece **só na exibição** (seção 13.2) |
| `rel="noopener noreferrer"` | Link externo em nova aba sem dar à outra página acesso à sua aba |
| `aria-label` nos botões só com ícone | “Editar o projeto Portal”, e não apenas “botão” |

`src/modules/projects/components/ProjectList/ProjectList.module.scss`:

```scss
@use "@/styles/abstracts" as *;

.list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  margin: 0;
  padding: 0;
  list-style: none;
}

.item {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-4;
  background: var(--card-background);
  border: 1px solid var(--border);
  border-radius: $radius-lg;

  @include up("md") {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.info {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  min-width: 0;
}

.titleRow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;
}

.name {
  font-size: $font-size-md;
}

.description {
  margin: 0;
  color: var(--text-color-secondary);
}

.meta {
  margin: 0;
  font-size: $font-size-xs;
  color: var(--text-color-secondary);

  a {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: var(--accent-color);
    text-decoration: underline;
  }
}

.actions {
  display: flex;
  flex-shrink: 0;
  gap: $space-2;
}

.status {
  padding: 2px $space-2;
  font-size: $font-size-xs;
  font-weight: 600;
  border-radius: 999px;
}

.status_PLANNED {
  color: var(--text-color-secondary);
  background: var(--background);
}

.status_IN_PROGRESS {
  color: var(--accent-color);
  background: var(--selection-color);
}

.status_PAUSED {
  color: var(--yellow);
  background: color-mix(in srgb, var(--yellow) 14%, transparent);
}

.status_DONE {
  color: var(--green);
  background: color-mix(in srgb, var(--green) 14%, transparent);
}
```

### 4. Páginas

```bash
mkdir -p "src/app/(private)/projects/new" "src/app/(private)/projects/[id]/edit"
```

Substitua `src/app/(private)/projects/page.tsx`:

`src/app/(private)/projects/page.tsx`:

```tsx
import { FolderKanban, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { buttonClassName } from "@/components/ui/Button/Button";
import { requireSession } from "@/lib/auth/session";
import { ProjectList } from "@/modules/projects/components/ProjectList/ProjectList";
import { listProjects } from "@/modules/projects/server";

export const metadata: Metadata = {
  title: "Projetos",
};

export default async function ProjectsPage() {
  // A página busca dados: valida a sessão aqui também (perto do dado),
  // sem depender só do layout. getSession() é cacheada por requisição.
  const session = await requireSession();
  const projects = await listProjects(session.user.id);

  const newProjectLink = (
    <Link href="/projects/new" className={buttonClassName("primary")}>
      <Plus size={16} aria-hidden="true" />
      Novo projeto
    </Link>
  );

  if (projects.length === 0) {
    return (
      <EmptyState
        headingLevel="h1"
        icon={<FolderKanban size={32} aria-hidden="true" />}
        title="Projetos"
        description="Você ainda não tem projetos cadastrados."
        action={newProjectLink}
      />
    );
  }

  return (
    <>
      <PageHeader title="Projetos" action={newProjectLink} />
      <ProjectList projects={projects} />
    </>
  );
}
```

`src/app/(private)/projects/new/page.tsx`:

```tsx
import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { createProjectAction } from "@/modules/projects/actions/project.actions";
import { ProjectForm } from "@/modules/projects/components/ProjectForm/ProjectForm";

export const metadata: Metadata = {
  title: "Novo projeto",
};

export default function NewProjectPage() {
  return (
    <>
      <PageHeader title="Novo projeto" />
      <ProjectForm action={createProjectAction} submitLabel="Criar projeto" />
    </>
  );
}
```

`src/app/(private)/projects/[id]/edit/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { requireSession } from "@/lib/auth/session";
import { NotFoundError } from "@/lib/errors/app-error";
import { idSchema } from "@/lib/validations/common.schema";
import { updateProjectAction } from "@/modules/projects/actions/project.actions";
import { ProjectForm } from "@/modules/projects/components/ProjectForm/ProjectForm";
import { getProject } from "@/modules/projects/server";

export const metadata: Metadata = {
  title: "Editar projeto",
};

export default async function EditProjectPage({ params }: PageProps<"/projects/[id]/edit">) {
  const session = await requireSession();
  const parsedId = idSchema.safeParse((await params).id);

  if (!parsedId.success) notFound();

  const project = await getProject(session.user.id, parsedId.data).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  // bind fixa o id como 1º argumento da action, no servidor.
  const action = updateProjectAction.bind(null, project.id);

  return (
    <>
      <PageHeader title="Editar projeto" />
      <ProjectForm action={action} project={project} submitLabel="Salvar alterações" />
    </>
  );
}
```

💡 `updateProjectAction.bind(null, project.id)` cria uma nova action com o
`id` já preenchido. O `id` não fica num `<input hidden>` que poderia ser
editado no navegador; mesmo assim, a action **revalida** dona e formato.

### 5. Página 404 em português

`src/app/not-found.tsx`:

```tsx
import { SearchX } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { buttonClassName } from "@/components/ui/Button/Button";

import styles from "./not-found.module.scss";

// Página 404 global (notFound() ou URL inexistente).
// Usa <div>, e não <main>: dentro da área privada ela é renderizada
// no <main> do layout privado (validado).
export default function NotFound() {
  return (
    <div className={styles.notFound}>
      <EmptyState
        headingLevel="h1"
        icon={<SearchX size={32} aria-hidden="true" />}
        title="Página não encontrada"
        description="O endereço não existe ou você não tem acesso a este conteúdo."
        action={
          <Link href="/dashboard" className={buttonClassName("primary")}>
            Voltar ao dashboard
          </Link>
        }
      />
    </div>
  );
}
```

`src/app/not-found.module.scss`:

```scss
@use "@/styles/abstracts" as *;

.notFound {
  display: grid;
  place-items: center;
  min-height: 60vh;
  padding: $space-4;
}
```

### 6. Dashboard: módulo Projetos disponível

Em `src/modules/dashboard/data/modules.mock.ts`, no item `projects`, troque
`status: "soon"` por `status: "available"`.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/modules/projects/components/*` | Criados | Formulário, lista e exclusão |
| `src/app/(private)/projects/page.tsx` | Alterado | Lista real |
| `src/app/(private)/projects/new/page.tsx` | Criado | Criação |
| `src/app/(private)/projects/[id]/edit/page.tsx` | Criado | Edição |
| `src/app/not-found.tsx` + `.module.scss` | Criados | 404 em português |
| `src/modules/dashboard/data/modules.mock.ts` | Alterado | Projetos “Disponível” |

## ✅ Como testar

Com `npm run dev`, logada:

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Abrir `/projects` sem projetos | Estado vazio com o botão “Novo projeto” |
| 2 | Criar com nome “AB” e link `http://x.com` | Mensagens nos dois campos; **o texto digitado continua lá** |
| 3 | Criar um projeto válido (status “Em andamento”) | Volta para a lista com o projeto e o selo “Em andamento” |
| 4 | Editar e trocar o nome para o de outro projeto seu | “Já existe um projeto com este nome.” |
| 5 | Editar com um nome novo | Lista atualizada |
| 6 | Clicar no ícone de lixeira | Diálogo “Excluir projeto?”; **`Esc` fecha sem excluir** |
| 7 | Excluir de novo e confirmar | O projeto some da lista |
| 8 | Abrir `/projects/<id-excluído>/edit` | “Página não encontrada” |
| 9 | Só teclado: `Tab` até a lixeira → `Enter` → `Tab` até “Cancelar”/“Excluir” | Foco preso no diálogo; contorno visível |
| 10 | Largura de celular | Itens empilhados; botões abaixo do texto |
| 11 | `npm run typecheck && npm run lint && npm test && npm run build` | Tudo passa; o build lista `/projects`, `/projects/new` e `/projects/[id]/edit` |

**Critério de aceite:** os onze testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Campos somem após erro de validação | Formulário sem `state.values` | Conferir o `values` no `ProjectForm` e o retorno das actions |
| `You're importing a module that depends on "server-only"` (erro de build) | Client Component importou `@/modules/projects/server` | No cliente, importe de `@/modules/projects` (schemas/tipos) ou chame actions |
| Lista não atualiza após salvar | Faltou `revalidatePath` | Conferir as actions (passo 07) |

## Commit sugerido

```bash
git add src
git commit -m "feat(projects): adiciona telas de listar, criar, editar e excluir projetos"
```

## Referências

- [Next.js — Forms with Server Actions](https://nextjs.org/docs/app/guides/forms)
- [Next.js — not-found.js](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)
- [React — useTransition](https://react.dev/reference/react/useTransition)
- [Next.js — Data security](https://nextjs.org/docs/app/guides/data-security)

---

← [Passo anterior](08-componentes-ui.md) · [Índice da fase](README.md) · [Próximo passo](10-validacao-final.md) →
