# T-0009 — Botão "Voltar ao início" nas páginas de módulo

| Campo | Valor |
|---|---|
| Tipo | change |
| Módulos | plataforma (componente compartilhado), finance, construction, projects, studies |
| Tamanho | P |
| Tier | @coding-1 |
| Estado (Kanban) | Em desenvolvimento |
| Criada em | 2026-11-19 |
| Branch / PR | `feature/t-0007-dashboard-financeiro-cobertura` · PR automático no push |

## Pedido (palavras da Liza)

> Adicione o btn-voltar em /finance/construction, /studies, /projetos e financeiro, para voltar para home.

## Aprovação da spec (Gate G1)

- [x] Aprovado pela Liza em 2026-11-19 (respostas na sessão: cobertura 95% no código novo; Prettier com commit único; aba "Transações"; cards com cadastrar, editar e excluir).

## Análise (Analyst, 2026-11-19)
**Situação atual:** nenhuma dessas páginas tem link de volta; "home" = `/dashboard` (a raiz `/` redireciona para lá).
**Regras validadas tocadas:** nenhuma. **Regras em jogo:** R10, R11.

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
