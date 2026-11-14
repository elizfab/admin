# Painel Admin --- Guia de Arquitetura e Setup Inicial

> **Documento-base para iniciar o desenvolvimento do frontend e preparar
> a integração com backend, autenticação, banco de dados, testes e
> deploy.**
>
> **Status:** proposta técnica inicial\
> **Data:** 11/11/2026\
> **Projeto:** Admin\
> **Arquitetura:** Monólito modular com possibilidade de aplicações
> independentes\
> **Stack principal:** Next.js + TypeScript + SCSS Modules + Better Auth +
> PostgreSQL + Prisma + Zod + Jest + Playwright + Vercel\
> **Revisão:** 1.3 — 11/11/2026

---

## Histórico de revisões

| Versão | Data       | Alterações                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0    | 11/11/2026 | Proposta técnica inicial.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.1    | 11/11/2026 | Tabelas reconstruídas em Markdown; seção 4.2 atualizada para o instalador do Next.js 16 (incluindo a restrição do nome `_admin`); requisito único de Node.js (≥ 20.19, por causa do Prisma 7); mixin de breakpoints convertido para mobile-first; exemplo da Sidebar com `next/link` e tokens; instalação do Radix pelo pacote unificado `radix-ui`; alerta sobre a situação do Auth.js e sobre `proxy.ts` no Next.js 16; comandos explícitos de `prisma generate` e `prisma db seed` (Prisma 7); `testPathIgnorePatterns` no Jest; estrutura de `docs/setup/` alinhada ao mapa de implementação; correção de digitação na Parte X. |
| 1.2    | 11/11/2026 | **ADR-006 aceita: Better Auth substitui Auth.js** (seção 11 reescrita como resumo; detalhes em `docs/decisions/` e na Fase 03); Prisma fixado em `@7` (a tag `latest` do npm aponta para o 8.0 RC); arquivo de configuração `prisma7.config.ts` (nome do Prisma 7.10+); PostgreSQL local com Docker como banco de desenvolvimento; Data API do Supabase desativada (seção 12.6); seed da administradora movido para a Fase 03; script `typecheck` com `next typegen`.                                                                                                                                                               |
| 1.3    | 11/11/2026 | Fase 4 implementada (módulo Projetos): sintaxe do **Zod 4** (seção 15); formato padrão de respostas `{ data }` / `{ error }` (seção 10.3); API pública do módulo dividida em `index.ts` (seguro para o cliente) e `server.ts` (`server-only`) (seção 9.4); um arquivo de serviço por módulo enquanto for pequeno; `404` para recurso de outra usuária.                                                                                                                                                                                                                                                                              |

> **Como usar este documento:** este é o documento de **arquitetura** (o “porquê” e o “o quê”).
> O passo a passo de execução (o “como”) fica em `docs/setup/`, seguindo a ordem do
> mapa em `docs/README.md`. Quando os dois divergirem, o guia de setup reflete
> comandos validados mais recentemente e este documento deve ser atualizado.

---

## 1. Objetivo do projeto

Construir um portal administrativo pessoal, privado e extensível, que
funcione como ponto central de entrada para diferentes áreas:

- **Dashboard:** visão geral e atalhos para os módulos.
- **Estudos:** acesso ao portal de documentação Docusaurus.
- **Financeiro:** controle de receitas, despesas e indicadores.
- **PDI:** metas, competências, planos de ação e evolução
  profissional.
- **Projetos:** organização de projetos pessoais e técnicos.
- **Novos módulos:** inclusão futura de outras aplicações sem
  reconstruir autenticação, layout ou infraestrutura comum.

O sistema será desenvolvido inicialmente como um **monólito modular**.
Isso significa que haverá uma aplicação principal e um backend
integrado, mas cada domínio terá responsabilidades, regras, componentes,
serviços e testes organizados separadamente.

A arquitetura será **híbrida**: os módulos que compartilham navegação e
experiência poderão ficar dentro da aplicação Next.js; aplicações que
tenham ciclo de vida, tecnologia ou necessidade de deploy próprios
poderão permanecer independentes e ser acessadas pelo portal central.

### 1.1 Princípios obrigatórios

1. Segurança deve ser aplicada no servidor, não apenas escondendo
   elementos no frontend.
2. Cada módulo deve ter limites claros e não acessar diretamente a
   implementação interna de outro módulo.
3. Componentes visuais compartilhados ficam em `components/`; regras de
   negócio ficam em `modules/`.
4. O banco deve ser modelado por domínio, com relacionamentos
   explícitos.
5. Toda entrada externa deve ser validada com Zod.
6. Toda operação de leitura ou escrita deve verificar autenticação e
   autorização.
7. Segredos e credenciais nunca podem ser enviados ao navegador ou
   versionados no Git.
8. Testes devem acompanhar a implementação desde o início.
9. O projeto deve funcionar localmente sem depender do deploy.
10. Serviços pagos ou recursos com limites devem ser identificados antes
    de serem adotados.

---

## 2. Decisões tecnológicas

| Camada                 | Tecnologia                      | Responsabilidade                                                     |
| ---------------------- | ------------------------------- | -------------------------------------------------------------------- |
| Framework              | Next.js App Router              | Aplicação web, renderização e backend integrado                      |
| Linguagem              | TypeScript                      | Tipagem estática e contratos                                         |
| UI                     | React                           | Componentização da interface                                         |
| Estilos                | Sass / SCSS Modules             | Estilos isolados por componente                                      |
| Componentes acessíveis | Radix UI Primitives             | Comportamentos acessíveis sem impor identidade visual                |
| Ícones                 | Lucide React                    | Ícones SVG                                                           |
| Autenticação           | Better Auth (ADR-006)           | Login, sessão no banco, rate limiting e integração com o Next.js     |
| Backend                | Route Handlers + Server Actions | APIs HTTP e mutações acionadas pela interface                        |
| Validação              | Zod                             | Validação de formulários, parâmetros e payloads                      |
| Banco                  | PostgreSQL                      | Persistência relacional                                              |
| Banco gerenciado       | Supabase Free                   | PostgreSQL hospedado para desenvolvimento inicial                    |
| ORM                    | Prisma ORM                      | Modelagem, consultas, migrations e tipos                             |
| Testes unitários       | Jest                            | Funções, regras e componentes compatíveis                            |
| Testes de componentes  | React Testing Library           | Comportamento da interface                                           |
| Testes E2E             | Playwright                      | Fluxos reais no navegador                                            |
| Hospedagem             | Vercel Hobby                    | Deploy da aplicação pessoal                                          |
| Repositório            | GitHub privado                  | Versionamento e histórico                                            |
| Execução local         | Node.js + npm                   | Desenvolvimento                                                      |
| Banco local            | Docker Compose                  | PostgreSQL local para desenvolvimento e testes (padrão do dia a dia) |

### 2.1 Decisões fechadas e decisões que exigem validação

**Decisões adotadas para a primeira versão:**

- Next.js com App Router.
- TypeScript em modo strict.
- SCSS Modules; não utilizar Tailwind CSS.
- Radix UI Primitives, adotando apenas os componentes necessários.
- Lucide React.
- Better Auth com uma conta administradora inicial, login por e-mail e
  senha e sessões persistidas no banco (ADR-006; substitui a proposta
  original com Auth.js Credentials + JWT).
- PostgreSQL.
- Prisma ORM.
- Zod.
- Jest + React Testing Library.
- Playwright para E2E.
- Vercel Hobby para o projeto pessoal, respeitando os termos e limites
  do plano.

**Pontos que devem ser confirmados durante a implementação:**

- Nome definitivo do repositório e domínio.
- Versões exatas das dependências no momento da criação.
- ~~Provedor e método definitivo de login.~~ Decidido: Better Auth, e-mail e senha (ADR-006).
- Se o banco de produção será Supabase Free ou outro PostgreSQL
  gerenciado.
- Política de backup e recuperação.
- Se haverá mais de uma conta de usuário.
- Quais módulos terão dados próprios e quais serão apenas links para
  aplicações independentes.

> Não instalar versões antigas copiadas de tutoriais. Utilizar versões
> estáveis disponíveis no momento, registrar o lockfile e validar a
> compatibilidade entre Next.js, React, Auth.js e Prisma.

---

# PARTE I --- REPOSITÓRIOS, CONTAS E INFRAESTRUTURA

## 3. Mapa de organização do projeto

### 3.1 Contas e links

Preencher os links quando as contas e os recursos forem criados.

| Recurso                    | Link / identificação                                     | Status                                           |
| -------------------------- | -------------------------------------------------------- | ------------------------------------------------ |
| GitHub — conta             | <https://github.com/elizabetefabri>                      | Existente                                        |
| GitHub — organização       | `elizfab`                                                | Existente                                        |
| GitHub — repositório Admin | A definir (organização `elizfab`)                        | Pendente — será criado por último                |
| Pasta local do projeto     | `~/repos/projetos-pessoais/portfolio/org-elizfab/_admin` | Existente                                        |
| Vercel                     | <https://vercel.com/dashboard>                           | Pendente de vinculação                           |
| Projeto Vercel             | A definir                                                | Pendente                                         |
| Supabase                   | <https://supabase.com/dashboard>                         | Pendente                                         |
| Projeto Supabase           | A definir                                                | Pendente                                         |
| Domínio personalizado      | A definir                                                | Opcional                                         |
| Portal Docusaurus          | <https://elizfab.github.io/portal-dev/>                  | Existente; atualmente público                    |
| Cloudflare                 | <https://dash.cloudflare.com/>                           | Opcional, para proteger aplicações independentes |

### 3.2 O que ainda falta criar

