# Passo 08 — Layout base (layout raiz, layout privado, Sidebar e Header)

> **Fase:** 01 — Frontend\
> **Tempo estimado:** 60 a 90 min\
> **Depende de:** [Passo 07](07-radix-ui.md)

## Objetivo

Montar a “moldura” do painel: layout raiz, layout das áreas autenticadas
(`(private)`), Sidebar com navegação ativa, Header com o menu do usuário
(Radix) e o redirecionamento de `/` para `/dashboard`.

## 💡 Por que

### Layouts são a moldura; páginas são o quadro

No App Router, o `layout.tsx` **envolve** todas as páginas da pasta e
**permanece montado** ao navegar entre elas. Ao trocar de `/dashboard` para
`/finance`, só o “quadro” (a página) é trocado; a moldura (Sidebar e Header)
continua. Isso é mais rápido e preserva o estado da moldura.

```text
app/layout.tsx              → <html>, <body>, fonte, estilos globais
└── (private)/layout.tsx    → Sidebar + Header + <main>
    ├── dashboard/page.tsx  → conteúdo do dashboard
    └── finance/page.tsx    → conteúdo do financeiro
```

### Server Components × Client Components

| Tipo | Onde roda | Quando usar | Neste passo |
|---|---|---|---|
| **Server Component** (padrão) | Servidor | Montar HTML, buscar dados | Layouts, `Header`, páginas |
| **Client Component** (`"use client"`) | Navegador | Precisa de hooks, eventos, estado | `Sidebar` (usa `usePathname`), `UserMenu` (menu interativo) |

💡 Regra do projeto (ARCHITECTURE.md, seção 22.2): Server por padrão;
`"use client"` só onde há interação, e o mais “na ponta” possível. Por isso
o `Header` é Server e só o `UserMenu`, dentro dele, é Client.

## Pré-requisitos

- Passo 07 concluído.

## Passo a passo

### 1. Layout raiz — `src/app/layout.tsx`

Substitua o conteúdo:

`src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.scss";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin",
  },
  description: "Portal administrativo pessoal.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

| Trecho | Explicação |
|---|---|
| `title.template` | Cada página define só seu título; o resultado fica “Dashboard \| Admin” |
| `LayoutProps<"/">` | Tipo global gerado pelo Next.js 16 para as props do layout |
| `lang="pt-BR"` | Leitores de tela pronunciam corretamente; o navegador não oferece tradução indevida |

### 2. Redirecionar `/` — `src/app/page.tsx`

Substitua a página temporária:

`src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

// Fase de frontend: sempre envia para o dashboard.
// Na fase de autenticação, este redirecionamento passará a depender da sessão.
export default function HomePage() {
  redirect("/dashboard");
}
```

### 3. Sidebar

```bash
mkdir -p src/components/layout/Sidebar
```

**Itens de navegação** (dados separados do componente, fáceis de alterar):

`src/components/layout/Sidebar/navigation.ts`:

```ts
import {
  BookOpen,
  FolderKanban,
  LayoutDashboard,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Estudos", href: "/studies", icon: BookOpen },
  { label: "Financeiro", href: "/finance", icon: Wallet },
  { label: "PDI", href: "/pdi", icon: Target },
  { label: "Projetos", href: "/projects", icon: FolderKanban },
];
```

**Componente:**

`src/components/layout/Sidebar/Sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";

import { navigationItems } from "./navigation";
import styles from "./Sidebar.module.scss";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark} aria-hidden="true">
          A
        </span>
        <span className={styles.label}>Admin</span>
      </div>

      <nav aria-label="Navegação principal">
        <ul className={styles.list}>
          {navigationItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname.startsWith(href);

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(styles.item, isActive && styles.itemActive)}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                  <span className={styles.label}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
```

| Trecho | Explicação |
|---|---|
| `usePathname()` | Hook que retorna a URL atual; exige `"use client"` |
| `pathname.startsWith(href)` | Mantém o item ativo também em subrotas (ex.: `/projects/123`) |
| `aria-current="page"` | Informa ao leitor de tela qual é a página atual |
| `Link` | Navegação sem recarregar a página inteira |
| `icon: Icon` | Renomeia para maiúscula, porque o JSX exige componentes com inicial maiúscula |

**Estilos** (mobile-first: só ícones no celular, ícones + texto a partir de 1024px):

`src/components/layout/Sidebar/Sidebar.module.scss`:

```scss
@use "@/styles/abstracts" as *;

