# T-0010 — Cobertura de testes na CI (≥ 95% no código novo, total não cai)

| Campo | Valor |
|---|---|
| Tipo | infra |
| Módulos | plataforma (CI, testes, agentes) |
| Tamanho | M |
| Tier | @coding-3 |
| Estado (Kanban) | Em desenvolvimento |
| Criada em | 2026-11-19 |
| Branch / PR | `feature/t-0007-dashboard-financeiro-cobertura` · PR automático no push |

## Pedido (palavras da Liza)

> Instala o coverage onde mostra as coberturas de todos os testes e adicione as regras de coberturas dos testes; os agentes devem validar com PM ou PM e Testers, validando as implementações para que fique acima de 95% tudo.

## Aprovação da spec (Gate G1)

- [x] Aprovado pela Liza em 2026-11-19 (respostas na sessão: cobertura 95% no código novo; Prettier com commit único; aba "Transações"; cards com cadastrar, editar e excluir).

## Análise (Analyst, 2026-11-19)
**Situação atual:** `npm run test:coverage` só roda os unitários, sem meta. Medição em 2026-11-19: unitários 10,85% de linhas (todo `src`), integração 13,72%.
**Por que não 95% em tudo agora:** dezenas de testes novos (auth, actions, repositórios, componentes) → tarefas T-0012 a T-0015 no backlog (decisão da Liza: 95% no código novo).
**Regras em jogo:** CI (tier 3).

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
