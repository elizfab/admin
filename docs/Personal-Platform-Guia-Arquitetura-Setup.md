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
> **Stack principal:** Next.js + TypeScript + SCSS Modules + Auth.js +
> PostgreSQL + Prisma + Zod + Jest + Playwright + Vercel

---

## 1. Objetivo do projeto

Construir um portal administrativo pessoal, privado e extensível, que funcione como ponto central de entrada para diferentes áreas:

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

---

Camada Tecnologia Responsabilidade

---

Framework Next.js App Router Aplicação web,
renderização e backend
integrado

Linguagem TypeScript Tipagem estática e
contratos

UI React Componentização da
interface

Estilos Sass / SCSS Modules Estilos isolados por
componente

Componentes acessíveis Radix UI Primitives Comportamentos
acessíveis sem impor
identidade visual

Ícones Lucide React Ícones SVG

Autenticação Auth.js Login, sessão e
integração com o
Next.js

Backend Route Handlers + Server APIs HTTP e mutações
Actions acionadas pela
interface

Validação Zod Validação de
formulários, parâmetros
e payloads

Banco PostgreSQL Persistência relacional

Banco gerenciado Supabase Free PostgreSQL hospedado
para desenvolvimento
inicial

ORM Prisma ORM Modelagem, consultas,
migrations e tipos

Testes unitários Jest Funções, regras e
componentes compatíveis

Testes de componentes React Testing Library Comportamento da
interface

Testes E2E Playwright Fluxos reais no
navegador

Hospedagem Vercel Hobby Deploy da aplicação
pessoal

Repositório GitHub privado Versionamento e
histórico

Execução local Node.js + npm Desenvolvimento

Banco local opcional Docker Compose PostgreSQL local para
desenvolvimento offline

---

### 2.1 Decisões fechadas e decisões que exigem validação

**Decisões adotadas para a primeira versão:**

- Next.js com App Router.
- TypeScript em modo strict.
- SCSS Modules; não utilizar Tailwind CSS.
- Radix UI Primitives, adotando apenas os componentes necessários.
- Lucide React.
- Auth.js com uma conta administradora inicial.
- Auth.js Credentials Provider com sessão JWT, caso o login seja por
  e-mail e senha.
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
- Provedor e método definitivo de login.
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

---

Recurso Link / identificação Status

---

GitHub --- conta <https://github.com/elizabetefabri> Existente

GitHub --- repositório A definir Pendente
Admin

Vercel <https://vercel.com/dashboard> Pendente de vinculação

Projeto Vercel A definir Pendente

Supabase <https://supabase.com/dashboard> Pendente

Projeto Supabase A definir Pendente

Domínio personalizado A definir Opcional

Portal Docusaurus <https://elizfab.github.io/portal-dev/> Existente; atualmente
público

Cloudflare <https://dash.cloudflare.com/> Opcional, para proteger
aplicações
independentes

---

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

Nome sugerido: `personal-platform-admin`.

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

> A documentação atual do Next.js exige Node.js 20.9 ou superior. Antes
> de iniciar, confirmar a versão mínima indicada na documentação da
> versão instalada. Recomenda-se utilizar uma versão LTS suportada.

### 4.2 Criar a aplicação Next.js

Executar no diretório em que o projeto deverá ser criado:

```bash
npx create-next-app@latest admin
```

Nas perguntas do instalador, selecionar:

Pergunta Escolha

---

TypeScript? Yes
Linter ESLint
React Compiler No inicialmente; avaliar depois
Tailwind CSS? No
Código dentro de `src/`? Yes
App Router? Yes
Import alias? Yes
Alias `@/*`

Alternativa com opções explícitas, se suportadas pela versão atual do
CLI:

```bash
npx create-next-app@latest admin --ts --eslint --no-tailwind --src-dir --app --import-alias "@/*"
```

Entrar na pasta e iniciar:

```bash
cd admin
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

Os scripts disponíveis podem variar conforme a versão do Next.js e o
linter escolhido. Conferir sempre o `package.json`.

### 4.4 Estrutura inicial do frontend

```text
src/
├── app/
│   ├── (public)/
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

---

Arquivo URL Acesso

---

`app/page.tsx` `/` Redireciona conforme
sessão

`(public)/login/page.tsx` `/login` Público

`(private)/dashboard/page.tsx` `/dashboard` Autenticado

`(private)/studies/page.tsx` `/studies` Autenticado

`(private)/finance/page.tsx` `/finance` Autenticado

`(private)/pdi/page.tsx` `/pdi` Autenticado

`(private)/projects/page.tsx` `/projects` Autenticado

`api/auth/[...nextauth]/route.ts` `/api/auth/*` Auth.js

`api/v1/health/route.ts` `/api/v1/health` Endpoint de diagnóstico
controlado

---

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
(espaçamentos, bordas, tipografia, layout, breakpoints). As **cores** ficam
em CSS custom properties nos arquivos de tema
(`src/styles/themes/_light.scss` e `_dark.scss`), porque mudam com o tema
em tempo de execução. A paleta oficial é a **Dracula**:

```scss
// _light.scss (:root — tema padrão)
:root {
  --background: #fffbeb;
  --card-background: #efeddc;
  --table-background: #efeddc;
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

  --accent-on-selection: #553fab;
}

// _dark.scss — mesmos tokens, ativados por [data-theme="dark"]
[data-theme="dark"] {
  --background: #282a36;
  --card-background: #353747;
  --text-color: #f8f8f2;
  --accent-color: #bd93f9;
  --accent-on-selection: #d9b8ff;
  // ... demais tokens com os valores escuros da paleta
}
```

> **Regra obrigatória:** nenhum componente usa cor fixa (hex, `rgb()`,
> nome). Toda cor vem dos tokens dos dois arquivos de tema. Cor nova =
> token novo nos dois temas. O tema é alternado pelo `ThemeToggle` no
> Header (`data-theme` no `<html>`, persistido em `localStorage`).

### 6.4 Exemplo de mixin

`src/styles/abstracts/_mixins.scss`:

```scss
@mixin respond-to($breakpoint) {
  @if $breakpoint == mobile {
    @media (max-width: 767px) {
      @content;
    }
  }

  @if $breakpoint == tablet {
    @media (max-width: 1023px) {
      @content;
    }
  }
}
```

### 6.5 Exemplo de componente isolado

`Sidebar.module.scss`:

```scss
.sidebar {
  width: 260px;
  min-height: 100vh;
  background: var(--card-background);
  border-right: 1px solid var(--border);
}

.sidebar__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
}

.sidebar__itemActive {
  color: var(--accent-color);
  background: var(--selection-color);
}
```

`Sidebar.tsx`:

```tsx
import styles from "./Sidebar.module.scss";

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <nav aria-label="Navegação principal">
        <a className={styles.sidebar__item} href="/dashboard">
          Dashboard
        </a>
      </nav>
    </aside>
  );
}
```

### 6.6 Importação de Sass compartilhado

Quando um módulo precisar de variáveis ou mixins, utilizar `@use`:

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

### 6.7 Regras de organização

- Não colocar todos os estilos em `globals.scss`.
- Não criar um arquivo global para cada componente.
- Não usar `@import` legado; preferir `@use` e `@forward`.
- Evitar `!important`.
- **Obrigatório:** cores somente via tokens de `src/styles/themes/`
  (paleta Dracula, temas claro e escuro); nunca cor fixa em componente.
- Utilizar variáveis de design para espaçamentos, tipografia e bordas.
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

Componente Uso

---

Dialog Modal e formulários
Alert Dialog Confirmação de ações destrutivas
Dropdown Menu Menu de ações
Select Seleção de opções
Tabs Abas
Tooltip Ajuda contextual
Popover Conteúdo flutuante
Checkbox Seleções
Accordion Conteúdo expansível

### 7.3 Instalação incremental

Instalar apenas os componentes efetivamente utilizados:

```bash
npm install \
  @radix-ui/react-dialog \
  @radix-ui/react-alert-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-select \
  @radix-ui/react-tabs \
  @radix-ui/react-tooltip \
  @radix-ui/react-popover \
  @radix-ui/react-checkbox
```

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
    service: "personal-platform-api",
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

---

Necessidade Recurso

---

Carregar dados de uma página no Server Component + serviço
servidor

Criar registro por formulário Server Action
interno

API consumida por aplicação externa Route Handler

Receber webhook Route Handler

Expor endpoint de consulta Route Handler

Atualizar dados por interação Server Action, quando adequada
interna

---

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

---

## 10. Rotas de API planejadas

Adotar prefixo `/api/v1` para APIs de negócio. A rota `/api/auth/*`
pertence ao Auth.js e não precisa receber o prefixo de versão.

### 10.1 Endpoints iniciais

---

Método Endpoint Objetivo Proteção

---

GET `/api/v1/health` Diagnóstico Pública, sem
básico dados sensíveis

GET `/api/v1/me` Dados do usuário Sessão
autenticado obrigatória

GET `/api/v1/projects` Listar projetos Sessão
obrigatória

POST `/api/v1/projects` Criar projeto Sessão +
autorização

GET `/api/v1/projects/:id` Consultar projeto Sessão +
propriedade

PATCH `/api/v1/projects/:id` Atualizar projeto Sessão +
propriedade

DELETE `/api/v1/projects/:id` Excluir projeto Sessão +
propriedade

GET `/api/v1/finance/transactions` Listar Sessão +
lançamentos autorização

POST `/api/v1/finance/transactions` Criar lançamento Sessão +
autorização

GET `/api/v1/pdi/goals` Listar metas Sessão +
autorização

POST `/api/v1/pdi/goals` Criar meta Sessão +
autorização

---

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

---

# PARTE IV --- AUTENTICAÇÃO E AUTORIZAÇÃO