// Mobile-first: no celular a sidebar mostra só os ícones.
.sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: $space-5;
  width: $sidebar-width-collapsed;
  height: 100vh;
  padding: $space-4 $space-3;
  background: var(--card-background);
  border-right: 1px solid var(--border);

  @include up("lg") {
    width: $sidebar-width;
    padding: $space-5 $space-4;
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: $space-3;
  font-weight: 600;
}

.brandMark {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  color: var(--background);
  background: var(--accent-color);
  border-radius: $radius-md;
}

.list {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  margin: 0;
  padding: 0;
  list-style: none;
}

.item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  padding: $space-3;
  color: var(--text-color-secondary);
  border-radius: $radius-sm;
  transition: background-color 150ms ease, color 150ms ease;

  &:hover {
    color: var(--text-color);
    background: var(--background);
  }

  @include up("lg") {
    justify-content: flex-start;
    padding: $space-3 $space-4;
  }
}

.itemActive {
  color: var(--accent-color);
  background: var(--selection-color);

  &:hover {
    color: var(--accent-color);
    background: var(--selection-color);
  }
}

// No celular o texto some visualmente, mas continua acessível
// para leitores de tela (o link mantém seu nome).
.label {
  @include visually-hidden;

  @include up("lg") {
    @include visually-shown;
  }
}
```

💡 No celular o texto fica `visually-hidden`: some da tela, mas o link
continua com nome acessível (“Financeiro”). Usar `display: none` apagaria o
nome também para o leitor de tela.

### 4. Header e menu do usuário

```bash
mkdir -p src/components/layout/Header
```

`src/components/layout/Header/UserMenu.tsx`:

```tsx
"use client";

import { ChevronDown, LogOut, UserRound } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu/DropdownMenu";

import styles from "./Header.module.scss";

type UserMenuProps = {
  userName: string;
};

export function UserMenu({ userName }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={styles.userButton}>
        <UserRound size={18} aria-hidden="true" />
        <span className={styles.userName}>{userName}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuLabel>Conta</DropdownMenuLabel>
        <DropdownMenuItem disabled>
          <UserRound size={16} aria-hidden="true" />
          Perfil (em breve)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* O logout real será implementado na fase de autenticação. */}
        <DropdownMenuItem disabled>
          <LogOut size={16} aria-hidden="true" />
          Sair (em breve)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

`src/components/layout/Header/Header.tsx`:

```tsx
import { UserMenu } from "./UserMenu";
import styles from "./Header.module.scss";

type HeaderProps = {
  userName: string;
};

export function Header({ userName }: HeaderProps) {
  return (
    <header className={styles.header}>
      <p className={styles.greeting}>Painel administrativo</p>
      <UserMenu userName={userName} />
    </header>
  );
}
```

`src/components/layout/Header/Header.module.scss`:

```scss
@use "@/styles/abstracts" as *;

.header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: $header-height;
  padding: 0 $space-4;
  background: var(--card-background);
  border-bottom: 1px solid var(--border);

  @include up("lg") {
    padding: 0 $space-6;
  }
}

.greeting {
  margin: 0;
  overflow: hidden;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.userButton {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: $space-2;
  padding: $space-2 $space-3;
  color: var(--text-color);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: $radius-sm;
  cursor: pointer;

  &:hover {
    background: var(--background);
  }

  &:focus-visible {
    @include focus-ring;
  }
}

// No celular mostra só o ícone; o nome continua acessível.
.userName {
  @include visually-hidden;

  @include up("md") {
    @include visually-shown;
  }
}
```

💡 `disabled` nos itens “em breve”: o Radix os pula na navegação por
teclado e aplica `data-disabled`, estilizado no wrapper.

### 5. Layout privado — `src/app/(private)/layout.tsx`

```bash
mkdir -p "src/app/(private)/dashboard"
```

⚠️ Use aspas no caminho: no terminal, parênteses têm significado especial.

