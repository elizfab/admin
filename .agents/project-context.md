# Contexto do projeto: Admin (Personal Platform)

> Fonte única de verdade técnica para **todos** os agentes. Leia as seções que a
> sua tarefa toca; não releia o arquivo inteiro a cada mensagem.
> Detalhes e o "porquê" de cada regra: `docs/architecture/ARCHITECTURE.md`,
> `docs/decisions/` (ADRs) e `docs/implementations/` (regras já validadas).

## 1. O produto

Portal administrativo **pessoal e privado** da Liza (uma única administradora,
contas extras só para testes de isolamento). Módulos atuais:

| Módulo | Rotas de tela | API | Estado |
|---|---|---|---|
| Autenticação | `/login` | `/api/auth/*` (Better Auth), `/api/v1/me` | Produção |
| Dashboard | `/dashboard` | `/api/v1/dashboard/modules` | Produção (cards no banco, cadastrados pelo modal: T-0007) |
| Projetos | `/projects`, `/projects/new`, `/projects/[id]/edit` | `/api/v1/projects` | Produção |
| Financeiro | `/finance`, `/finance/transactions/*` | `/api/v1/finance/transactions`, `/summary` | Produção |
| Financeiro → Construção (antes "Obra") | `/finance/construction` (lista de obras em grid + "Nova obra"), `/finance/construction/[projectId]/*` | `/api/v1/finance/construction/*` | Produção |
| Documentação / Estudos | `/documentation`, `/studies` | — | Em espera ("Em breve") |
| Próximos | PDI, Release Control | — | Backlog (`docs/todo.md`) |

Produção: <https://admin-elizabetefabri.vercel.app/> · Repositório público: `elizfab/admin`.

## 2. Stack (versões fixadas: não atualize major sem ADR)

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 16.4** (App Router, `proxy.ts`, `next typegen`, `params`/`searchParams` assíncronos) · **React 19.3** |
| Linguagem | TypeScript `strict` |
| Estilo | SCSS Modules + tokens de tema (paleta Dracula, claro/escuro) |
| UI | `radix-ui`, `lucide-react` |
| Banco | PostgreSQL 16 (Docker local; Supabase em produção) · **Prisma 7** (`prisma7.config.ts`, `@prisma/adapter-pg`, client em `src/generated/prisma`) |
| Auth | **Better Auth 1.7** (e-mail/senha, `disableSignUp`, sessões no banco, rate limit no banco, `nextCookies`) |
| Validação | **Zod 4** |
| Testes | Jest + RTL (unitário) · Jest + banco real (integração) · Playwright 1.65 + `@axe-core/playwright` (E2E e a11y) |
| Deploy | Vercel (`gru1`; `main` → produção, demais branches → preview) · GitHub Actions |
| Node | ≥ 20.19 (`.nvmrc`) |

⚠️ **Next.js 16 não é o Next.js do seu treinamento.** Antes de usar uma API do
Next, confira `node_modules/next/dist/docs/` (bloco `nextjs-agent-rules` do `AGENTS.md`).
⚠️ O CLI do Prisma sugere `prisma@latest` (8.x RC): **ignore**. O projeto fica no `@7`.

## 3. Arquitetura (camadas e direção das dependências)

```text
app/(private)/<rota>/page.tsx ─┐          app/api/v1/<recurso>/route.ts ─┐
     (Server Components)        │                (Route Handlers)        │
modules/<m>/actions/*.actions.ts┤  (Server Actions)                      │
                                ▼                                        ▼
                    modules/<m>/services/*.service.ts   ← REGRAS DE NEGÓCIO
                                ▼
                    modules/<m>/repositories/*.repository.ts ← PRISMA (sempre com dona)
                                ▼
                          lib/db/prisma.ts → PostgreSQL
```

- **Tela e API são duas portas para o mesmo serviço.** Regra nunca fica na action nem no route handler.
- Módulo expõe `index.ts` (schemas, tipos, regras puras: **seguro no navegador**) e
  `server.ts` (`import "server-only"`: serviços). Client Component **nunca** importa `server.ts`.
- Escrita em **duas ou mais tabelas** = `prisma.$transaction` no serviço (ex.: pagamento da obra + lançamento no Financeiro).
- Regras puras (sem banco) ficam em `modules/<m>/rules/` e são testadas sem dublês.
- Utilitários genéricos: `lib/money` (centavos), `lib/dates/month` (mês, fuso, datas sem hora),
  `lib/errors/app-error` (erros com status), `lib/http/api-response` (`ok`, `created`, `noContent`, `apiError`, `readJson`),
  `lib/validations/common.schema` (`idSchema`, `toFieldErrors`, `emptyToNull`), `lib/auth/session` (`getSession`, `requireSession`, `requireApiSession`, `requireRole`).

### Estrutura de um módulo (template)

```text
src/modules/<m>/
├── index.ts · server.ts
├── types/      schemas/      rules/ (opcional)
├── repositories/             services/
├── actions/                  components/<Nome>/<Nome>.tsx + .module.scss
```

