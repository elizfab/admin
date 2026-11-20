# AGENTS.md: Admin (Personal Platform)

> Instruções para **qualquer** agente de IA (Claude Code, GitHub Copilot, Devin…).
> Mantenha este arquivo **abaixo de 16 KB** (o Devin só lê os primeiros 16 KB):
> detalhes ficam em `.agents/`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Projeto em uma frase

Portal administrativo pessoal (Next.js 16 + React 19 + TypeScript strict, Prisma 7 +
PostgreSQL, Better Auth, Zod 4, SCSS com tokens, Jest + Playwright) com os módulos
Projetos, Dashboard (cards no banco), Financeiro e Financeiro → Construção (obras e reformas). Produção: <https://admin-elizabetefabri.vercel.app/>.

## Leia antes de trabalhar

1. **[`.agents/project-context.md`](.agents/project-context.md):** stack, camadas, **regras invioláveis R1–R17**, API, comandos.
2. **[`.agents/workflow.md`](.agents/workflow.md):** ciclo BMAD, Spec Kit × OpenSpec, TDD/BDD, Kanban, gates e tiers.
3. **O seu papel:** `.agents/<agente>.behaviour.md` (lista em [`.agents/README.md`](.agents/README.md)).
4. **Regras já validadas do módulo que você vai tocar:** `docs/implementations/<modulo>.md`. **Não altere** uma regra dali sem `proposal.md` aprovado.

## Regras que não podem ser quebradas (resumo)

- **R1/R2** Toda consulta filtra pela dona da **sessão**; recurso alheio = 404; `ownerId` nunca vem do cliente.
- **R3/R4** Dinheiro em centavos inteiros; datas sem hora em `@db.Date` (UTC); "hoje" no fuso de São Paulo.
- **R5** Totais, saldos e status são calculados, nunca gravados.
- **R6/R7** Zod antes do serviço; `update` parcial **sem** default.
- **R8/R9** Sessão validada no servidor; rota privada no `matcher` do `src/proxy.ts`.
- **R10/R11** Sem cor fixa (tokens nos dois temas); acessibilidade WCAG AA.
- **R12** Lançamento gerado pela Construção (obra) só muda pela obra de origem.
- **R13** `redirect()` fora do `try/catch` nas Server Actions.
- **R14/R15** Nenhum segredo no repositório; migration destrutiva só com ADR e aprovação.
- **R16** Cobertura ≥ 95% (linhas, comandos, ramos, funções) em todo arquivo novo ou alterado de `src/lib`, `src/modules`, `src/components`; o total não cai.
- **R17** Código no formato do Prettier (o pre-commit formata; a CI confere).

## Fluxo de toda mudança

```text
Orchestrator → Analyst → PM (spec/proposal, aprovação da Liza) → Architect (plan + tier)
→ Scrum Master (tasks, WIP.md) → Tester (testes vermelhos, plano para ≥ 95%) → @coding-1|2|3 (verde, cobertura ok)
→ Code Review → QA (gate) → DevOps (deploy) → Documentation (CHANGELOG, implementations)
```

- Estado das tarefas: [`WIP.md`](WIP.md) · pasta de cada tarefa: `.agents/tasks/T-NNNN-<slug>/`.
- **Tier de implementação:** `@coding-1` (≤ 3 arquivos, sem regra crítica) · `@coding-2` (um módulo) · `@coding-3` (transversal, dinheiro + atomicidade, auth, migration destrutiva, CI). Encontrou algo acima do seu tier: **pare e escale**.

## Antes de dizer "pronto"

```bash
npm run typecheck && npm run format:check && npm run lint && npm test && npm run test:e2e && npm run test:coverage && npm run coverage:check
```

`test:coverage` e `test:integration` precisam do banco de teste (`npm run db:up`; o E2E migra o `admin_test`).
Relatório: `coverage/lcov-report/index.html`.

E atualize `WIP.md`, `docs/CHANGELOG.md` e, se mudou uma regra, `docs/implementations/<modulo>.md`.

## Economia de tokens

- Se `graphify-out/GRAPH_REPORT.md` existir, **leia-o antes de buscar arquivos** e use
  `graphify query|path|explain` para localizar código. Guia: [`docs/agents/graphify.md`](docs/agents/graphify.md).
- Nunca leia `node_modules/`, `.next/`, `src/generated/`, `package-lock.json`, relatórios de teste.
- Mais regras: [`.agents/token-economy.md`](.agents/token-economy.md).

## Idioma

Código, nomes de arquivos, rotas e commits em inglês técnico (`feat(finance): …` com descrição em
português). Textos de tela, mensagens de erro, comentários e documentação em **português**.

## REGRA: Design tokens e temas (⚠️ obrigatório)

- **Nunca** usar cores fixas (hex, `rgb()`, nomes) em componentes ou estilos:
  sempre usar as CSS custom properties definidas em `src/styles/themes/`.
- A paleta do projeto é a **Dracula** (clara e escura). Os tokens vivem em
  `src/styles/themes/_light.scss` (`:root`, tema padrão) e
  `_dark.scss` (`[data-theme="dark"]`).
- O tema é alternado pelo `ThemeToggle` no Header, persistido em
  `localStorage["theme"]` e aplicado antes da pintura por script inline no
  `src/app/layout.tsx`. Não alterar esse mecanismo.
- Precisa de uma cor nova? Adicionar o token nos **dois** arquivos de tema
  (claro e escuro) antes de usar — nunca criar variável local em um módulo.
- Tokens semânticos derivados (ex.: `--accent-color-hover`) usam
  `color-mix()` sobre os tokens da paleta.
- Qualquer alteração de paleta, nome de token ou comportamento de tema
  exige atualização das docs em `docs/` que citam os tokens.