- [ ] Repositório privado no GitHub.
- [ ] Aplicação Next.js local.
- [ ] Projeto no Supabase.
- [ ] Banco PostgreSQL e credenciais de conexão.
- [ ] Projeto Vercel conectado ao repositório.
- [ ] Variáveis de ambiente em desenvolvimento, preview e produção.
- [ ] Estratégia de proteção do Docusaurus.
- [ ] Política de backup do banco.
- [ ] Domínio personalizado, se desejado.
- [ ] Documento de arquitetura e diagrama ER no Draw.io.

### 3.3 Repositório e estratégia Git

Nome sugerido: `painel-admin-admin`.

Branches sugeridas:

- `main`: código estável e produção.
- `develop`: integração das funcionalidades, se o fluxo de trabalho
  justificar.
- `feature/nome-da-funcionalidade`: desenvolvimento de uma
  funcionalidade.
- `fix/nome-do-ajuste`: correções.
- `docs/nome-do-documento`: documentação.

Para um projeto individual pequeno, não é obrigatório manter `develop`.
Pode-se trabalhar com `main` protegida e branches curtas de feature. A
estratégia deve permanecer simples.

Arquivos que não devem ser versionados:

- `.env`, `.env.local` e arquivos com segredos.
- Senhas e tokens.
- Dumps de produção.
- Arquivos de backup contendo dados pessoais.
- Chaves privadas e certificados.

O `.gitignore` criado pelo Next.js deve ser mantido e revisado.

---

# PARTE II --- FRONTEND

## 4. Ambiente de desenvolvimento

### 4.1 Pré-requisitos

- Node.js em versão LTS compatível com a versão atual do Next.js.
- npm, instalado junto com o Node.js.
- Git.
- VS Code ou editor equivalente.
- Extensões recomendadas:
  - ESLint.
  - Prettier (se adotado como formatador do projeto).
  - Prisma.
  - GitLens (opcional).
  - EditorConfig (opcional).

Verificar instalações:

```bash
node --version
npm --version
git --version
```

> O Next.js 16 exige Node.js 20.9 ou superior, mas o Prisma ORM 7 (fase de
> banco) exige **Node.js 20.19 ou superior** e TypeScript 5.4 ou superior.
> Para não precisar trocar de versão no meio do projeto, adotar desde o
> início uma versão **LTS ≥ 20.19** (a validação deste guia usou Node.js 22).

### 4.2 Criar a aplicação Next.js

Executar no diretório em que o projeto deverá ser criado (ver o
procedimento completo, com a pasta `_admin`, no guia de setup do frontend):

```bash
npx create-next-app@latest painel-admin-admin
```

Nas perguntas do instalador, selecionar:

| Pergunta do instalador                                  | Escolha                                               |
| ------------------------------------------------------- | ----------------------------------------------------- |
| Would you like to use the recommended Next.js defaults? | **No, customize settings** (o padrão inclui Tailwind) |
| TypeScript?                                             | Yes                                                   |
| Which linter?                                           | ESLint                                                |
| React Compiler?                                         | No inicialmente; avaliar depois                       |
| Tailwind CSS?                                           | No                                                    |
| Código dentro de `src/`?                                | Yes                                                   |
| App Router?                                             | Yes                                                   |
| Cache Components?                                       | No inicialmente; avaliar depois                       |
| Customize the import alias?                             | No (mantém `@/*`)                                     |
| Include AGENTS.md?                                      | Yes                                                   |

> **Atenção (validado em 11/11/2026):** o `create-next-app` não aceita criar o
> projeto diretamente na pasta `_admin`, porque nomes de pacote npm não podem
> começar com `_`. O procedimento correto está em
> `docs/setup/01-setup-frontend/01-criar-app-nextjs.md`.

Alternativa com opções explícitas, se suportadas pela versão atual do
CLI:

```bash
npx create-next-app@latest painel-admin-admin --ts --eslint --no-tailwind --src-dir --app --no-react-compiler --no-cache-components --agents-md --import-alias "@/*" --use-npm
```

Iniciar o servidor de desenvolvimento a partir da pasta do projeto:

```bash
npm run dev
```

Abrir:

```text
http://localhost:3000
```

### 4.3 Comandos de rotina

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Executar build local
npm run start

# Verificar tipos
npx tsc --noEmit

# Executar lint
npm run lint
```

> No Next.js 16, `next build` **não executa mais o linter**. Rodar `npm run lint`
> separadamente (localmente e, futuramente, no CI).

Os scripts disponíveis podem variar conforme a versão do Next.js e o
linter escolhido. Conferir sempre o `package.json`.

### 4.4 Estrutura inicial do frontend

```text
src/
├── app/
│   ├── (public)/
│   │   ├── layout.tsx
│   │   └── login/
│   │       └── page.tsx
│   │
│   ├── (private)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── studies/
│   │   │   └── page.tsx
│   │   ├── finance/
│   │   │   └── page.tsx
│   │   ├── pdi/
│   │   │   └── page.tsx
│   │   └── projects/
│   │       └── page.tsx
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   └── v1/
│   │       └── health/
│   │           └── route.ts
│   │
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.scss
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
│
├── modules/
│   ├── auth/
│   ├── studies/
│   ├── finance/
│   ├── pdi/
│   └── projects/
│
├── lib/
│   ├── auth/
│   ├── db/
│   ├── validations/
│   ├── security/
│   └── utils/
│
└── styles/
    ├── abstracts/
    ├── base/
    ├── themes/
    └── utilities/