`src/app/(private)/layout.tsx`:

```tsx
import { Header } from "@/components/layout/Header/Header";
import { Sidebar } from "@/components/layout/Sidebar/Sidebar";

import styles from "./layout.module.scss";

// Layout das áreas autenticadas.
// A verificação de sessão será adicionada aqui na fase de autenticação.
export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.content}>
        <Header userName="Administradora" />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
```

`src/app/(private)/layout.module.scss`:

```scss
@use "@/styles/abstracts" as *;

.shell {
  display: flex;
  min-height: 100vh;
}

.content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0; // evita que conteúdo largo estoure o layout flex
}

.main {
  flex: 1;
  padding: $space-5 $space-4;

  @include up("lg") {
    padding: $space-6;
  }
}
```

💡 `min-width: 0` em um filho de `flex` impede que tabelas ou textos longos
“empurrem” o layout para além da tela. É uma pegadinha clássica de CSS.

### 6. Página do dashboard (temporária)

Crie `src/app/(private)/dashboard/page.tsx`:

```tsx
export default function DashboardPage() {
  return <h1>Dashboard</h1>;
}
```

Ela ganha os cards no passo 09.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/app/layout.tsx` | Alterado | Metadados, idioma e estilos globais |
| `src/app/page.tsx` | Alterado | Redireciona para `/dashboard` |
| `src/components/layout/Sidebar/*` | Criados | Navegação principal |
| `src/components/layout/Header/*` | Criados | Barra superior e menu do usuário |
| `src/app/(private)/layout.tsx` + `.module.scss` | Criados | Moldura das áreas autenticadas |
| `src/app/(private)/dashboard/page.tsx` | Criado | Página temporária |

## ✅ Como testar

Rode `npm run dev` e abra `http://localhost:3000`.

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Acessar `/` | Redireciona para `/dashboard` |
| 2 | Visual em tela larga (≥ 1024px) | Sidebar com ícones e textos; item “Dashboard” destacado em roxo |
| 3 | Estreitar a janela (< 1024px) ou usar o modo dispositivo do DevTools (`Ctrl+Shift+M`) | Sidebar estreita só com ícones |
| 4 | Largura de celular (< 768px) | O nome “Administradora” some; fica só o ícone no botão |
| 5 | Clicar em “Administradora” | O menu abre com “Conta”, “Perfil (em breve)” e “Sair (em breve)” |
| 6 | **Teclado:** `Tab` até o botão → `Enter` → setas → `Esc` | O menu abre, as setas pulam os itens desativados, `Esc` fecha e o foco volta ao botão |
| 7 | `Tab` pela Sidebar | Contorno de foco roxo visível em cada link |
| 8 | Clicar em “Financeiro” | **Página 404**: esperado, as páginas dos módulos são criadas no passo 09 |
| 9 | `npm run typecheck`, `npm run lint`, `npm run build` | Sem erros |

**Critério de aceite:** testes 1 a 7 e 9 passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `usePathname only works in Client Components` | Falta `"use client"` na Sidebar | Primeira linha: `"use client";` |
| `zsh: no matches found: src/app/(private)/...` | Parênteses sem aspas no terminal | Usar `mkdir -p "src/app/(private)/dashboard"` |
| Sidebar sem estilo | `@use` ausente ou caminho errado | Conferir a primeira linha do `.module.scss` |
| Item ativo não destaca | `href` diferente da URL | `href` em `navigation.ts` deve começar com `/` e bater com a rota |
| `/` não redireciona | `page.tsx` antigo ainda existe | Conferir o conteúdo de `src/app/page.tsx` (item 2) |

## Commit sugerido

```bash
git add src/app src/components/layout
git commit -m "feat(layout): adiciona layout privado com sidebar, header e menu do usuário"
```

## Referências

- [Next.js — Layouts and Pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages)
- [Next.js — Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js — Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating)
- [MDN — aria-current](https://developer.mozilla.org/pt-BR/docs/Web/Accessibility/ARIA/Attributes/aria-current)
- ARCHITECTURE.md, seções 5 e 22.2

---

← [Passo anterior](07-radix-ui.md) · [Índice da fase](README.md) · [Próximo passo](09-dashboard-mockado.md) →