## 11. Auth.js

**Objetivo:** implementar login, sessão e integração com o Next.js.

Documentação: <https://authjs.dev/>

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
   - Nome: `personal-platform`.
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

---

Serviço Porta Observação

---

Next.js local 3000 Aplicação web

PostgreSQL local 5432 Porta padrão do
Postgres

Supabase pooler 6543 Conexão compartilhada
transaction transaction

Supabase pooler 5432 Conexão compartilhada
session session

---

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

### 12.5 Testar a conexão

A conexão será validada pelo Prisma, depois de configurado o ORM. Não
expor uma rota pública que retorne a string de conexão ou informações
sensíveis do banco.

Criar um endpoint de health check que retorne apenas o estado geral, sem
credenciais ou dados internos.

---

## 13. Modelagem de dados e Draw.io

Antes de criar tabelas definitivas, levantar os dados de cada módulo e
seus relacionamentos.

### 13.1 Primeiras entidades candidatas

---

Domínio Entidade Finalidade

---

Identidade User Conta de usuário

Identidade Account Contas OAuth, se forem
adotadas

Identidade Session Sessões persistidas, se
adotadas

Projetos Project Projetos cadastrados

Projetos ProjectLink Links relacionados a um
projeto, se necessário

PDI Goal Metas profissionais

PDI ActionItem Ações de uma meta

Financeiro Transaction Receitas e despesas

Financeiro Category Categorias financeiras

---

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
npm install @prisma/client @prisma/adapter-pg pg
npm install -D prisma dotenv
```

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
5. Gerar o Prisma Client.
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

Criar configuração:

```bash
npx create-jest@latest
```

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

### 16.5 Tipos de testes

Tipo Ferramenta

---

Funções e utilitários Jest
Componentes React síncronos Jest + Testing Library
Hooks Jest + Testing Library
Schemas Zod Jest
Serviços e regras de negócio Jest
Fluxo completo de login Playwright
Navegação e acesso aos módulos Playwright
Testes de integração com banco Jest + banco de teste isolado
Async Server Components E2E com Playwright, quando apropriado

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
6. Confirmar o diretório raiz `admin` se o repositório for um monorepo
   com a aplicação nessa pasta. Se o repositório contiver diretamente o
   Next.js, utilizar a raiz padrão.
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
AUTH_SECRET=
AUTH_URL=

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

# PARTE X --- DOCAUMENTAÇÃO E APLICAÇÕES INDEPENDENTES

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
personal-platform-admin/
│
├── docs/
│   ├── architecture/
│   │   ├── ARCHITECTURE.md
│   │   ├── system-context.drawio
│   │   ├── application-components.drawio
│   │   ├── database-erd.drawio
│   │   └── deployment.drawio
│   │
│   ├── setup/
│   │   ├── FRONTEND.md
│   │   ├── BACKEND.md
│   │   ├── AUTHENTICATION.md
│   │   ├── DATABASE.md
│   │   └── TESTING.md
│   │
│   └── decisions/
│       └── ADR-001-modular-monolith.md
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
├── .gitignore
├── docker-compose.yml
├── jest.config.ts
├── jest.setup.ts
├── next.config.ts
├── package.json
├── prisma.config.ts
├── tsconfig.json
└── README.md
```

Observações:

- `.env.local` deve existir localmente, mas nunca ser commitado.
- `.env.example` contém somente nomes de variáveis e valores
  fictícios/vazios.
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
- [ ] Criar seed controlado.

**Critério de conclusão:** aplicação consegue consultar o banco de
desenvolvimento pelo servidor.

### Fase 3 --- Autenticação e autorização

- [ ] Instalar Auth.js.
- [ ] Configurar Credentials Provider.
- [ ] Criar usuário administrador.
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
implementação de todos os módulos.

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

---

ID Decisão Justificativa Status

---

ADR-001 Monólito modular Reduz Adotada
complexidade  
 inicial e mantém  
 separação de  
 domínios

ADR-002 Next.js App Fullstack React e Adotada
Router aprendizado do  
 ecossistema

ADR-003 TypeScript strict Segurança de Adotada
tipos e  
 manutenção

ADR-004 SCSS Modules Estilos isolados Adotada
e controle visual

ADR-005 Radix UI + Lucide Acessibilidade e Adotada
identidade visual
própria

ADR-006 Auth.js Login inicial de Proposta a
Credentials + JWT administradora implementar

ADR-007 PostgreSQL + Persistência Adotada
Prisma relacional e  
 tipagem

ADR-008 Supabase Free PostgreSQL Proposta a
gerenciado para validar
início

ADR-009 Zod Validação Adotada
compartilhada

ADR-010 Jest + Playwright Testes unitários, Adotada
componentes e E2E

ADR-011 Vercel Hobby Deploy pessoal Proposta a
inicial validar

ADR-012 Arquitetura Módulos Adotada
híbrida integrados ou  
 independentes  
 conforme  
 necessidade

---

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