```

A estrutura poderá evoluir. Não criar diretórios vazios sem necessidade;
cada pasta deve representar uma responsabilidade real.

---

## 5. Organização de rotas do frontend

O App Router utiliza a estrutura de diretórios dentro de `src/app`. Os
nomes entre parênteses são **Route Groups**: organizam layouts e
páginas, mas não aparecem na URL.

### 5.1 Rotas planejadas

| Arquivo                           | URL              | Acesso                             |
| --------------------------------- | ---------------- | ---------------------------------- |
| `app/page.tsx`                    | `/`              | Redireciona conforme sessão        |
| `(public)/login/page.tsx`         | `/login`         | Público                            |
| `(private)/dashboard/page.tsx`    | `/dashboard`     | Autenticado                        |
| `(private)/studies/page.tsx`      | `/studies`       | Autenticado                        |
| `(private)/finance/page.tsx`      | `/finance`       | Autenticado                        |
| `(private)/pdi/page.tsx`          | `/pdi`           | Autenticado                        |
| `(private)/projects/page.tsx`     | `/projects`      | Autenticado                        |
| `api/auth/[...nextauth]/route.ts` | `/api/auth/*`    | Auth.js                            |
| `api/v1/health/route.ts`          | `/api/v1/health` | Endpoint de diagnóstico controlado |

### 5.2 Layouts

- `app/layout.tsx`: layout raiz, fontes, metadados e estilos globais.
- `(public)/layout.tsx`: layout de páginas públicas, como login.
- `(private)/layout.tsx`: layout autenticado, com sidebar, header e
  verificação de sessão.

O layout privado pode verificar a sessão no servidor e redirecionar para
`/login` quando não houver usuário autenticado. Isso melhora a
navegação, mas não substitui a autorização nas operações de dados.

---

## 6. SCSS Modules

**Objetivo:** manter os estilos isolados por componente, evitar colisões
de nomes e criar uma linguagem visual consistente.

O Next.js oferece suporte ao Sass após a instalação do pacote `sass`. Os
arquivos com extensão `.module.scss` são tratados como CSS Modules.

### 6.1 Instalação

```bash
npm install -D sass
```

Não é necessário iniciar um servidor Sass separado. O Next.js compila os
arquivos durante o desenvolvimento e o build.

### 6.2 Convenção de nomes

- Estilo global: `globals.scss`.
- Variáveis e mixins: arquivos `.scss` sem `module`.
- Estilo de componente: `ComponentName.module.scss`.
- Um componente deve importar seu próprio módulo de estilos.
- Evitar estilos globais para componentes específicos.

Exemplo:

```text
src/
├── app/
│   └── globals.scss
│
├── styles/
│   ├── abstracts/
│   │   ├── _variables.scss
│   │   ├── _mixins.scss
│   │   ├── _functions.scss
│   │   └── _breakpoints.scss
│   │
│   ├── base/
│   │   ├── _reset.scss
│   │   ├── _typography.scss
│   │   └── _accessibility.scss
│   │
│   ├── themes/
│   │   ├── _light.scss
│   │   └── _dark.scss
│   │
│   └── utilities/
│       ├── _spacing.scss
│       └── _helpers.scss
│
└── components/
    └── layout/
        └── Sidebar/
            ├── Sidebar.tsx
            └── Sidebar.module.scss
```

### 6.3 Exemplo de variáveis

`src/styles/abstracts/_variables.scss` guarda tokens **estáticos**
(espaçamentos, bordas, tipografia, layout, breakpoints):

```scss
$radius-sm: 6px;
$radius-md: 10px;
$radius-lg: 16px;

$sidebar-width: 260px;
$header-height: 64px;

$breakpoints: (
  "md": 768px,
  "lg": 1024px,
);
```

As **cores** ficam em CSS custom properties nos arquivos de tema
(`src/styles/themes/_light.scss` e `_dark.scss`), porque mudam com o tema
(claro/escuro) em tempo de execução, algo que variáveis Sass, resolvidas na
compilação, não conseguem fazer. A paleta oficial é a **Dracula**:

```scss
// _light.scss (:root — tema padrão)
:root {
  color-scheme: light;

  --background: #fffbeb;
  --card-background: #efeddc;
  --table-background: #efeddc;
  --light-grey: #cfcfde;
  --very-light-grey: #efeddc;
  --overlay-surface-background: #efeddc;
  --input-color: #fffbeb;

  --selection-color: #cfcfde;
  --medium-grey: #cfcfde;
  --border: #cfcfde;

  --text-color: #1f1f1f;
  --text-color-secondary: #6c664b;
  --indigo: #6c664b;

  --accent-color: #644ac9;
  --blue: #644ac9;
  --purple: #644ac9;
  --cyan: #036a96;
  --teal: #036a96;
  --green: #14710a;
  --orange: #a34d14;
  --brown: #a34d14;
  --pink: #a3144d;
  --red: #cb3a2a;
  --yellow: #846e15;

  --accent-color-hover: color-mix(in srgb, var(--accent-color) 88%, black);
  --accent-on-selection: #553fab;

  --brand-surface: radial-gradient(120% 90% at 15% 0%, color-mix(in srgb, var(--background) 35%, transparent), transparent 60%), linear-gradient(155deg, #ddd0f7 0%, #c6e2f6 55%, #d2efda 125%);
}

// _dark.scss — mesmos tokens, ativados por [data-theme="dark"]
[data-theme="dark"] {
  color-scheme: dark;

  --background: #282a36;
  --card-background: #353747;
  --table-background: #353747;
  --light-grey: #44475a;
  --very-light-grey: #343746;
  --overlay-surface-background: #343746;
  --input-color: #21222c;

  --selection-color: #44475a;
  --medium-grey: #44475a;
  --border: #44475a;

  --text-color: #f8f8f2;
  --text-color-secondary: #a3aed0;
  --indigo: #6272a4;

  --accent-color: #bd93f9;
  --blue: #93bff9;
  --purple: #bd93f9;
  --cyan: #8be9fd;
  --teal: #8be9fd;
  --green: #50fa7b;
  --orange: #e6681a;
  --brown: #ffb86c;
  --pink: #ff79c6;
  --red: #ff5555;
  --yellow: #f1fa8c;

  --accent-color-hover: color-mix(in srgb, var(--accent-color) 88%, white);
  --accent-on-selection: #d9b8ff;

  --brand-surface: #21222c;
}
```

> **Regra obrigatória:** nenhum componente pode usar cor fixa (hex, `rgb()`,
> nome). Toda cor vem dos tokens acima, que existem nos dois temas. Cor nova
> = token novo nos dois arquivos de tema. O tema é alternado pelo
> `ThemeToggle` no Header (`data-theme` no `<html>`, persistido em
> `localStorage["theme"]`, com fallback para `prefers-color-scheme`).

### 6.4 Exemplo de mixin

`src/styles/abstracts/_mixins.scss`:

O mixin segue **mobile-first** (regra da seção 6.7): o estilo base vale
para o celular e cada breakpoint _adiciona_ ajustes para telas maiores.

```scss
@use "sass:map";
@use "variables" as vars;

@mixin up($breakpoint) {
  $value: map.get(vars.$breakpoints, $breakpoint);

  @if not $value {
    @error "Breakpoint `#{$breakpoint}` não existe em $breakpoints.";
  }

  @media (min-width: $value) {
    @content;
  }
}
```

### 6.5 Exemplo de componente isolado

`Sidebar.module.scss`:

```scss
@use "@/styles/abstracts" as *;

.sidebar {
  width: $sidebar-width-collapsed;
  min-height: 100vh;
  background: var(--card-background);
  border-right: 1px solid var(--border);

  @include up("lg") {
    width: $sidebar-width;
  }
}

.item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-radius: $radius-sm;
}

.itemActive {
  color: var(--accent-color);
  background: var(--selection-color);
}
```

> Com CSS Modules, o nome da classe já é isolado por arquivo; por isso o
> prefixo BEM (`sidebar__item`) é dispensável. Usar camelCase facilita o
> acesso em TypeScript (`styles.itemActive`).

`Sidebar.tsx` (versão resumida; a completa está no guia de setup):

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";
import styles from "./Sidebar.module.scss";

export function Sidebar() {
  const pathname = usePathname();
  const isActive = pathname.startsWith("/dashboard");

  return (
    <aside className={styles.sidebar}>
      <nav aria-label="Navegação principal">
        <Link
          href="/dashboard"
          className={cn(styles.item, isActive && styles.itemActive)}
          aria-current={isActive ? "page" : undefined}
        >
          Dashboard
        </Link>
      </nav>
    </aside>
  );
}
```

> `Link` do Next.js navega sem recarregar a página inteira (diferente de `<a href>`).

### 6.6 Importação de Sass compartilhado

Quando um módulo precisar de variáveis ou mixins, utilizar `@use`:

Um arquivo `src/styles/abstracts/_index.scss` reexporta variáveis e mixins
(`@forward`), permitindo um único `@use` por módulo:

```scss
@use "@/styles/abstracts" as *;

.card {
  color: var(--text-color);
  border-radius: $radius-md;

  @include up("md") {
    width: 50%;
  }
}
```

> Validado em 11/11/2026: o alias `@/` funciona dentro de `@use` com o
> Turbopack (bundler padrão do Next.js 16), usando o `paths` do `tsconfig.json`.

### 6.7 Regras de organização

- Não colocar todos os estilos em `globals.scss`.
- Não criar um arquivo global para cada componente.
- Não usar `@import` legado; preferir `@use` e `@forward`.
- Evitar `!important` (exceção aceita: a regra de `prefers-reduced-motion`,
  que precisa vencer qualquer animação).
- Utilizar variáveis de design para cores, espaçamentos, tipografia e
  bordas.
- Pensar em mobile-first.
- Garantir estados `hover`, `focus-visible`, `disabled`, `active` e
  `error`.
- Respeitar contraste e acessibilidade.
- Manter estilos de domínio junto do componente ou feature
  correspondente.

### 6.8 Como testar

```bash
npm run dev
npm run build
```

O Sass não possui um comando de teste isolado obrigatório. A compilação
do projeto e os testes de componentes ajudam a detectar problemas. A
configuração de Jest deve tratar arquivos SCSS como módulos simulados.

---

## 7. Radix UI Primitives

**Objetivo:** fornecer comportamentos acessíveis e componentes de
interação sem impor uma identidade visual pronta.

A biblioteca não substitui o SCSS. O Radix controla comportamento,
estados, foco e acessibilidade; os estilos serão definidos pelo projeto.

### 7.1 Documentação

- Visão geral:
  <https://www.radix-ui.com/primitives/docs/overview/introduction>
- Componentes: <https://www.radix-ui.com/primitives/docs/components>

### 7.2 Componentes previstos

| Componente    | Uso                              |
| ------------- | -------------------------------- |
| Dialog        | Modal e formulários              |
| Alert Dialog  | Confirmação de ações destrutivas |
| Dropdown Menu | Menu de ações                    |
| Select        | Seleção de opções                |
| Tabs          | Abas                             |
| Tooltip       | Ajuda contextual                 |
| Popover       | Conteúdo flutuante               |
| Checkbox      | Seleções                         |
| Accordion     | Conteúdo expansível              |

### 7.3 Instalação incremental

A documentação atual do Radix recomenda o **pacote unificado** `radix-ui`,
que reúne todos os primitives com tree-shaking (só o que for importado vai
para o bundle):

```bash
npm install radix-ui
```

```tsx
import { DropdownMenu } from "radix-ui";
```

O critério “instalar apenas o necessário” passa a valer para os **wrappers**:
criar o wrapper de um primitive somente quando ele for usado. Os pacotes
individuais (`@radix-ui/react-*`) continuam existindo, mas não devem ser
misturados com o pacote unificado no mesmo projeto.

### 7.4 Organização

Os componentes Radix devem ser encapsulados em componentes próprios
quando houver necessidade de padronização:

```text
src/components/ui/
├── Dialog/
│   ├── Dialog.tsx
│   └── Dialog.module.scss
├── Select/
│   ├── Select.tsx
│   └── Select.module.scss
├── Tooltip/
│   ├── Tooltip.tsx
│   └── Tooltip.module.scss
└── AlertDialog/
    ├── AlertDialog.tsx
    └── AlertDialog.module.scss
```

### 7.5 Critérios

- Não criar wrappers para todos os componentes antes de precisar
  deles.
- Padronizar acessibilidade, tamanhos e variantes.
- Não modificar diretamente o código da biblioteca.
- Testar navegação por teclado, foco e leitores de tela.
- Aplicar SCSS Modules nos wrappers.

---

## 8. Lucide React

**Objetivo:** padronizar os ícones da aplicação com SVGs leves e
componentes tipados.

Documentação: <https://lucide.dev/guide/react/getting-started>

### 8.1 Instalação

```bash
npm install lucide-react
```

### 8.2 Exemplo

```tsx
import { LayoutDashboard, Wallet, BookOpen, Settings } from "lucide-react";

export function ExampleIcons() {
  return (
    <nav>
      <LayoutDashboard size={20} aria-label="Dashboard" />
      <Wallet size={20} aria-label="Financeiro" />
      <BookOpen size={20} aria-label="Estudos" />
      <Settings size={20} aria-label="Configurações" />
    </nav>
  );
}
```

### 8.3 Padrão visual

- Tamanho padrão sugerido: 18 a 20 px para menus.
- Utilizar `strokeWidth` consistente.
- Não misturar bibliotecas de ícones sem justificativa.
- Para ícones decorativos, ocultar de tecnologias assistivas quando
  apropriado.
- Para botões apenas com ícone, fornecer nome acessível
  (`aria-label`).

---

# PARTE III --- BACKEND E API

## 9. Backend integrado ao Next.js

O projeto não terá um backend separado no início. O próprio Next.js
fornecerá os recursos de servidor.

Isso não significa colocar regra de negócio dentro de componentes React.

A lógica deve ser organizada em camadas:

1. **Interface:** componentes e páginas.
2. **Ações e endpoints:** Server Actions e Route Handlers.
3. **Serviços de domínio:** regras de negócio.
4. **Acesso a dados:** repositórios ou funções de consulta.
5. **Persistência:** Prisma e PostgreSQL.

### 9.1 Route Handlers

Route Handlers são endpoints HTTP definidos em arquivos `route.ts`
dentro de `app/api`.

Utilizar quando:

- Houver necessidade de uma API HTTP.
- Outro frontend ou aplicação precisar consumir os dados.
- Houver integração com aplicações independentes.
- For necessário receber webhooks.
- A operação precisar responder a métodos HTTP como GET, POST, PATCH e
  DELETE.

Exemplo de rota:

`src/app/api/v1/health/route.ts`

```ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "painel-admin-api",
    timestamp: new Date().toISOString(),
  });
}
```

Executar:

```bash
npm run dev
```

Testar no navegador:

```text
http://localhost:3000/api/v1/health
```

Ou pelo terminal:

```bash
curl http://localhost:3000/api/v1/health
```

### 9.2 Server Actions

Server Actions são funções executadas no servidor, indicadas para
mutações acionadas pela própria aplicação, como criar, editar ou excluir
registros.

Utilizar quando:

- Um formulário da aplicação precisa executar uma mutação.
- A operação pertence ao próprio fluxo do Next.js.
- Não há necessidade de expor um endpoint HTTP reutilizável por outros
  clientes.

Exemplo conceitual:

`src/modules/projects/actions/create-project.ts`

```ts
"use server";

import { auth } from "@/auth";
import { createProjectSchema } from "@/lib/validations/project";
import { createProjectService } from "@/modules/projects/services/create-project";

export async function createProjectAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Não autenticado.",
    };
  }

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  await createProjectService({
    ...parsed.data,
    ownerId: session.user.id,
  });

  return {
    success: true,
    message: "Projeto criado.",
  };
}
```

O serviço deve validar as regras de negócio e persistir os dados. A
action não deve conter consultas complexas diretamente.

> Server Actions também são pontos de entrada do servidor. Não presumir
> que são privadas só porque não possuem uma URL criada manualmente.
> Validar autenticação, autorização e dados em toda action.

### 9.3 Diferença prática

| Necessidade                              | Recurso                        |
| ---------------------------------------- | ------------------------------ |
| Carregar dados de uma página no servidor | Server Component + serviço     |
| Criar registro por formulário interno    | Server Action                  |
| API consumida por aplicação externa      | Route Handler                  |
| Receber webhook                          | Route Handler                  |
| Expor endpoint de consulta               | Route Handler                  |
| Atualizar dados por interação interna    | Server Action, quando adequada |

### 9.4 Padrão de organização do backend

```text
src/modules/projects/
├── components/
├── schemas/
├── services/
│   ├── create-project.ts
│   ├── list-projects.ts
│   └── update-project.ts
├── repositories/
│   └── project.repository.ts
├── actions/
│   └── create-project.ts
├── types/
│   └── project.types.ts
└── index.ts
```

As rotas HTTP ficam em `src/app/api`, mas os serviços de negócio
permanecem nos módulos.

> **Revisão 1.3 — implementação adotada** (ver `docs/setup/04-setup-backend/`):
>
> - `services/project.service.ts` reúne os casos de uso enquanto o módulo é
>   pequeno; dividir em um arquivo por caso de uso quando crescer.
> - A API pública do módulo tem **duas portas**: `index.ts` (schemas e tipos,
>   seguro para Client Components) e `server.ts` (serviços, com
>   `import "server-only"`). Exportar serviços no `index.ts` levaria o Prisma
>   para o bundle do navegador.
> - Erros de domínio em `src/lib/errors/app-error.ts`; respostas HTTP em
>   `src/lib/http/api-response.ts`.

---

## 10. Rotas de API planejadas

Adotar prefixo `/api/v1` para APIs de negócio. A rota `/api/auth/*`
pertence ao Auth.js e não precisa receber o prefixo de versão.

### 10.1 Endpoints iniciais

| Método | Endpoint                       | Objetivo                     | Proteção                     |
| ------ | ------------------------------ | ---------------------------- | ---------------------------- |
| GET    | `/api/v1/health`               | Diagnóstico básico           | Pública, sem dados sensíveis |
| GET    | `/api/v1/me`                   | Dados do usuário autenticado | Sessão obrigatória           |
| GET    | `/api/v1/projects`             | Listar projetos              | Sessão obrigatória           |
| POST   | `/api/v1/projects`             | Criar projeto                | Sessão + autorização         |
| GET    | `/api/v1/projects/:id`         | Consultar projeto            | Sessão + propriedade         |
| PATCH  | `/api/v1/projects/:id`         | Atualizar projeto            | Sessão + propriedade         |
| DELETE | `/api/v1/projects/:id`         | Excluir projeto              | Sessão + propriedade         |
| GET    | `/api/v1/finance/transactions` | Listar lançamentos           | Sessão + autorização         |
| POST   | `/api/v1/finance/transactions` | Criar lançamento             | Sessão + autorização         |
| GET    | `/api/v1/pdi/goals`            | Listar metas                 | Sessão + autorização         |
| POST   | `/api/v1/pdi/goals`            | Criar meta                   | Sessão + autorização         |

Os endpoints são um mapa inicial. Não criar todos antes de modelar os
casos de uso e os dados de cada módulo.

### 10.2 Convenções HTTP

- `GET`: leitura.
- `POST`: criação ou execução de operação.
- `PUT`: substituição completa de recurso.
- `PATCH`: atualização parcial.
- `DELETE`: exclusão.

Respostas devem usar códigos HTTP adequados:

- `200`: sucesso.
- `201`: criado.
- `204`: sucesso sem corpo.
- `400`: requisição inválida.
- `401`: não autenticado.
- `403`: autenticado, mas sem permissão.
- `404`: recurso não encontrado.
- `409`: conflito.
- `422`: dados semanticamente inválidos, quando adotado.
- `500`: erro inesperado.

Não devolver stack trace, SQL, tokens ou detalhes internos em respostas
públicas.

### 10.3 Formato padrão das respostas (revisão 1.3)

```jsonc
// sucesso
{ "data": { ... } }
// erro
{ "error": { "code": "VALIDATION_ERROR", "message": "Dados inválidos.", "fieldErrors": { ... } } }
```

Códigos: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403),
`NOT_FOUND` (404), `CONFLICT` (409), `INTERNAL_ERROR` (500, mensagem
genérica). Recurso de **outra usuária** responde `404`, e não `403`, para
não revelar que ele existe. Exceção documentada: `/api/v1/health` mantém
formato próprio, para ferramentas de monitoramento.

---

# PARTE IV --- AUTENTICAÇÃO E AUTORIZAÇÃO

## 11. Auth.js

**Objetivo:** implementar login, sessão e integração com o Next.js.

Documentação: <https://authjs.dev/>

### 11.0 Decisão (revisão 1.2): Better Auth — ADR-006 aceita

A autenticação será feita com **Better Auth**, e não com Auth.js. Motivos,
alternativas e consequências estão em
`docs/decisions/ADR-006-autenticacao-better-auth.md`; o passo a passo
validado está em `docs/setup/03-setup-autenticacao/`.

Os **princípios** desta seção continuam valendo integralmente (uma conta
administradora, sem cadastro público, hash forte, rate limiting, mensagem
genérica, proteção no servidor, cookies `HttpOnly`/`Secure`, logout e
expiração). As subseções 11.2 a 11.7 descrevem a implementação **original
com Auth.js** e ficam como **registro histórico**. Não as siga para
implementar; use o guia da Fase 03.

Mapeamento da proposta original para a implementação adotada:

| Proposta original (Auth.js)       | Implementação adotada (Better Auth)                                   |
| --------------------------------- | --------------------------------------------------------------------- |
| `src/auth.ts`                     | `src/lib/auth/auth.ts`                                                |
| `api/auth/[...nextauth]/route.ts` | `api/auth/[...all]/route.ts`                                          |
| Sessão JWT (sem revogação)        | Sessão no banco (tabela `session`); o logout invalida de fato         |
| `bcryptjs`                        | `hashPassword` do Better Auth (scrypt)                                |
| `AUTH_SECRET` / `AUTH_URL`        | `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL`                              |
| `lib/auth/require-auth.ts`        | `lib/auth/session.ts` (`getSession`, `requireSession`, `requireRole`) |
| Rate limiting a implementar       | `rateLimit` nativo com armazenamento em banco                         |
| `middleware.ts`                   | `src/proxy.ts` (Next.js 16), apenas otimista                          |

### 11.0.1 Contexto da decisão (registrado na revisão 1.1)

- Desde setembro de 2025 o projeto Auth.js faz parte do **Better Auth** e
  recebe manutenção voltada a segurança e correções urgentes.
- O `next-auth` v5 continua publicado como **beta** (`next-auth@beta`).
- No Next.js 16, `middleware.ts` foi renomeado para **`proxy.ts`** (função
  exportada `proxy`). Exemplos antigos do Auth.js com
  `export { auth as middleware }` precisam ser adaptados.

Decisão tomada em 11/11/2026: opção (b), Better Auth (ver 11.0).

### 11.1 Decisão inicial

Para a primeira versão:

- Uma conta administradora.
- Sem cadastro público.
- Login por e-mail e senha, se esse for o método confirmado.
- Auth.js Credentials Provider.
- Sessão JWT.
- Usuário armazenado no PostgreSQL.
- Senha armazenada somente como hash forte.
- Verificação da senha no servidor.
- Limitação de tentativas de login.
- Logout e expiração de sessão.
- Proteção de páginas, actions, endpoints e serviços.

**Atenção:** o Credentials Provider do Auth.js não persiste usuários
automaticamente. A aplicação precisa consultar seu próprio cadastro,
validar a senha, aplicar rate limiting e implementar os cuidados
relacionados a credenciais. Com Credentials, a estratégia de sessão JWT
é a escolha apropriada para este desenho inicial.

Não usar senha em texto puro, não criar senha fixa no código e não
permitir cadastro aberto.

### 11.2 Dependências

```bash
npm install next-auth@beta
npm install bcryptjs
npm install -D @types/bcryptjs
```

A versão do Auth.js deve ser confirmada na documentação oficial antes da
instalação. Se a versão estável e a documentação mudarem, atualizar o
comando e o exemplo em conjunto.

Se futuramente forem utilizados provedores OAuth e sessões persistidas
no banco, avaliar o adapter Prisma:

```bash
npm install @auth/prisma-adapter
```

O adapter não é obrigatório para o fluxo inicial com Credentials + JWT.

### 11.3 Variáveis de ambiente

Arquivo `.env.local`:

```env
AUTH_SECRET="gerar-um-segredo-forte"
AUTH_URL="http://localhost:3000"
```

Gerar segredo:

```bash
npx auth secret
```

Não compartilhar nem versionar `.env.local`.

### 11.4 Organização sugerida

```text
src/
├── auth.ts
├── app/
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts
├── lib/
│   ├── auth/
│   │   └── require-auth.ts
│   └── security/
│       ├── password.ts
│       └── rate-limit.ts
└── modules/
    └── auth/
        ├── schemas/
        │   └── login.schema.ts
        ├── services/
        │   └── authenticate-user.ts
        └── types/
```

### 11.5 Configuração Auth.js --- exemplo inicial

`src/auth.ts`:

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },

      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });

        if (!user || !user.isActive) {
          return null;
        }

        const passwordIsValid = await compare(
          parsed.data.password,
          user.passwordHash,
        );

        if (!passwordIsValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }

      return session;
    },
  },
});
```

Esse exemplo é um ponto de partida. Será necessário estender os tipos de
`Session` e `JWT` para remover casts, configurar corretamente o tipo
`role` e testar o comportamento com a versão instalada do Auth.js.

### 11.6 Criar a rota do Auth.js

`src/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

O Auth.js disponibiliza os endpoints necessários sob `/api/auth/*`.

### 11.7 Verificar sessão no servidor

Exemplo de função de proteção:

`src/lib/auth/require-auth.ts`:

```ts
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session;
}
```

Usar essa função em páginas, serviços ou layouts privados, conforme a
necessidade.

### 11.8 Autenticação x autorização

- **Autenticação:** confirma quem está acessando.
- **Autorização:** define o que essa pessoa pode fazer.

Mesmo com apenas uma administradora, modelar a autorização
explicitamente. Isso facilita adicionar outros usuários no futuro.

### 11.9 Cookies e sessões

- Utilizar HTTPS em produção.
- Deixar o Auth.js gerenciar cookies de sessão.
- Não armazenar tokens de sessão em `localStorage`.
- Usar cookies `HttpOnly`, `Secure` em produção e política `SameSite`
  adequada.
- Definir duração e estratégia de revogação.
- Não registrar tokens ou cookies nos logs.
- Implementar logout.
- Avaliar sessões por dispositivo e revogação centralizada caso o
  requisito de segurança evolua.

Uma sessão JWT não equivale a uma lista de dispositivos autorizados.
Para controle de dispositivos e revogação individual, será necessário um
mecanismo adicional, por exemplo sessões persistidas e identificadores
de dispositivo.

### 11.10 Segurança adicional obrigatória

- Rate limiting no login.
- Mensagem genérica para credenciais inválidas.
- Hash de senha com algoritmo apropriado e parâmetros atuais.
- Validação no servidor.
- Proteção contra acesso direto a dados de outros usuários.
- Verificação de autorização em cada endpoint e Server Action.
- Headers de segurança.
- Política de backup e recuperação.
- Auditoria de operações sensíveis.

---

# PARTE V --- DADOS E BANCO

## 12. PostgreSQL com Supabase Free

**Objetivo:** disponibilizar um banco PostgreSQL gerenciado sem manter
um servidor próprio.

Documentação: <https://supabase.com/docs>

### 12.1 Criar o projeto

1. Acessar <https://supabase.com/dashboard>.
2. Criar uma conta ou entrar.
3. Criar uma organização, se necessário.
4. Selecionar **New project**.
5. Informar:
   - Nome: `painel-admin`.
   - Senha forte para o banco.
   - Região próxima dos usuários e da aplicação, considerando
     disponibilidade.
6. Aguardar a criação.
7. Abrir o projeto.
8. Acessar **Connect**.
9. Copiar as strings de conexão adequadas.

Não inserir a senha real no documento, no GitHub ou em prints
compartilhados.

### 12.2 Conexão local e Vercel

O Supabase oferece diferentes métodos de conexão. Para uma aplicação
serverless na Vercel, utilizar o pooler compartilhado em modo
transaction para o tráfego da aplicação, conforme a recomendação atual
do Supabase e a compatibilidade do driver.

Para migrations e operações administrativas, utilizar uma conexão direta
quando a rede e o ambiente permitirem, ou a conexão indicada pelo
provedor para esse uso.

Variáveis conceituais:

```env
# Aplicação em runtime: conexão pooler/transaction
DATABASE_URL="postgresql://..."

# CLI/migrations: conexão direta ou apropriada para migrations
DIRECT_URL="postgresql://..."
```

As strings devem ser copiadas do painel do Supabase. Não inventar host,
usuário, senha ou região.

**Importante:** a conexão direta do Supabase pode utilizar IPv6. Se o
ambiente não oferecer IPv6, utilizar o pooler compatível. O host e o
usuário do pooler são específicos do projeto.

### 12.3 Portas

| Serviço                     | Porta | Observação                        |
| --------------------------- | ----- | --------------------------------- |
| Next.js local               | 3000  | Aplicação web                     |
| PostgreSQL local            | 5432  | Porta padrão do Postgres          |
| Supabase pooler transaction | 6543  | Conexão compartilhada transaction |
| Supabase pooler session     | 5432  | Conexão compartilhada session     |

A porta não deve ser presumida: copiar o endereço e a porta exibidos no
painel do Supabase.

### 12.4 Supabase Free: limites e cuidados

O plano gratuito pode ser adequado para começar, mas não deve ser
tratado como infraestrutura com disponibilidade garantida.

Pontos de atenção:

- Limite de armazenamento do banco.
- Limites de transferência e recursos.
- Projetos gratuitos podem ser pausados após período de baixa
  atividade.
- Recursos de backup e recuperação são mais limitados que nos planos
  pagos.
- É necessário manter exportações e backups próprios.
- Verificar os limites e preços atuais antes de colocar dados
  importantes em produção.

Página de preços e limites: <https://supabase.com/pricing>

### 12.5 Testar a conexão (ver também 12.6)

A conexão será validada pelo Prisma, depois de configurado o ORM. Não
expor uma rota pública que retorne a string de conexão ou informações
sensíveis do banco.

Criar um endpoint de health check que retorne apenas o estado geral, sem
credenciais ou dados internos.

### 12.6 Data API do Supabase: desativar (revisão 1.2)

O Supabase gera automaticamente uma API REST/GraphQL para o schema `public`,
onde o Prisma cria as tabelas, incluindo `account` (hash de senha) e
`session` (tokens). Tabelas sem RLS podem ficar acessíveis pela chave
`anon`. Como este projeto **não usa** `supabase-js` nem a API REST do
Supabase, a **Data API deve ser desativada** no projeto. Ver
`docs/setup/02-setup-banco-prisma/02-projeto-supabase.md`.

### 12.7 Banco de desenvolvimento (revisão 1.2)

O dia a dia usa **PostgreSQL local via Docker Compose** (princípio 9). O
Supabase é usado em Preview e Produção (Fase 06). Para a aplicação na Vercel,
`DATABASE_URL` usa o _transaction pooler_ com `?pgbouncer=true`; para
migrations, `DIRECT_URL` usa a conexão direta, ou o _session pooler_ quando
não houver IPv6.

---

## 13. Modelagem de dados e Draw.io

Antes de criar tabelas definitivas, levantar os dados de cada módulo e
seus relacionamentos.

### 13.1 Primeiras entidades candidatas

| Domínio    | Entidade    | Finalidade                                     |
| ---------- | ----------- | ---------------------------------------------- |
| Identidade | User        | Conta de usuário                               |
| Identidade | Account     | Contas OAuth, se forem adotadas                |
| Identidade | Session     | Sessões persistidas, se adotadas               |
| Projetos   | Project     | Projetos cadastrados                           |
| Projetos   | ProjectLink | Links relacionados a um projeto, se necessário |
| PDI        | Goal        | Metas profissionais                            |
| PDI        | ActionItem  | Ações de uma meta                              |
| Financeiro | Transaction | Receitas e despesas                            |
| Financeiro | Category    | Categorias financeiras                         |

Essa lista é preliminar. Não criar todas as tabelas antes de confirmar
os requisitos funcionais de cada módulo.

### 13.2 Regras de modelagem

- Definir identificadores primários.
- Definir chaves estrangeiras.
- Definir cardinalidade: 1:1, 1:N e N:N.
- Definir campos obrigatórios e opcionais.
- Definir índices para campos de busca e relacionamentos.
- Definir unicidade para e-mail e outras chaves de negócio.
- Definir política de exclusão: cascade, restrict ou set null,
  conforme o caso.
- Incluir `createdAt` e `updatedAt` quando fizer sentido.
- Usar valores decimais apropriados para valores monetários; não usar
  ponto flutuante para dinheiro.
- Definir fuso horário e padrão de datas.
- Considerar propriedade dos registros (`userId`/`ownerId`) para
  isolamento por usuário.

### 13.3 Draw.io

Criar o diagrama entidade-relacionamento (ERD) em:

<https://app.diagrams.net/>

Arquivos sugeridos:

```text
docs/
└── architecture/
    ├── system-context.drawio
    ├── application-components.drawio
    ├── database-erd.drawio
    └── deployment.drawio
```

O ERD deve mostrar:

- Entidades.
- Atributos relevantes.
- PKs e FKs.
- Cardinalidades.
- Domínio responsável por cada entidade.
- Relacionamentos entre domínios.

Manter o diagrama sincronizado com `schema.prisma`. O diagrama documenta
a modelagem; não substitui migrations nem o schema.

### 13.4 Endpoints por entidade

Não é obrigatório criar um endpoint CRUD para cada tabela. Criar
endpoints a partir dos casos de uso e das regras de negócio.

Exemplo: uma tela financeira pode precisar de
`GET /api/v1/finance/summary`, que agrega dados de várias tabelas, em
vez de expor todas as tabelas diretamente.

---

# PARTE VI --- ORM E PERSISTÊNCIA

## 14. Prisma ORM

**Objetivo:** centralizar a modelagem do banco, gerar tipos, executar
consultas e controlar migrations.

Documentação: <https://www.prisma.io/docs>

### 14.1 Instalação

A versão atual do Prisma ORM 7 utiliza driver adapters. Para PostgreSQL:

```bash
npm install @prisma/client@7 @prisma/adapter-pg@7 pg
npm install -D prisma@7 dotenv tsx @types/pg
```

> ⚠️ **Fixar `@7`** (revisão 1.2): em 11/11/2026, a tag `latest` do pacote
> `prisma` no npm aponta para a 8.0.0 RC, incompatível com o client 7 e
> ainda não suportada pelo adapter do Better Auth.

> Requisitos do Prisma 7: Node.js ≥ 20.19 e TypeScript ≥ 5.4.

O Prisma ORM 7 requer configuração atualizada e um adapter de driver.
Não copiar exemplos de Prisma 5 ou 6 sem verificar as diferenças.

### 14.2 Estrutura

```text
prisma/
├── schema.prisma
├── migrations/
└── seed.ts

prisma.config.ts

src/
└── lib/
    └── db/
        └── prisma.ts
```

### 14.3 Prisma Schema --- exemplo inicial

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum UserRole {
  ADMIN
  USER
}

model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  role         UserRole @default(USER)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  projects     Project[]
}

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  ownerId     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  owner       User     @relation(fields: [ownerId], references: [id], onDelete: Restrict)

  @@index([ownerId])
}
```

Esse schema é didático e inicial. O modelo real deve ser revisado antes
de aplicar em produção.

### 14.4 Configuração Prisma 7

> Revisão 1.2: no Prisma 7.10+ o arquivo se chama **`prisma7.config.ts`**,
> carrega o `.env.local` explicitamente (`dotenv`) e usa
> `process.env["DIRECT_URL"]`. A versão validada está em
> `docs/setup/02-setup-banco-prisma/05-configurar-prisma.md`. O exemplo
> abaixo é o da proposta original.

`prisma.config.ts`:

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
```

Adicionar `tsx` para executar o seed, se adotado:

```bash
npm install -D tsx
```

O projeto Prisma 7 também deve seguir o formato de módulos ESM
recomendado pela versão instalada. Conferir `package.json` e a
documentação antes de ajustar `"type": "module"`.

### 14.5 Criar o Prisma Client

`src/lib/db/prisma.ts`:

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

Observações:

- Manter uma instância reutilizável por processo.
- Não criar um novo PrismaClient em cada request.
- Não importar Prisma em Client Components.
- Não expor `DATABASE_URL` no navegador.
- Configurar corretamente o pool para o ambiente serverless.
- Conferir a sintaxe exata do adapter da versão instalada.

### 14.6 Comandos principais

```bash
# Gerar o Prisma Client
npx prisma generate

# Criar migration em desenvolvimento
npx prisma migrate dev --name init

# Prisma 7: migrate dev NÃO roda mais generate nem seed automaticamente
npx prisma generate
npx prisma db seed

# Aplicar migrations em produção
npx prisma migrate deploy

# Abrir Prisma Studio
npx prisma studio

# Validar schema
npx prisma validate

# Formatar schema
npx prisma format
```

### 14.7 Fluxo de alteração de banco

1. Alterar `schema.prisma`.
2. Validar o schema.
3. Criar migration com nome descritivo.
4. Revisar a migration gerada.
5. Gerar o Prisma Client (`npx prisma generate` — obrigatório e explícito no Prisma 7).
6. Implementar ou atualizar serviços.
7. Criar/atualizar testes.
8. Validar localmente.
9. Aplicar migrations no ambiente correto.
10. Fazer deploy.

Nunca editar manualmente o banco de produção sem registrar a alteração
no fluxo de migrations.

### 14.8 Prisma Studio

Executar:

```bash
npx prisma studio
```

A interface padrão abre em uma porta local informada pelo terminal,
normalmente `http://localhost:5555`.

Não publicar Prisma Studio na internet. Ele é uma ferramenta
administrativa e deve permanecer restrito ao ambiente local ou a uma
rede protegida.

### 14.9 Seed de usuário administrador

> Revisão 1.2: implementado na **Fase 03**, passo 05, porque o hash precisa
> ser o mesmo do Better Auth (`hashPassword`, scrypt), e a senha fica na
> tabela `account` (`providerId = "credential"`).

Criar um script de seed para cadastrar a conta inicial de forma
controlada.

Regras:

- Ler e-mail e senha inicial de variáveis de ambiente seguras.
- Gerar hash com algoritmo apropriado.
- Não inserir senha em texto puro.
- Não executar seed destrutivo em produção.
- Tornar o processo idempotente.
- Exigir troca da senha inicial, se aplicável.

Não incluir credenciais reais no exemplo ou no repositório.

---

# PARTE VII --- VALIDAÇÃO

## 15. Zod

**Objetivo:** validar dados recebidos de formulários, Server Actions,
Route Handlers, parâmetros e integrações.

Documentação: <https://zod.dev/>

### 15.1 Instalação

```bash
npm install zod
```

### 15.2 Organização

```text
src/modules/projects/
└── schemas/
    └── project.schema.ts

src/modules/finance/
└── schemas/
    └── transaction.schema.ts

src/lib/
└── validations/
    ├── common.schema.ts
    └── pagination.schema.ts
```

Schemas de domínio devem ficar próximos do módulo. Schemas realmente
compartilhados podem ficar em `lib/validations`.

### 15.3 Exemplo

> **Revisão 1.3 — Zod 4:** mensagens com `{ error: "..." }` (e não
> `message`), `z.email()` / `z.url()` como funções de topo, e
> `z.flattenError(result.error)` no lugar de `result.error.flatten()`. Em
> schemas de atualização (`.partial()`), **não** herde `.default()` do
> schema de criação. Versão validada em
> `docs/setup/04-setup-backend/02-zod-schemas.md`.

`src/modules/projects/schemas/project.schema.ts`:

```ts
import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().max(500).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
```

### 15.4 Validar uma entrada

```ts
const result = createProjectSchema.safeParse(input);

if (!result.success) {
  return {
    success: false,
    errors: result.error.flatten().fieldErrors,
  };
}

const data = result.data;
```

### 15.5 Regras

- Validar no servidor, mesmo que o formulário já valide no navegador.
- Reutilizar o mesmo schema quando a regra for idêntica.
- Não confiar em valores enviados pelo frontend para definir `userId`,
  `role` ou permissões.
- Não confundir validação de formato com autorização.
- Criar schemas separados quando criação e atualização tiverem regras
  diferentes.
- Testar casos válidos, inválidos, limites e campos opcionais.

---

# PARTE VIII --- TESTES E QUALIDADE

## 16. Jest + React Testing Library

**Objetivo:** testar funções, regras de negócio, validações e
componentes React compatíveis.

Documentação Next.js + Jest:
<https://nextjs.org/docs/app/guides/testing/jest>

### 16.1 Instalação

```bash
npm install -D \
  jest \
  jest-environment-jsdom \
  @testing-library/react \
  @testing-library/dom \
  @testing-library/jest-dom \
  @types/jest \
  ts-node
```

A configuração pode ser escrita manualmente (recomendado, ver 16.2) ou
gerada com `npm init jest@latest` e depois ajustada.

### 16.2 `jest.config.ts` --- exemplo

```ts
import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // Testes E2E (Playwright) também usam *.spec.ts; o Jest não deve executá-los.
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/tests/e2e/"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/generated/**",
  ],
};

export default createJestConfig(config);
```

### 16.3 Setup

`jest.setup.ts`:

```ts
import "@testing-library/jest-dom";
```

### 16.4 Scripts sugeridos

Adicionar ao `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

> O `next/jest` já simula (mock) arquivos `.css`, `.module.css` e suas
> variantes `.scss`, imagens e `next/font`. Não é preciso configurar SCSS no Jest.

### 16.5 Tipos de testes

| Tipo                           | Ferramenta                            |
| ------------------------------ | ------------------------------------- |
| Funções e utilitários          | Jest                                  |
| Componentes React síncronos    | Jest + Testing Library                |
| Hooks                          | Jest + Testing Library                |
| Schemas Zod                    | Jest                                  |
| Serviços e regras de negócio   | Jest                                  |
| Fluxo completo de login        | Playwright                            |
| Navegação e acesso aos módulos | Playwright                            |
| Testes de integração com banco | Jest + banco de teste isolado         |
| Async Server Components        | E2E com Playwright, quando apropriado |

**Limitação conhecida:** Jest não oferece suporte completo a Async
Server Components. Não forçar testes unitários nesse cenário; testar o
fluxo com Playwright ou extrair a lógica para funções de serviço
testáveis.

### 16.6 Exemplo de teste Zod

```ts
import { createProjectSchema } from "@/modules/projects/schemas/project.schema";

describe("createProjectSchema", () => {
  it("deve aceitar um projeto válido", () => {
    const result = createProjectSchema.safeParse({
      name: "Personal Platform",
      description: "Portal administrativo",
    });

    expect(result.success).toBe(true);
  });

  it("deve rejeitar nome menor que três caracteres", () => {
    const result = createProjectSchema.safeParse({
      name: "AB",
    });

    expect(result.success).toBe(false);
  });
});
```

---

## 17. Playwright --- testes E2E

**Objetivo:** simular a utilização real da aplicação no navegador.

Documentação: <https://playwright.dev/docs/intro>

### 17.1 Instalação

```bash
npm init playwright@latest
```

Selecionar TypeScript e a pasta de testes E2E sugerida pelo instalador.

### 17.2 Fluxos obrigatórios

- Abrir o sistema sem sessão.
- Ser redirecionado para login.
- Realizar login válido.
- Rejeitar credenciais inválidas.
- Acessar dashboard.
- Navegar entre módulos.
- Tentar acessar URL privada sem autenticação.
- Fazer logout.
- Tentar reutilizar uma sessão encerrada.
- Validar formulários e mensagens de erro.
- Testar operação de criação, edição e exclusão em ambiente de teste.

### 17.3 Comandos

```bash
# Executar E2E
npx playwright test

# Modo visual
npx playwright test --ui

# Relatório
npx playwright show-report
```

Os testes devem usar dados isolados e nunca executar operações
destrutivas em produção.

---

# PARTE IX --- DEPLOY E OPERAÇÃO

## 18. Vercel

**Objetivo:** hospedar a aplicação Next.js e automatizar deploys a
partir do GitHub.

Documentação: <https://vercel.com/docs>

### 18.1 Criar o projeto

1. Acessar <https://vercel.com/dashboard>.
2. Entrar com a conta desejada.
3. Selecionar **Add New → Project**.
4. Importar o repositório privado do GitHub.
5. Confirmar o framework Next.js.
6. Manter o diretório raiz padrão: neste projeto o Next.js fica direto na
   raiz do repositório (pasta `_admin`).
7. Configurar variáveis de ambiente.
8. Executar o primeiro deploy.

### 18.2 Ambientes

Separar as variáveis para:

- Development.
- Preview.
- Production.

Não usar o banco de produção em testes destrutivos ou ambientes de
preview sem uma decisão explícita.

### 18.3 Variáveis previstas

```env
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

DATABASE_URL=
DIRECT_URL=
```

Outras variáveis podem surgir conforme OAuth, armazenamento, e-mail,
observabilidade ou integrações forem adicionados.

### 18.4 Deploy automático

Fluxo sugerido:

```text
Desenvolvimento local
        |
        v
Branch de feature
        |
        v
Pull Request no GitHub
        |
        v
Deploy Preview na Vercel
        |
        v
Revisão + testes
        |
        v
Merge na branch principal
        |
        v
Deploy de produção
```

### 18.5 Limites do plano Hobby

O plano Hobby é voltado a projetos pessoais e possui limites de uso.
Conferir os limites atuais de build, funções, transferência, logs e
armazenamento antes de depender do serviço em produção.

Não considerar o plano gratuito como garantia de disponibilidade ou como
substituto de backup.

---

# PARTE X --- DOCUMENTAÇÃO E APLICAÇÕES INDEPENDENTES

## 19. Integração com o Docusaurus

O Portal Dev atual está em:

<https://elizfab.github.io/portal-dev/>

Ele continuará sendo um projeto independente de documentação. O Personal
Platform terá um card de Estudos que encaminhará para o portal.

### 19.1 Situação atual

O GitHub Pages publica conteúdo estático e não oferece, por padrão,
autenticação individual para proteger o conteúdo. Esconder o link no
dashboard não impede o acesso direto à URL.

### 19.2 Estratégia de proteção

Avaliar uma das opções:

1. Hospedar o Docusaurus em ambiente protegido por Cloudflare Access.
2. Hospedar a documentação em uma aplicação que valide a sessão no
   servidor.
3. Manter o repositório privado e escolher um provedor de publicação
   com controle de acesso real.

A proteção deve ocorrer antes de entregar os arquivos da documentação.
Não implementar um formulário de login apenas no frontend de um site
estático como se isso protegesse o conteúdo.

### 19.3 Integração no dashboard

O card Estudos pode:

- Abrir o Docusaurus em nova aba.
- Exibir status e descrição.
- Manter URL configurável por ambiente.
- Ser ocultado ou desativado quando o destino não estiver disponível.

Se o Docusaurus ficar em domínio separado, será necessário planejar a
autenticação também nesse domínio. A sessão do Auth.js no domínio do
Admin não será automaticamente compartilhada com outra aplicação.

---

# PARTE XI --- ESTRUTURA FINAL DO REPOSITÓRIO

## 20. Estrutura proposta

```text
painel-admin-admin/
│
├── docs/
│   ├── architecture/
│   │   ├── ARCHITECTURE.md
│   │   ├── system-context.drawio
│   │   ├── application-components.drawio
│   │   ├── database-erd.drawio
│   │   └── deployment.drawio
│   │
│   ├── README.md                 # mapa de implementação (ordem e status)
│   ├── setup/
│   │   ├── 00-setup-ambiente/
│   │   ├── 01-setup-frontend/
│   │   ├── 02-setup-banco-prisma/
│   │   ├── 03-setup-autenticacao/
│   │   ├── 04-setup-backend/
│   │   ├── 05-setup-testes-e2e/
│   │   └── 06-setup-deploy/
│   │
│   └── decisions/
│       ├── ADR-001-modular-monolith.md   (a criar)
│       └── ADR-006-autenticacao-better-auth.md
│
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
│
├── public/
│
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   ├── (private)/
│   │   ├── api/
│   │   ├── layout.tsx
│   │   └── globals.scss
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── shared/
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── studies/
│   │   ├── finance/
│   │   ├── pdi/
│   │   └── projects/
│   │
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── security/
│   │   ├── validations/
│   │   └── utils/
│   │
│   ├── generated/
│   │   └── prisma/
│   │
│   └── styles/
│       ├── abstracts/
│       ├── base/
│       ├── themes/
│       └── utilities/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── .env.local
├── AGENTS.md
├── .gitignore
├── docker-compose.yml
├── jest.config.ts
├── jest.setup.ts
├── next.config.ts
├── package.json
├── prisma7.config.ts
├── scripts/
│   └── security-check.sh
├── tsconfig.json
└── README.md
```

Observações:

- `.env.local` deve existir localmente, mas nunca ser commitado.
- `.env.example` contém somente nomes de variáveis e valores
  fictícios/vazios. O `.gitignore` gerado pelo Next.js ignora `.env*`;
  é preciso adicionar a exceção `!.env.example`.
- `src/generated/prisma` é código gerado; seguir a estratégia de
  versionamento recomendada pela versão do Prisma e pelo projeto.
- `docker-compose.yml` é opcional se o banco de desenvolvimento for
  sempre remoto. É útil para desenvolvimento local independente.
- `docs/` deve conter documentação atualizada, não cópias
  contraditórias deste guia.

---

# PARTE XII --- ORDEM DE IMPLEMENTAÇÃO

## 21. Plano de desenvolvimento por etapas

### Fase 0 --- Preparação

- [ ] Criar repositório privado.
- [ ] Criar aplicação Next.js.
- [ ] Configurar TypeScript strict.
- [ ] Configurar ESLint.
- [ ] Configurar SCSS.
- [ ] Criar estrutura inicial de diretórios.
- [ ] Criar `.env.example`.
- [ ] Criar README.

**Critério de conclusão:** aplicação executa localmente e o build passa.

### Fase 1 --- Design system e frontend base

- [ ] Definir tokens de design.
- [ ] Configurar SCSS Modules.
- [ ] Instalar Radix UI.
- [ ] Instalar Lucide React.
- [ ] Criar componentes básicos.
- [ ] Criar layout raiz.
- [ ] Criar sidebar.
- [ ] Criar header.
- [ ] Criar dashboard inicial.
- [ ] Criar responsividade.
- [ ] Criar estados de loading, vazio e erro.

**Critério de conclusão:** navegação visual funcionando com dados
mockados, sem depender ainda do backend de negócio.

### Fase 2 --- Banco e Prisma

- [ ] Criar projeto Supabase.
- [ ] Configurar PostgreSQL.
- [ ] Definir entidades iniciais.
- [ ] Criar ERD no Draw.io.
- [ ] Instalar Prisma.
- [ ] Configurar driver adapter.
- [ ] Criar schema inicial.
- [ ] Criar migration.
- [ ] Configurar Prisma Studio.
- [ ] Validar conexão.
- [ ] ~~Criar seed controlado~~ (movido para a Fase 3).

**Critério de conclusão:** aplicação consegue consultar o banco de
desenvolvimento pelo servidor.

### Fase 3 --- Autenticação e autorização

- [ ] Instalar Better Auth (ADR-006).
- [ ] Configurar login por e-mail e senha, sem cadastro público.
- [ ] Criar usuário administrador (seed).
- [ ] Implementar hash e verificação de senha.
- [ ] Configurar sessão.
- [ ] Criar tela de login.
- [ ] Criar logout.
- [ ] Proteger páginas privadas.
- [ ] Proteger Route Handlers.
- [ ] Proteger Server Actions.
- [ ] Implementar rate limiting.
- [ ] Testar sessão expirada e logout.

**Critério de conclusão:** não é possível acessar dados privados sem
sessão válida e autorização.

### Fase 4 --- Backend e contratos

- [ ] Definir schemas Zod.
- [ ] Criar camada de serviços.
- [ ] Criar camada de acesso a dados.
- [ ] Criar Route Handlers necessários.
- [ ] Criar Server Actions necessárias.
- [ ] Padronizar respostas e erros.
- [ ] Criar logs sem dados sensíveis.
- [ ] Criar testes unitários e de integração.

**Critério de conclusão:** operações iniciais de domínio funcionam com
validação, autenticação e persistência.

### Fase 5 --- Primeiro módulo funcional

- [ ] Escolher módulo inicial (sugestão: Projetos ou Estudos).
- [ ] Definir requisitos.
- [ ] Definir entidades e relacionamentos.
- [ ] Criar telas.
- [ ] Criar serviços.
- [ ] Criar endpoints/actions.
- [ ] Criar testes.
- [ ] Validar responsividade e acessibilidade.

**Critério de conclusão:** módulo completo, persistido e protegido.

### Fase 6 --- Testes e deploy

- [ ] Configurar Jest.
- [ ] Configurar Testing Library.
- [ ] Configurar Playwright.
- [ ] Criar testes de login.
- [ ] Criar testes de navegação.
- [ ] Criar testes de autorização.
- [ ] Criar testes de integração.
- [ ] Conectar GitHub à Vercel.
- [ ] Configurar variáveis por ambiente.
- [ ] Executar Preview Deploy.
- [ ] Validar Production Deploy.
- [ ] Documentar backup e recuperação.

**Critério de conclusão:** aplicação publicada, protegida e com fluxo de
validação reproduzível.

### Fase 7 --- Expansão

- [ ] Integrar Docusaurus protegido.
- [ ] Implementar Financeiro.
- [ ] Implementar PDI.
- [ ] Implementar Projetos avançados.
- [ ] Avaliar novas aplicações independentes.
- [ ] Avaliar controle de dispositivos.
- [ ] Avaliar observabilidade e alertas.

---

# PARTE XIII --- PADRÕES DE ENGENHARIA

## 22. Padrões obrigatórios

### 22.1 TypeScript

- `strict: true`.
- Não utilizar `any` sem justificativa documentada.
- Preferir tipos inferidos dos schemas Zod.
- Tipar respostas e contratos.
- Evitar duplicação de tipos entre frontend e backend.

### 22.2 Componentes React

- Componentes pequenos e com responsabilidade clara.
- Separar componentes de apresentação de regras de negócio.
- Utilizar Server Components por padrão.
- Adicionar `"use client"` somente quando houver necessidade de
  interação no navegador.
- Não importar módulos de servidor em Client Components.
- Não acessar banco diretamente em componentes de cliente.

### 22.3 Backend

- Validar todas as entradas.
- Autenticar e autorizar cada operação.
- Manter regra de negócio em serviços.
- Manter consultas e persistência em camada própria.
- Tratar erros de forma consistente.
- Não retornar detalhes internos ao cliente.

### 22.4 Banco de dados

- Migrations versionadas.
- Índices justificados.
- Integridade referencial.
- Valores monetários em Decimal.
- Datas e timezone definidos.
- Backups testados.
- Nunca executar migration destrutiva sem revisão.

### 22.5 Testes

- Testar comportamento, não detalhes internos desnecessários.
- Testar casos positivos e negativos.
- Testar autorização além da autenticação.
- Não usar banco de produção em testes.
- Manter fixtures e dados de teste isolados.
- Executar build e testes antes de merge.

### 22.6 Segurança

- Segredos apenas no servidor.
- `.env.local` fora do Git.
- Validação server-side.
- Cookies seguros.
- Rate limiting.
- Proteção contra CSRF conforme mecanismo utilizado.
- Controle de acesso por recurso.
- Headers de segurança.
- Backups.
- Dependências atualizadas.
- Logs sem senhas, tokens ou informações financeiras desnecessárias.

---

# PARTE XIV --- DOCUMENTAÇÃO OFICIAL

## 23. Links para estudo e referência

### Framework e frontend

- Next.js --- <https://nextjs.org/docs>
- React --- <https://react.dev/learn>
- TypeScript --- <https://www.typescriptlang.org/docs/>
- Sass --- <https://sass-lang.com/documentation/>
- Next.js Sass --- <https://nextjs.org/docs/app/guides/css/sass>
- Radix UI ---
  <https://www.radix-ui.com/primitives/docs/overview/introduction>
- Lucide React --- <https://lucide.dev/guide/react>

### Autenticação e segurança

- Auth.js --- <https://authjs.dev/>
- Auth.js Credentials ---
  <https://authjs.dev/getting-started/authentication/credentials>
- Next.js Authentication ---
  <https://nextjs.org/docs/app/guides/authentication>

### Backend e validação

- Next.js Route Handlers ---
  <https://nextjs.org/docs/app/getting-started/route-handlers>
- Next.js Server Actions ---
  <https://nextjs.org/docs/app/getting-started/updating-data>
- Zod --- <https://zod.dev/>

### Banco e ORM

- PostgreSQL --- <https://www.postgresql.org/docs/>
- Supabase --- <https://supabase.com/docs>
- Supabase Database Connections ---
  <https://supabase.com/docs/guides/database/connecting-to-postgres>
- Prisma --- <https://www.prisma.io/docs>
- Prisma + Next.js + Vercel ---
  <https://www.prisma.io/docs/guides/v7/frameworks/nextjs>

### Testes

- Jest --- <https://jestjs.io/docs/getting-started>
- Next.js + Jest --- <https://nextjs.org/docs/app/guides/testing/jest>
- React Testing Library ---
  <https://testing-library.com/docs/react-testing-library/intro/>
- Playwright --- <https://playwright.dev/docs/intro>

### Deploy e versionamento

- Vercel --- <https://vercel.com/docs>
- Vercel Git --- <https://vercel.com/docs/git>
- Vercel Plans --- <https://vercel.com/docs/plans>
- GitHub --- <https://docs.github.com/>

---

# PARTE XV --- CHECKLIST DE INÍCIO

## 24. Primeiro ciclo de trabalho

Executar somente esta primeira sequência para começar, sem antecipar a
implementação de todos os módulos. O passo a passo detalhado e testado de
cada item está em `docs/setup/00-setup-ambiente/` e `docs/setup/01-setup-frontend/`.

- [ ] Confirmar nome do projeto.
- [ ] Criar repositório privado.
- [ ] Verificar Node.js e npm.
- [ ] Criar Next.js com TypeScript, App Router e sem Tailwind.
- [ ] Executar `npm run dev`.
- [ ] Validar `http://localhost:3000`.
- [ ] Executar `npm run build`.
- [ ] Configurar TypeScript strict.
- [ ] Instalar Sass.
- [ ] Criar `globals.scss`.
- [ ] Criar estrutura inicial de SCSS.
- [ ] Instalar Lucide React.
- [ ] Instalar os primeiros componentes Radix necessários.
- [ ] Criar layout base.
- [ ] Criar dashboard visual com dados mockados.
- [ ] Configurar Jest.
- [ ] Criar primeiro teste unitário.
- [ ] Fazer commit inicial.

**Não iniciar autenticação e banco antes de validar a fundação do
frontend**, conforme a sequência definida para este projeto. A estrutura
deve, entretanto, reservar os diretórios e contratos necessários para a
integração futura.

---

## 25. Registro de decisões arquiteturais

| ID      | Decisão                                       | Justificativa                                                       | Status                         |
| ------- | --------------------------------------------- | ------------------------------------------------------------------- | ------------------------------ |
| ADR-001 | Monólito modular                              | Reduz complexidade inicial e mantém separação de domínios           | Adotada                        |
| ADR-002 | Next.js App Router                            | Fullstack React e aprendizado do ecossistema                        | Adotada                        |
| ADR-003 | TypeScript strict                             | Segurança de tipos e manutenção                                     | Adotada                        |
| ADR-004 | SCSS Modules                                  | Estilos isolados e controle visual                                  | Adotada                        |
| ADR-005 | Radix UI + Lucide                             | Acessibilidade e identidade visual própria                          | Adotada                        |
| ADR-006 | Better Auth (e-mail e senha, sessão no banco) | Biblioteca ativa; rate limiting, hash e revogação de sessão nativos | **Aceita** (substitui Auth.js) |
| ADR-007 | PostgreSQL + Prisma                           | Persistência relacional e tipagem                                   | Adotada                        |
| ADR-008 | Supabase Free                                 | PostgreSQL gerenciado para início                                   | Proposta a validar             |
| ADR-009 | Zod                                           | Validação compartilhada                                             | Adotada                        |
| ADR-010 | Jest + Playwright                             | Testes unitários, componentes e E2E                                 | Adotada                        |
| ADR-011 | Vercel Hobby                                  | Deploy pessoal inicial                                              | Proposta a validar             |
| ADR-012 | Arquitetura híbrida                           | Módulos integrados ou independentes conforme necessidade            | Adotada                        |

---

## 26. Diretriz para iniciar a implementação com assistência de IA

Ao iniciar o desenvolvimento, utilizar este documento como referência
principal.

Regras para qualquer agente ou assistente de código:

1. Ler este documento antes de propor alterações arquiteturais.
2. Não substituir tecnologias definidas sem apresentar justificativa e
   solicitar aprovação.
3. Não instalar dependências desnecessárias.
4. Não criar módulos completos antes da conclusão da fundação.
5. Não modificar arquivos existentes sem explicar o impacto quando a
   solicitação estiver ambígua.
6. Não inserir credenciais reais, tokens ou dados pessoais nos arquivos
   versionados.
7. Criar testes para novas regras e funcionalidades.
8. Atualizar a documentação quando uma decisão ou comando mudar.
9. Preferir implementação incremental, com validação a cada etapa.
10. Informar comandos executados, arquivos criados e critérios de
    aceite.
11. Não afirmar que algo está protegido sem testar o acesso direto às
    páginas, actions e endpoints.
12. Não fazer deploy de produção sem autorização explícita.

**Primeira entrega esperada:** aplicação Next.js inicial funcionando
localmente, com TypeScript, SCSS Modules, estrutura modular, design
system básico, layout administrativo responsivo e testes iniciais.
Backend de domínio, banco e autenticação serão integrados nas fases
seguintes.

---

**Fim do documento.**
