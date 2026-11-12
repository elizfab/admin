# Passo 09 — Dashboard mockado e estados (loading, vazio e erro)

> **Fase:** 01 — Frontend\
> **Tempo estimado:** 60 min\
> **Depende de:** [Passo 08](08-layout-base.md)

## Objetivo

Criar o dashboard com cards dos módulos, alimentado por **dados mockados**,
as páginas dos módulos com estado vazio e os estados de carregamento e erro.

## 💡 Por que

### Dados mockados

O mock é a **maquete** do prédio: tem o formato real, mas ainda não tem
encanamento. Os componentes recebem dados com o **mesmo formato** (tipo
`DashboardModule`) que virá do servidor nas próximas fases. Quando o banco
existir, só a **origem** dos dados muda; os componentes continuam iguais.

### Por que o dashboard vira um módulo (`src/modules/dashboard`)

O dashboard tem tipos, dados e componentes próprios. Pela arquitetura
(seção 1.1, princípio 3), isso é **domínio** e fica em `modules/`. O que é
genérico (`EmptyState`) fica em `components/shared/`.

### Os três estados que toda tela precisa ter

| Estado | Arquivo / componente | Quando aparece |
|---|---|---|
| **Carregando** | `loading.tsx` | Enquanto a página carrega (o Next.js mostra sozinho) |
| **Vazio** | `EmptyState` | Não há dados (ou o módulo ainda não existe) |
| **Erro** | `error.tsx` | Uma exceção acontece ao renderizar |

## Pré-requisitos

- Passo 08 concluído.

## Passo a passo

### 1. Tipos do módulo dashboard

```bash
mkdir -p src/modules/dashboard/types src/modules/dashboard/data src/modules/dashboard/components/ModuleCard
```

`src/modules/dashboard/types/dashboard.types.ts`:

```ts
import type { LucideIcon } from "lucide-react";

export type ModuleStatus = "available" | "external" | "soon";

export type DashboardModule = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  status: ModuleStatus;
};
```

💡 Um *union type* (`"available" | "external" | "soon"`) faz o TypeScript
recusar qualquer outro valor. Um erro de digitação como `"son"` não compila.

### 2. Dados mockados

`src/modules/dashboard/data/modules.mock.ts`:

```ts
import { BookOpen, FolderKanban, Target, Wallet } from "lucide-react";

import type { DashboardModule } from "../types/dashboard.types";

// Dados mockados: serão substituídos por dados do servidor nas próximas fases.
export const dashboardModulesMock: DashboardModule[] = [
  {
    id: "studies",
    title: "Estudos",
    description: "Acesso ao portal de documentação de estudos.",
    href: "/studies",
    icon: BookOpen,
    status: "external",
  },
  {
    id: "finance",
    title: "Financeiro",
    description: "Receitas, despesas e indicadores.",
    href: "/finance",
    icon: Wallet,
    status: "soon",
  },
  {
    id: "pdi",
    title: "PDI",
    description: "Metas, competências e planos de ação.",
    href: "/pdi",
    icon: Target,
    status: "soon",
  },
  {
    id: "projects",
    title: "Projetos",
    description: "Organização de projetos pessoais e técnicos.",
    href: "/projects",
    icon: FolderKanban,
    status: "soon",
  },
];
```

### 3. Card do módulo

`src/modules/dashboard/components/ModuleCard/ModuleCard.tsx`:

```tsx
import Link from "next/link";

import { cn } from "@/lib/utils/cn";

import type { DashboardModule, ModuleStatus } from "../../types/dashboard.types";
import styles from "./ModuleCard.module.scss";

const statusLabel: Record<ModuleStatus, string> = {
  available: "Disponível",
  external: "Aplicação externa",
  soon: "Em breve",
};

type ModuleCardProps = {
  module: DashboardModule;
};

export function ModuleCard({ module }: ModuleCardProps) {
  const { title, description, href, icon: Icon, status } = module;

  return (
    <Link href={href} className={styles.card}>
      <span className={styles.icon} aria-hidden="true">
        <Icon size={22} strokeWidth={1.75} />
      </span>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      <span className={cn(styles.status, styles[`status_${status}`])}>
        {statusLabel[status]}
      </span>
    </Link>
  );
}
```

| Trecho | Explicação |
|---|---|
| `Record<ModuleStatus, string>` | Garante um texto para **cada** status; se um status novo for criado, o TypeScript exige o texto |
| `` styles[`status_${status}`] `` | Escolhe a classe de cor pelo status |

`src/modules/dashboard/components/ModuleCard/ModuleCard.module.scss`:

```scss
@use "@/styles/abstracts" as *;

.card {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-5;
  background: var(--card-background);
  border: 1px solid var(--border);
  border-radius: $radius-lg;
  transition: border-color 150ms ease, box-shadow 150ms ease;

  &:hover {
    border-color: var(--accent-color);
    box-shadow: 0 4px 16px rgb(75 63 209 / 10%);
  }
}

.icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  color: var(--accent-color);
  background: var(--selection-color);
  border-radius: $radius-md;
}

.title {
  font-size: $font-size-lg;
}

.description {
  flex-grow: 1;
  margin: 0;
  color: var(--text-color-secondary);
}

.status {
  align-self: flex-start;
  padding: 2px $space-2;
  font-size: $font-size-xs;
  font-weight: 600;
  border-radius: 999px;
}

.status_available {
  color: var(--green);
  background: color-mix(in srgb, var(--green) 14%, transparent);
}

.status_external {
  color: var(--accent-color);
  background: var(--selection-color);
}

.status_soon {
  color: var(--text-color-secondary);
  background: var(--background);
}
```

### 4. Página do dashboard

Substitua a página temporária:

`src/app/(private)/dashboard/page.tsx`:

```tsx
import type { Metadata } from "next";

import { ModuleCard } from "@/modules/dashboard/components/ModuleCard/ModuleCard";
import { dashboardModulesMock } from "@/modules/dashboard/data/modules.mock";

import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <>
      <div className={styles.heading}>
        <h1>Dashboard</h1>
        <p>Visão geral e atalhos para os módulos.</p>
      </div>

      <div className={styles.grid}>
        {dashboardModulesMock.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>
    </>
  );
}
```

`src/app/(private)/dashboard/page.module.scss`:

```scss
@use "@/styles/abstracts" as *;

.heading {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  margin-bottom: $space-5;

  p {
    margin: 0;
    color: var(--text-color-secondary);
  }
}

// Mobile-first: 1 coluna → 2 (tablet) → 4 (desktop).
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-4;

  @include up("md") {
    grid-template-columns: repeat(2, 1fr);
  }

  @include up("lg") {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### 5. Estado de carregamento

`src/app/(private)/dashboard/loading.tsx`:

```tsx
// Exibido automaticamente pelo Next.js enquanto a página carrega.
export default function DashboardLoading() {
  return <p role="status">Carregando dashboard…</p>;
}
```

💡 `role="status"` faz o leitor de tela anunciar a mensagem de carregamento.

### 6. Componente de estado vazio

```bash
mkdir -p src/components/shared/EmptyState
```

`src/components/shared/EmptyState/EmptyState.tsx`:

```tsx
import type { ReactNode } from "react";

import styles from "./EmptyState.module.scss";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  /** Use "h1" quando o EmptyState for o conteúdo principal da página. */
  headingLevel?: "h1" | "h2";
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  headingLevel: Heading = "h2",
}: EmptyStateProps) {
  return (
    <section className={styles.emptyState}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <Heading className={styles.title}>{title}</Heading>
      <p className={styles.description}>{description}</p>
      {action}
    </section>
  );
}
```

💡 `headingLevel` existe por acessibilidade: **toda página precisa de um
`<h1>`**. Nas páginas dos módulos, o `EmptyState` é o conteúdo principal e
usa `h1`. Dentro de outra seção, usa o padrão `h2`.

`src/components/shared/EmptyState/EmptyState.module.scss`:

```scss
@use "@/styles/abstracts" as *;

.emptyState {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
  padding: $space-7 $space-4;
  text-align: center;
  background: var(--card-background);
  border: 1px dashed var(--border);
  border-radius: $radius-lg;
}

.icon {
  color: var(--accent-color);
}

.title {
  font-size: $font-size-lg;
}

.description {
  max-width: 48ch;
  margin: 0;
  color: var(--text-color-secondary);
}
```

### 7. Estado de erro

`src/app/(private)/error.tsx`:

```tsx
"use client"; // Error boundaries precisam ser Client Components

import { useEffect } from "react";

import { EmptyState } from "@/components/shared/EmptyState/EmptyState";

