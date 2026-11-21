# T-0018 — Tabela de cobertura no npm test

| Campo | Valor |
|---|---|
| Tipo | chore |
| Módulos | plataforma |
| Tamanho | P |
| Tier | @coding-1 |
| Estado (Kanban) | Pronto p/ deploy (na develop; produção pelo PR #11) |
| Criada em | 2026-11-19 |
| Branch / PR | `feature/t-0007-dashboard-financeiro-cobertura` · PR automático no push |

## Pedido (palavras da Liza)

> Quando eu executo npm test, ele não está mostrando a tabela com os itens validados e cobertos, somente quando executo test:coverage; adicione no script test.

## Atalho registrado

`chore` P sem regra R1–R15 de produto: direto para `@coding-1`.

## O que mudou

- `npm test` = `jest --coverage` com a tabela arquivo a arquivo + resumo (relatório em `coverage/unit`, para não sobrescrever o `coverage/` da meta).
- Escopo único em `jest.coverage-scope.mjs`, usado por `jest.config.ts` e `jest.coverage.config.ts` (antes o `jest.config.ts` medía `src/**` inteiro, inclusive `src/app`).
- `.mjs` porque o Node 24 carrega o `jest.config.ts` como ESM e exige extensão no import.
- O total do `npm test` (~27%) é menor que o da meta (~44%): não inclui a integração.

## Gates

| Gate | Estado | Evidência |
|---|---|---|
| G1 | ➖ | Atalho chore |
| G3 | ✅ | 204 testes, tabela impressa |
| G6 | ✅ | CHANGELOG, guia do passo 13, project-context §7 |

## Handoffs

### Handoff: Orchestrator → @coding → QA → Documentation (2026-11-19)
- Feito: ver acima. Pipeline completo verde localmente.
- Próximo passo: `git push`; conferir no GitHub.
