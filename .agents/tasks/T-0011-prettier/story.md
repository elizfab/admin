# T-0011 — Formatação automática com Prettier (sem diff de indentação nos merges)

| Campo | Valor |
|---|---|
| Tipo | infra |
| Módulos | plataforma (CI, ferramentas) |
| Tamanho | M |
| Tier | @coding-3 |
| Estado (Kanban) | Code Review (aguardando o PR) |
| Criada em | 2026-11-19 |
| Branch / PR | `feature/t-0007-dashboard-financeiro-cobertura` · PR automático no push |

## Pedido (palavras da Liza)

> Ao implementar na pipe, você se encarregou de adicionar a execução do lint removendo diff e tal? Porque fica com muito arquivo ao fazer o merge e isso é inapropriado; às vezes só mudou a indentação.

## Aprovação da spec (Gate G1)

- [x] Aprovado pela Liza em 2026-11-19 (respostas na sessão: cobertura 95% no código novo; Prettier com commit único; aba "Transações"; cards com cadastrar, editar e excluir).

## Análise (Analyst, 2026-11-19)
**Situação atual:** sem Prettier; a CI só roda `eslint` (não formata). Estilo atual: 4 espaços em TS/TSX, 2 em SCSS/JSON/YAML, linhas até ~100.
**Medição:** com `printWidth 100` e `tabWidth 4`, 74 arquivos mudariam (uma vez).

## Gates

| Gate | Estado | Evidência |
|---|---|---|
| G1 Spec | ✅ | Acima |
| G2 Testes vermelhos | ✅ | Testes escritos antes do código, falharam por "módulo não existe" |
| G3 Pipeline verde | ✅ | typecheck, format, lint, 200 unit, 55 E2E, 226 Jest com cobertura, coverage:check (2026-11-19) |
| G4 Review | ✅ (agente) · ⬜ (PR) | `review.md` |
| G5 QA | ✅ PASS | `qa-gate.md` |
| G6 Registro | ✅ | `docs/CHANGELOG.md`, `docs/implementations/` |

## Handoffs

### Handoff: Orchestrator → Analyst → PM → Architect → SM (2026-11-19)
- Feito: classificação, análise do código atual, spec/proposal, plano e tarefas desta pasta.
- Decidido: ver G1 acima.
- Próximo passo: Tester (testes vermelhos) → @coding.

### Handoff: @coding → Code Review → QA → Documentation (2026-11-19)
- Feito: implementação com TDD; pipeline completo verde; review.md e qa-gate.md nesta pasta; regras novas registradas em `docs/implementations/`.
- Pendente / riscos: ver "Riscos residuais" no `qa-gate.md`; revisão humana no PR.
- Próximo passo: `git push` (o PR para a develop abre sozinho) → DevOps.