export default function PrivateError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    // Futuramente: enviar para um serviço de observabilidade.
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      title="Algo deu errado"
      description="Não foi possível carregar esta página. Tente novamente."
      action={
        <button type="button" onClick={() => retry()}>
          Tentar novamente
        </button>
      }
    />
  );
}
```

| Trecho | Explicação |
|---|---|
| `"use client"` | Obrigatório: *error boundaries* do React rodam no navegador |
| `error: unknown` | No Next.js 16, o valor recebido pode não ser um `Error`; trate-o como desconhecido |
| `retry()` | API do Next.js 16.3+: busca e renderiza o trecho de novo. Tutoriais antigos usam `reset()` |

💡 Por ficar em `(private)/`, este `error.tsx` protege **todas** as páginas
privadas, mas mantém Sidebar e Header na tela.

### 8. Páginas dos módulos

```bash
mkdir -p "src/app/(private)/studies" "src/app/(private)/finance" "src/app/(private)/pdi" "src/app/(private)/projects"
```

`src/app/(private)/finance/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Wallet } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState/EmptyState";

export const metadata: Metadata = {
  title: "Financeiro",
};

export default function FinancePage() {
  return (
    <EmptyState
      icon={<Wallet size={32} aria-hidden="true" />}
      headingLevel="h1"
      title="Financeiro"
      description="Em breve: receitas, despesas e indicadores."
    />
  );
}
```

Crie as outras três seguindo o mesmo modelo:

| Arquivo | Componente | Ícone | `title` | `description` |
|---|---|---|---|---|
| `studies/page.tsx` | `StudiesPage` | `BookOpen` | Estudos | Em breve: acesso protegido ao portal de documentação. |
| `pdi/page.tsx` | `PdiPage` | `Target` | PDI | Em breve: metas, competências e planos de ação. |
| `projects/page.tsx` | `ProjectsPage` | `FolderKanban` | Projetos | Em breve: organização de projetos pessoais e técnicos. |

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/modules/dashboard/types/dashboard.types.ts` | Criado | Contrato dos dados do dashboard |
| `src/modules/dashboard/data/modules.mock.ts` | Criado | Dados mockados |
| `src/modules/dashboard/components/ModuleCard/*` | Criados | Card de módulo |
| `src/app/(private)/dashboard/page.tsx` + `.module.scss` | Alterado / criado | Grade de cards |
| `src/app/(private)/dashboard/loading.tsx` | Criado | Estado de carregamento |
| `src/app/(private)/error.tsx` | Criado | Estado de erro |
| `src/components/shared/EmptyState/*` | Criados | Estado vazio |
| `src/app/(private)/{studies,finance,pdi,projects}/page.tsx` | Criados | Páginas dos módulos |

## ✅ Como testar

Rode `npm run dev`.

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `/dashboard` em tela larga | 4 cards lado a lado, com ícone, título, descrição e status |
| 2 | Largura entre 768px e 1023px | 2 colunas |
| 3 | Largura < 768px | 1 coluna |
| 4 | Clicar em cada card | Abre a página do módulo com o estado vazio, e a Sidebar destaca o item certo |
| 5 | Aba do navegador em `/finance` | Título “Financeiro \| Admin” |
| 6 | **Simular erro:** adicionar `throw new Error("teste");` na primeira linha da função `FinancePage` e abrir `/finance` | Aparece “Algo deu errado”, Sidebar e Header continuam; clicar “Tentar novamente” repete o erro. **Remova o `throw`** depois |
| 7 | `npm run typecheck`, `npm run lint`, `npm run build` | Sem erros; o build lista `/dashboard`, `/finance`, `/pdi`, `/projects` e `/studies` |

> Em modo `dev`, o Next.js também mostra um painel de erro de
> desenvolvimento por cima. Feche-o para ver o `error.tsx`. Em produção
> (`npm run build && npm run start`) só aparece o `error.tsx`.

**Critério de aceite:** testes 1 a 5 e 7 passam e o teste 6 mostra a tela de erro.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Functions cannot be passed directly to Client Components` | Passar o componente de ícone de um Server para um Client Component | Aqui o `ModuleCard` é Server, então funciona. Se ele virar Client, passe o nome do ícone (string), não o componente |
| Cards sem cor de status | Classe `status_<valor>` inexistente no SCSS | Conferir se cada status do tipo tem sua classe |
| `loading.tsx` não aparece | A página é estática e carrega instantaneamente | Esperado; ele aparecerá quando houver busca de dados (Fase 04) |

## Commit sugerido

```bash
git add src
git commit -m "feat(dashboard): adiciona dashboard mockado, páginas dos módulos e estados de loading, vazio e erro"
```

## Referências

- [Next.js — Error handling](https://nextjs.org/docs/app/getting-started/error-handling)
- [Next.js — loading.js](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
- [Next.js — Metadata](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- ARCHITECTURE.md, seções 1.1, 21 (Fase 1) e 22.2

---

← [Passo anterior](08-layout-base.md) · [Índice da fase](README.md) · [Próximo passo](10-jest-primeiros-testes.md) →
