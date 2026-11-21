# T-0016 — PR automático develop → main

| Campo | Valor |
|---|---|
| Tipo | infra |
| Módulos | plataforma |
| Tamanho | P |
| Tier | @coding-3 |
| Estado (Kanban) | Pronto p/ deploy (na develop; produção pelo PR #11) |
| Criada em | 2026-11-19 |
| Branch / PR | `feature/t-0007-dashboard-financeiro-cobertura` · PR automático no push |

## Pedido (palavras da Liza)

> Quando o merge da branch com develop, a develop deve ser disparada e criado o PR de develop para main; adicione essa implementação.

## Proposta (OpenSpec, enxuta)

- **Why:** depois do merge na `develop`, a Liza ainda precisa abrir o PR para a `main` à mão.
- **What Changes:** `.github/workflows/release-pr.yml` (push na `develop`): abre o PR `develop → main` se não existe, ou atualiza a lista do que entra; no PR novo roda Danger e CI (mesmo motivo do `auto-pr.yml`: PR do `GITHUB_TOKEN` não dispara workflows). O merge na `main` **continua manual**.
- **Ajuste na cobertura:** no PR de release, `coverage:check` confere só o total (`checksChangedFiles("main") = false`). Sem isso, os 38 commits já na `develop` (vários anteriores à regra R16) seriam cobrados arquivo por arquivo de novo.
- **Delta:** ADDED PLAT-R19.
- **Rollback:** apagar o workflow.
- **Aprovação (G1):** pedido direto da Liza (acima).

## Testes

| Cenário | Teste | Estado |
|---|---|---|
| Release confere só o total; feature confere arquivo por arquivo | `coverage-rules.test.ts › checksChangedFiles` (4 casos) | 🔴 → ✅ |
| Lista do que entra | `git log --first-parent origin/main..origin/develop` local: os 5 merges (#5 a #9) | ✅ |
| Sintaxe | `actionlint` | ✅ |
| PR aberto de verdade | Primeiro merge na `develop` depois deste PR | ⬜ (Liza) |

## Gates

| Gate | Estado | Evidência |
|---|---|---|
| G1 Spec | ✅ | Pedido da Liza |
| G2 Testes vermelhos | ✅ | `checksChangedFiles` não existia |
| G3 Pipeline verde | ✅ | Local 2026-11-19 |
| G5 QA | ⚠️ CONCERNS | Workflow só validado estaticamente; confirmar no 1º merge |
| G6 Registro | ✅ | CHANGELOG, PLAT-R19, guia do passo 11 |

## Handoffs

### Handoff: Orchestrator → @coding → QA → Documentation (2026-11-19)
- Feito: ver acima. Pipeline completo verde localmente.
- Próximo passo: `git push`; conferir no GitHub.
