# Passo 11 — Registrar o módulo

> **Fase:** 07 — Novos Módulos\
> **Tempo estimado:** 20 min\
> **Depende de:** [Passo 10](10-telas.md)

## Objetivo

Garantir que o módulo esteja nos **3 lugares de registro**: menu lateral,
dashboard e proxy. Aproveitamos para corrigir **Projetos**, que existia e
estava protegido, mas não aparecia no menu nem no dashboard.

## 💡 Por que um checklist de registro

💡 Inaugurar uma loja num shopping exige três coisas além da loja pronta:
o nome no **mapa do shopping** (sidebar), a vitrine na **entrada**
(dashboard) e o **segurança** na porta (proxy). Uma loja sem placa existe,
mas ninguém chega nela. Foi exatamente o que aconteceu com Projetos.

| Lugar | Financeiro | Projetos |
|---|---|---|
| Sidebar (`navigation.ts`) | Já estava | **Faltava**: corrigido aqui |
| Dashboard (`modules.mock.ts`) | Estava como "Em breve" | **Faltava**: corrigido aqui |
| Proxy (`matcher`) | Já estava (`/finance/:path*`) | Já estava (`/projects/:path*`) |

## Pré-requisitos

- Passo 10 concluído.

## Passo a passo

### 1. Menu lateral

`src/components/layout/Sidebar/navigation.ts` (acrescente Projetos depois do
Dashboard):

`src/components/layout/Sidebar/navigation.ts`:

```ts
import {
    BadgeDollarSign,
    FolderKanban,
    LayoutDashboard,
    NotebookPen,
    type LucideIcon
} from "lucide-react";

export type NavigationItem = {
    label: string;
    href: string;
    icon: LucideIcon;
};

export const navigationItems: NavigationItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Projetos", href: "/projects", icon: FolderKanban },
    { label: "Estudos", href: "/studies", icon: NotebookPen },
    { label: "Financeiro", href: "/finance", icon: BadgeDollarSign },
];
```

### 2. Cards do dashboard

`src/modules/dashboard/data/modules.mock.ts`: acrescente o card de Projetos
e mude o Financeiro de `"soon"` para `"available"`:

`src/modules/dashboard/data/modules.mock.ts`:

```ts
import { BookOpen, FolderKanban, Wallet } from "lucide-react";

import type { DashboardModule } from "../types/dashboard.types";

// Dados mockados: serão substituídos por dados do servidor nas próximas fases.
export const dashboardModulesMock: DashboardModule[] = [
    {
        id: "projects",
        title: "Projetos",
        description: "Projetos pessoais, status e repositórios.",
        href: "/projects",
        icon: FolderKanban,
        status: "available",
    },
    {
        id: "documentation",
        title: "Documentação",
        description: "Acesso ao portal de documentação.",
        href: "/documentation",
        icon: BookOpen,
        status: "external",
    },
    {
        id: "finance",
        title: "Financeiro",
        description: "Receitas, despesas e saldo do mês.",
        href: "/finance",
        icon: Wallet,
        status: "available",
    },
];
```

### 3. Conferir o proxy

Nada a alterar: os dois módulos já estão no `matcher` de `src/proxy.ts`.

```ts
    matcher: [
        "/dashboard/:path*",
        "/studies/:path*",
        "/finance/:path*",
        "/documentation/:path*",
        "/projects/:path*",
    ],
```

💡 `/finance/:path*` cobre `/finance`, `/finance/transactions/new` e
`/finance/transactions/abc/edit`: o `:path*` significa "zero ou mais
segmentos depois".

### 4. Atualizar os testes que contam itens do menu e do dashboard

`tests/unit/components/layout/Sidebar.test.tsx`:

```ts
        for (const label of ["Dashboard", "Projetos", "Estudos", "Financeiro"]) {
```

`tests/e2e/navigation.spec.ts`: a lista de módulos e a contagem de cards:

```ts
const modules = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Projetos", path: "/projects" },
    { label: "Estudos", path: "/studies" },
    { label: "Financeiro", path: "/finance" },
];
```

```ts
    // Três cards no dashboard: Projetos, Documentação e Financeiro (modules.mock.ts).
    await expect(page.locator("main a[href^='/']")).toHaveCount(3);
```

💡 Esses testes **deveriam** quebrar quando o menu muda: eles são a prova de
que o menu tem exatamente o que você planejou. Atualizá-los junto com o menu
faz parte do registro.

## 📋 Checklist de registro (copie para cada módulo novo)

- [ ] `navigation.ts`: item com `label`, `href` e ícone do `lucide-react`
- [ ] `modules.mock.ts`: card com `status: "available"` (ou `"soon"` enquanto não estiver pronto)
- [ ] `src/proxy.ts`: `"/<modulo>/:path*"` no `matcher`
- [ ] `Sidebar.test.tsx` e `navigation.spec.ts`: lista e contagem atualizadas
- [ ] `accessibility.spec.ts`: rotas novas na lista `privatePages` (passo 12)

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/components/layout/Sidebar/navigation.ts` | Alterado | + Projetos |
| `src/modules/dashboard/data/modules.mock.ts` | Alterado | + card Projetos; Financeiro disponível |
| `tests/unit/components/layout/Sidebar.test.tsx` | Alterado | 4 links |
| `tests/e2e/navigation.spec.ts` | Alterado | 4 módulos, 3 cards |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm test` | `Tests: 79 passed` |
| 2 | Abrir `/dashboard` | 3 cards: Projetos e Financeiro "Disponível", Documentação "Aplicação externa" |
| 3 | Sidebar | Dashboard, Projetos, Estudos, Financeiro; o item da página atual destacado |
| 4 | Janela anônima → `/finance/transactions/new` | Redireciona para `/login` |

**Critério de aceite:** os 4 testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `navigation.spec` falha com 3 links | Teste não atualizado | Passo 4 deste guia |
| Item ativo errado em `/finance/transactions/new` | — | Não acontece: a sidebar marca por **prefixo** (`startsWith`) |

## Commit sugerido

```bash
git add src/components/layout/Sidebar/navigation.ts src/modules/dashboard tests/unit/components tests/e2e/navigation.spec.ts
git commit -m "feat(nav): registra Financeiro e Projetos na navegação e no dashboard"
```

## Referências

- [Next.js — Proxy `matcher`](https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher)
- [Lucide — ícones](https://lucide.dev/icons/)

---

← [Passo anterior](10-telas.md) · [Índice da fase](README.md) · [Próximo passo](12-testes-e2e.md) →
