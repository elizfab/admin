# T-0011 — Formatação automática com Prettier (sem diff de indentação nos merges)

| Campo | Valor |
|---|---|
| Tipo | infra |
| Módulos | plataforma (CI, ferramentas) |
| Tamanho | M |
| Tier | @coding-3 |
| Estado (Kanban) | Em desenvolvimento |
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
| G2 Testes vermelhos | ⬜ | |
| G3 Pipeline verde | ⬜ | |
| G4 Review | ⬜ | `review.md` |
| G5 QA | ⬜ | `qa-gate.md` |
| G6 Registro | ⬜ | CHANGELOG, implementations |

## Handoffs

### Handoff: Orchestrator → Analyst → PM → Architect → SM (2026-11-19)
- Feito: classificação, análise do código atual, spec/proposal, plano e tarefas desta pasta.
- Decidido: ver G1 acima.
- Próximo passo: Tester (testes vermelhos) → @coding.
