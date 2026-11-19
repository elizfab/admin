# T-0010 — Cobertura de testes na CI (≥ 95% no código novo, total não cai)

| Campo | Valor |
|---|---|
| Tipo | infra |
| Módulos | plataforma (CI, testes, agentes) |
| Tamanho | M |
| Tier | @coding-3 |
| Estado (Kanban) | Code Review (aguardando o PR) |
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
