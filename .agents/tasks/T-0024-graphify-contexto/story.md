# T-0024 — Graphify e contexto dos agentes alinhados com a develop

| Campo | Valor |
|---|---|
| Tipo | chore |
| Módulos | plataforma (agentes, docs) |
| Tamanho | P |
| Tier | @coding-1 |
| Estado (Kanban) | Em desenvolvimento (pronto, sem commit a pedido da Liza) |
| Criada em | 2026-11-20 |
| Branch / PR | `feature/t-0020-financeiro-construcao` · sem commit |

## Pedido (palavras da Liza, `todo.md` item 1)

> Verifique se o Graphify está funcionando e integrado; se o contexto/memória está alinhado com a dev; atualize o contexto e a memória dos agentes, evitando informações desatualizadas, duplicadas ou divergentes.

## Aprovação (Gate G1)

- [x] Pedido escrito da Liza (`todo.md`, 2026-11-20)

## O que foi verificado (2026-11-20)

| Item | Estado encontrado | Ação |
|---|---|---|
| CLI `graphify` | 0.9.112, ok | — |
| Hooks git (post-commit/checkout/merge/rewrite) | Instalados; grafo AST atualizado no checkout (1.864 nós) | — |
| Integração Claude Code | Seção no `CLAUDE.md` + hooks em `.claude/settings.local.json` | — |
| Parte semântica (docs) | Construída em 2026-11-19, antes de várias docs (CHANGELOG, regras, agentes) | `/graphify . --update` |
| `.agents/tasks/` no grafo | Dezenas de pastas transitórias custando token na extração semântica | Fora do grafo (`.graphifyignore`); agentes leem pelo caminho via `WIP.md` |
| "R1–R15" em 9 lugares | Desatualizado (regras são R1–R17 desde T-0010/T-0011) | Corrigido |
| "Financeiro → Obra", R12 | Desatualizado (T-0022) | Corrigido em `AGENTS.md`, `project-context.md`, regras validadas |
| `WIP.md` | T-0007…T-0019 em "Code Review"/"Em desenvolvimento", mas já na develop (PRs #10 e #12); release #11 aberto | Movidas para "Pronto p/ deploy" (PR #11); T-0005/T-0006 também (ainda não estão na main) |
| `todo.md` | Já ignorado pelo `.gitignore` (padrão `todo.md`) | — |
| Memória de trabalho (Claude Code) | Vazia | Registradas as preferências e convenções da Liza |

## Gates

| Gate | Estado | Evidência |
|---|---|---|
| G1 Spec | ✅ | Acima |
| G2 Testes vermelhos | ➖ | Só docs |
| G3 Pipeline verde | ✅ | typecheck, format, lint, 250 unit, 60 E2E, 276 Jest com cobertura, coverage:check (2026-11-20) |
| G4 Review | ⬜ | No PR, depois do commit da Liza |
| G5 QA | ➖ |
| G6 Registro | ✅ | CHANGELOG |

## Handoffs

### Handoff: @coding → Liza (2026-11-20)
- Feito: acima; **sem commit e sem push** (pedido da Liza).
- Próximo passo: revisar o diff, comitar com as mensagens sugeridas no fim do `todo.md` e dar push.