## 4. Regras invioláveis (quebrar qualquer uma = bloqueio no Code Review)

| # | Regra | Onde é garantida |
|---|---|---|
| R1 | **Isolamento por dona:** toda leitura/escrita filtra por `ownerId` da **sessão** (ou pela relação com a entidade que tem `ownerId`, ex.: `project: { ownerId }`). Recurso alheio = **404**, nunca 403 | Repositórios; E2E `isolation.spec.ts` |
| R2 | `ownerId` **nunca** vem do corpo da requisição nem do formulário | Actions e route handlers |
| R3 | **Dinheiro em centavos inteiros** (`Int`), nunca float nem `Decimal`; formatação só na tela (`formatCents`) | `lib/money`; schemas |
| R4 | **Datas sem hora** = `@db.Date` à meia-noite UTC; exibir com `formatDay` (UTC); "hoje"/"mês atual" no fuso `America/Sao_Paulo` | `lib/dates/month` |
| R5 | Valores **derivados** (total pago, falta, status, resumo) são **calculados**, nunca gravados | Serviços |
| R6 | Toda entrada passa por **Zod** antes do serviço; mensagens em português | `schemas/` |
| R7 | `create` com `.default()`; `update` = `.partial()` **sem** default + `refine` (corpo não vazio) | `schemas/` |
| R8 | Sessão validada no **servidor** (`requireSession`/`requireApiSession`); o proxy é só a 1ª barreira (cookie existe?) | `lib/auth/session`; `src/proxy.ts` |
| R9 | Rota privada nova entra no `matcher` de `src/proxy.ts` | Checklist de registro |
| R10 | **Tokens de tema:** nenhuma cor fixa (hex, `rgb()`, nome) em componente; cor nova = token nos **dois** temas (`_light.scss` e `_dark.scss`) | `AGENTS.md`; axe nos dois temas |
| R11 | Acessibilidade WCAG AA: labels, `aria-invalid`/`aria-describedby`, cor nunca é a única pista, `<table>` para dados tabulares | `accessibility.spec.ts` (claro e escuro) |
| R12 | Lançamento do Financeiro **gerado pela Construção** (pagamento/parcela de uma obra) só muda pela obra (Financeiro responde 409) | `transaction.service.ts` |
| R13 | `redirect()` **fora** do `try/catch` nas Server Actions; action devolve `values` no erro (React 19 limpa o form) | Actions |
| R14 | Segredos só em variáveis de ambiente; nada de segredo em código, docs, logs ou testes (exceto os fictícios de teste) | `required-env.ts`; Code Review |
| R15 | Migration **aditiva** por padrão; destrutiva exige ADR, plano de dados e aprovação humana | Architect + DevOps |
| R16 | **Cobertura ≥ 95%** (linhas, comandos, ramos e funções) em todo arquivo **novo ou alterado** de `src/lib`, `src/modules` e `src/components`; o **total não cai** abaixo de `coverage-baseline.json`. `src/app/**` é provado pelo E2E | `npm run coverage:check` (CI); QA no G5 |
| R17 | Código no formato do **Prettier** (`.prettierrc.json`); commits só de formatação vão para `.git-blame-ignore-revs` | pre-commit (lint-staged); `format:check` (CI) |

## 5. Contrato da API (`/api/v1`)

- Sucesso: `{ "data": ... }` (200/201) ou 204 sem corpo. Erro: `{ "error": { "code", "message", "fieldErrors"? } }`.
- Códigos: `VALIDATION_ERROR` 400 · `UNAUTHORIZED` 401 · `NOT_FOUND` 404 · `CONFLICT` 409.
- URL em inglês, recurso no plural: `/api/v1/<modulo>/<recursos>`, `/<recursos>/:id`. Criação/listagem
  dentro de um pai leva o id do pai (`/projects/:projectId/services`).
- Ids validados com `idSchema` (cuid). `?month=AAAA-MM` → `readMonthParam` (400 se inválido).
- Mutação pela API envia `Origin` do próprio site (os E2E usam `headers: { Origin: E2E_BASE_URL }`).

## 6. Frontend (skills obrigatórias)

