# T-0020 — GitHub Actions: uma validação por PR, sem aprovação dupla

| Campo | Valor |
|---|---|
| Tipo | infra (bug) |
| Módulos | plataforma (CI) |
| Tamanho | P |
| Tier | @coding-3 (CI) |
| Estado (Kanban) | Em desenvolvimento (pronto, sem commit a pedido da Liza) |
| Criada em | 2026-11-20 |
| Branch / PR | `feature/t-0020-financeiro-construcao` · sem commit |

## Pedido (palavras da Liza, `todo.md` item 2)

> Está solicitando aprovação duas vezes e executando o processo de PR três vezes. Eliminar duplicidades, manter só as validações necessárias, sem remover validações importantes.

## Aprovação (Gate G1)

- [x] Pedido escrito da Liza (`todo.md`, 2026-11-20)

## Análise (Analyst, 2026-11-20)

**Reprodução (logs do GitHub, `gh run list` / `gh api …/actions/runs`):**

| PR | Execuções por push | Detalhe |
|---|---|---|
| #12 (feature → develop) | 3 | "PR automático" (validar + abrir + **Danger no PR novo** + **CI no PR novo**) **e** `Danger` (pull_request) **e** `CI` (pull_request), todos para o mesmo PR |
| #11 (develop → main) | 2 pedidos de aprovação | `Danger` e `CI` com `action_required`, `triggering_actor = github-actions[bot]` |

**Causa raiz:** a premissa da T-0006/T-0016 ("PR criado pelo `GITHUB_TOKEN` não dispara
workflows") estava **errada** neste repositório: o PR aberto pelo `github-actions[bot]` dispara
`pull_request` (`actor = github-actions[bot]`). Então Danger e CI rodavam dentro do workflow que
abre o PR **e** de novo pelo evento do PR. Quando o evento é disparado pelo próprio bot (PR de
release), o GitHub segura cada workflow até aprovação ("Approve and run") → 2 pedidos (Danger +
CI). Além disso, o "PR de release" edita a descrição do PR a cada merge, e o Danger reagia a
`edited` → mais uma execução disparada pelo bot (mais um pedido).

## Correção

| Arquivo | O que mudou |
|---|---|
| `.github/workflows/auto-pr.yml` | Só valida a branch e abre o PR (saíram os jobs "Danger no PR novo" e "CI no PR novo") |
| `.github/workflows/release-pr.yml` | Só abre/atualiza o PR de release (saíram Danger e CI) |
| `.github/workflows/danger.yml` | `edited` só roda se a **base** do PR mudou (título/descrição não) |
| `.github/workflows/ci.yml` | Sem `workflow_call` (ninguém mais chama) |

**Validações preservadas:** tipo de branch (push + Danger), Danger (regras do PR) e CI completa
(typecheck, formatação, lint, unitários, E2E, cobertura) — **uma vez** por evento do PR.
Fluxo esperado (duas validações): **Danger** e **CI**.

## Testes

| Cenário | Evidência | Estado |
|---|---|---|
| Sintaxe | `actionlint` nos 5 workflows | ✅ |
| PR com 1 Danger e 1 CI | Primeiro push desta branch | ⬜ (Liza) |
| Release sem pedido de aprovação a cada merge | Próximo merge na develop | ⬜ (Liza) |

## Gates

| Gate | Estado | Evidência |
|---|---|---|
| G1 Spec | ✅ | Acima |
| G2 Testes vermelhos | ➖ | Workflow (sem teste unitário) |
| G3 Pipeline verde | ✅ | typecheck, format, lint, 250 unit, 60 E2E, 276 Jest com cobertura, coverage:check (2026-11-20) |
| G4 Review | ⬜ | No PR, depois do commit da Liza |
| G5 QA | ⚠️ CONCERNS | Só validado estaticamente; confirmar no 1º push e no 1º merge |
| G6 Registro | ✅ | CHANGELOG, guia `11-danger-e-pr-automatico.md` (com a correção da premissa) |

## Handoffs

### Handoff: @coding → Liza (2026-11-20)
- Feito: acima; **sem commit e sem push** (pedido da Liza).
- Próximo passo: revisar o diff, comitar com as mensagens sugeridas no fim do `todo.md` e dar push.
