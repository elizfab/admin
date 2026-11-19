# Changelog

Mudanças relevantes do Admin (Personal Platform). Formato próximo do
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/): cada entrada cita a
tarefa (`T-NNNN`) quando houver. No deploy, a seção `[Não publicado]` vira a data.

## [Não publicado]

### Adicionado

- Time de agentes BMAD (`.agents/`, `.claude/agents/`, `AGENTS.md`, `CLAUDE.md`,
  `WIP.md`), registro de regras validadas por módulo (`docs/implementations/`) e
  economia de tokens com o Graphify (`docs/agents/`, `.graphifyignore`).
- T-0006: Danger em todo PR (`dangerfile.ts`, `.github/workflows/danger.yml`) e
  **PR automático** para a `develop` a cada push em `feature/*`
  (`.github/workflows/auto-pr.yml`); regra de branches única em `scripts/branch-rules.ts`.
- T-0005: `docs/CHANGELOG.md` (este arquivo) com o histórico das fases.

### Alterado

- T-0006: fluxo de branches passa a aceitar **só** `feature/<slug>` → `develop` → `main`
  (`.agents/project-context.md`, seção 9). A CI ganhou o gatilho `workflow_call`.
- T-0005: a decisão do Portal Dev passa a ser a **ADR-013** (era "ADR-007", número já
  usado por "PostgreSQL + Prisma" no `ARCHITECTURE.md`).

### Corrigido

- T-0005: `docs/decisions/ADR-006-autenticacao-better-auth.md` volta a conter o ADR-006
  (Better Auth), sobrescrito por engano em 18/11/2026.
- T-0005: URL de produção em `VERCEL-ENV.md` (`admin-elizabetefabri.vercel.app`).
- T-0005: exemplo de `graphify path` e nome de branch em `docs/agents/`.

## [2026-11-18] Financeiro → Obra (Fase 09)

### Adicionado

- Obras com fases, ambientes, serviços contratados, pagamentos, compras parceladas e
  metas; dashboard e evolução por fase; API REST e telas.
- Pagamento e parcela paga geram o lançamento "Obra" no Financeiro no mesmo
  `$transaction` (regras `OBRA-R01` a `OBRA-R17`).
- Importação da planilha da obra, E2E e acessibilidade.
- Guias do Portal Dev (Fase 07) e a decisão do Portal Dev protegido (hoje ADR-013).

## [2026-11-17] Financeiro (Fase 07)

### Adicionado

- Modelo `Transaction`, utilitários de dinheiro (centavos) e de mês, schemas, repositório,
  serviço, API REST, Server Actions e telas (regras `FIN-R01` a `FIN-R10`).
- Financeiro e Projetos na navegação e no dashboard.

## [2026-11-15] Identidade visual e guias da Vercel

### Adicionado

- Identidade visual na tela de login e favicon; README com status, stack e comandos; guias Vercel.

### Corrigido

- Domínio de preview para `admin-elizabetefabri.vercel.app`.

## [2026-11-14] Testes E2E, integração e deploy (Fases 05 e 06)

### Adicionado

- Playwright (autenticação, navegação, CRUD de projetos, isolamento entre usuárias, axe nos
  dois temas) e testes de integração contra o PostgreSQL real.
- Headers de segurança, validação de variáveis no build, preparo para a Vercel e CI no GitHub Actions.

### Corrigido

- Contraste de texto selecionado nos dois temas; `/projects` no `matcher` do proxy;
  detecção do erro P2002 em `isUniqueConstraintError`.

## [2026-11-13] Backend e Projetos (Fase 04)

### Adicionado

- Padrão de erros e respostas da API, repositório com isolamento por dona, serviço,
  endpoints REST, Server Actions e telas de Projetos; componentes `Button`, `AlertDialog`, `PageHeader`.

## [2026-11-12] Autenticação (Fase 03)

### Adicionado

- Better Auth (ADR-006): tabelas, rotas, seed da administradora, layout privado com sessão
  validada no servidor, login, logout, proxy e `/api/v1/me`.
- Paleta Dracula com temas claro/escuro e `ThemeToggle`.

## [2026-11-11] Fundação (Fases 00 a 02)

### Adicionado

- Next.js com TypeScript, ESLint e App Router; Sass com tokens; Radix UI e Lucide; layout
  privado; dashboard mockado; Jest.
- PostgreSQL local com Docker, Prisma 7, migration inicial, Prisma Client e health check.