- Server Components por padrão; `"use client"` só com estado/efeito/evento.
- Formulários: `useActionState` + Server Action; `noValidate`; erro por campo com `aria-describedby`.
- Links para páginas do Next: `<Link>`; para rotas que **não** são páginas (Route Handler que devolve HTML): `<a>`.
- Estado de filtro/navegação na **URL** (`?month=`, `?phaseId=`), não em `useState`.
- Dinheiro no form: `<input inputMode="decimal">` (nunca `type="number"`); data: `type="date"`.
- SCSS: `@use "@/styles/abstracts" as *;` (`$space-*`, `$font-size-*`, `$radius-*`, `up("md")`, `focus-ring`, `visually-hidden`).
- Ícones Lucide com `aria-hidden="true"`; botão só com ícone exige `aria-label`.
- **Um componente = uma pasta** (`<Nome>/`), cada responsabilidade num arquivo (modelo: `src/components/layout/Header/`, T-0019):

  | Arquivo | Responsabilidade |
  |---|---|
  | `<Nome>.tsx` | Só renderizar (JSX, ícones, acessibilidade) |
  | `<Nome>.module.scss` | Estilos **deste** componente (nunca no SCSS do pai) |
  | `<Nome>.types.ts` | Props e tipos (fora da meta de cobertura: não tem código) |
  | `<assunto>.constants.ts` | Constantes (chaves, rótulos, tamanhos) |
  | `<assunto>.utils.ts` | Funções puras ou de acesso ao navegador, sem React |
  | `use<Assunto>.ts` | Hook que liga o React à lógica/estado |
  | Subcomponente | Pasta própria dentro do pai (ex.: `Header/ThemeToggle/`, `Header/UserMenu/`) |

  Testes continuam em `tests/unit/**`, espelhando a pasta (ex.: `tests/unit/components/layout/Header/`).

## 7. Comandos

| Objetivo | Comando |
|---|---|
| Banco local | `npm run db:up` |
| Dev | `npm run dev` (porta 3000) |
| Migration nova | `npx prisma migrate dev --name <nome>` **+** `npm run db:generate` (Prisma 7 não gera sozinho) |
| Pipeline (ordem do CI) | `npm run typecheck && npm run format:check && npm run lint && npm test && npm run test:e2e && npm run test:coverage && npm run coverage:check` |
| Cobertura | `npm run test:coverage` (unitários + integração; relatório em `coverage/lcov-report/index.html`) → `npm run coverage:check`. Subiu de propósito: `npm run coverage:baseline` |
| Formatar | `npm run format` (o pre-commit já formata os arquivos do commit) |
| Unitários com a tabela de cobertura | `npm test` (tabela arquivo a arquivo só dos unitários; a meta R16 usa `test:coverage`, que soma a integração) |
| Um teste | `npx jest <caminho>` (com cobertura do arquivo: `npx jest <caminho> --coverage --collectCoverageFrom=<arquivo de src>`) · `npx playwright test <arquivo> --retries=0` |
| Banco de teste atualizado (integração) | `DATABASE_URL=…/admin_test DIRECT_URL=…/admin_test npx prisma migrate deploy` |

## 8. Testes (o que cada nível prova)

| Nível | Pasta | Prova |
|---|---|---|
| Unitário | `tests/unit/**` | Regras puras, schemas, serviços com repositório dublado, componentes |
| Integração | `tests/integration/**` | Repositórios e serviços contra o PostgreSQL real (`admin_test`): filtros, somas, `$transaction` |
| E2E | `tests/e2e/*.spec.ts` | Fluxos reais pelo navegador, isolamento entre usuárias, contratos HTTP |
| A11y | `tests/e2e/accessibility.spec.ts` | axe sem violações nas telas, **nos dois temas** |

Regras: teste E2E não depende de outro (cada um cria/limpa os próprios dados); `workers: 1`;
retries do CI não podem mudar o resultado (`--repeat-each=3` passa).
**Cobertura (R16):** a meta vale para o que o Jest mede (unitários + integração). Página e route handler
(`src/app/**`) ficam fora da porcentagem, mas todo cenário deles precisa de E2E (rastreabilidade no QA).

## 9. Git e entrega

- Branches: `main` (produção) ← `develop` ← **`feature/<slug>`** (único tipo aceito; minúsculas, ex.: `feature/t-0007-filtro-categoria`).
  Regra em `scripts/branch-rules.ts`, validada pelo Danger em todo PR.
- PR automático: o `git push` de uma `feature/*` abre sozinho o PR para a `develop` (`.github/workflows/auto-pr.yml`); não abra à mão.
- Commits: Conventional Commits em português (`feat(finance): …`, `fix(obra): …`).
- PR para `develop` com CI e Danger verdes; `develop → main` para produção (Danger recusa outra origem na `main`).
- PR de release automático: cada merge na `develop` abre (ou atualiza) o PR `develop → main` (`.github/workflows/release-pr.yml`). O **merge na `main` é manual** (DevOps + Liza). Nesse PR a cobertura confere só o total (os arquivos já passaram nos PRs das features).
- Toda entrega atualiza: `WIP.md`, `docs/CHANGELOG.md`, `docs/implementations/<modulo>.md` (se mudou regra) e, se mudou decisão, um ADR.

## 10. Documentação do projeto

| Pasta | Conteúdo |
|---|---|
| `docs/setup/NN-*/` | Passo a passo por fase (modelo em `docs/setup/MODELO-DE-PASSO.md`) |
| `docs/architecture/ARCHITECTURE.md` | Arquitetura completa |
| `docs/decisions/ADR-NNN-*.md` | Decisões |
| `docs/implementations/` | **Registro de regras já validadas** por módulo (antirregressão) |
| `docs/CHANGELOG.md` | Histórico de mudanças |
| `WIP.md` | Quadro Kanban do trabalho em andamento |
| `.agents/` | Agentes, fluxo e tarefas |
