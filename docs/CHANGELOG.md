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
- T-0007: cards do Dashboard no banco (tabela `dashboard_module`), com botão "Novo card"
  e modal para cadastrar, editar e excluir; API `/api/v1/dashboard/modules`; os 3 cards
  atuais viram dados iniciais (migration para contas existentes, seed para contas novas).
- T-0008: Financeiro em abas **Transações | Obra** (FIN-R11).
- T-0009: "Voltar ao início" em `/finance`, `/finance/construction`, `/projects` e `/studies` (PLAT-R16).
- T-0010: cobertura de testes na CI: unitários + integração somados, ≥ 95% em todo arquivo
  novo/alterado e total sem queda (`npm run test:coverage`, `coverage:check`; PLAT-R17).
- T-0011: Prettier com formatação no pre-commit e conferência na CI (PLAT-R18).
- T-0016: **PR de release automático**: cada merge na `develop` abre (ou atualiza) o PR
  `develop → main` com a lista do que entra e o checklist de deploy (`release-pr.yml`).
- T-0018: `npm test` mostra a tabela de cobertura dos unitários (escopo em `jest.coverage-scope.mjs`).
- T-0019: testes do Header (`Header`, `ThemeToggle`, `useTheme`, `theme.utils`, `UserMenu`, `useSignOut`):
  de 0% para 100% de cobertura em `Header.tsx` e `UserMenu.tsx`.

### Alterado

- T-0007: os rótulos de status do card ("Disponível", "Aplicação externa", "Em breve") saem
  do `ModuleCard` e vão para `dashboardModuleStatusLabel` (tipos do módulo).
- T-0008: "Obra" e "Nova transação" saem do cabeçalho do Financeiro.
- T-0019: Header reorganizado, um componente por pasta e cada responsabilidade num arquivo:
  `ThemeToggle/` (`theme.constants.ts`, `theme.types.ts`, `theme.utils.ts`, `useTheme.ts`,
  `ThemeToggle.tsx`) e `UserMenu/` (`UserMenu.tsx`, `UserMenu.types.ts`, `useSignOut.ts`), cada um
  com o seu SCSS; o `Header.module.scss` fica só com os estilos do Header. Sem mudança visual.
- T-0019: arquivos só de tipos (`*.types.ts`) saem da meta de cobertura, como as pastas `types/`.
- T-0017: `ALTERACOES-2026-11-15.md` sai da raiz para
  `docs/setup/06-setup-deploy/registros/2026-11-15-identidade-visual-e-vercel.md`.
- T-0011: código inteiro formatado uma vez com o Prettier (commit `5ba40ff`, ignorado no blame).
- T-0006: fluxo de branches passa a aceitar **só** `feature/<slug>` → `develop` → `main`
  (`.agents/project-context.md`, seção 9). A CI ganhou o gatilho `workflow_call`.
- T-0005: a decisão do Portal Dev passa a ser a **ADR-013** (era "ADR-007", número já
  usado por "PostgreSQL + Prisma" no `ARCHITECTURE.md`).

### Removido

- T-0007: `src/modules/dashboard/data/modules.mock.ts` (os cards agora vêm do banco).

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
