# T-0005 — Correções nas docs encontradas na instalação do Graphify

| Campo | Valor |
|---|---|
| Tipo | doc |
| Módulos | plataforma (docs) |
| Tamanho | P |
| Tier | @coding-1 |
| Estado (Kanban) | Code Review |
| Criada em | 2026-11-19 |
| Branch / PR | `feature/bmad-agents` · PR automático no push |

## Pedido (palavras da Liza)

> "SIM" (abrir a tarefa para corrigir os problemas das docs) "e qdo finalizar comita todas as docs".

## Atalho registrado

Tipo `doc`, tamanho P, nenhuma regra R1–R15 envolvida: direto para `@coding-1`
(atalho do Orchestrator). Sem spec/plan.

## Itens

| # | Problema | Correção | Feito |
|---|---|---|---|
| 1 | `docs/CHANGELOG.md` não existia (citado pelo `AGENTS.md` e pelos agentes); o `CHANGELOG.md` da raiz é de um template Angular | Criado `docs/CHANGELOG.md` com o histórico real (git log). O `CHANGELOG.md` da raiz **não** foi versionado: decisão da Liza (apagar ou manter) | ✅ |
| 2 | `docs/decisions/ADR-006-autenticacao-better-auth.md` foi sobrescrito pelo texto do Portal Dev no commit `d510b96` | ADR-006 restaurado de `d510b96~1`; Portal Dev em `ADR-013-portal-dev-protegido.md` | ✅ |
| 3 | Portal Dev numerado como "ADR-007", número já usado (PostgreSQL + Prisma, `ARCHITECTURE.md` §25) | Renumerado para ADR-013, com nota no próprio ADR; tabela §25, árvores de `ARCHITECTURE.md` e `docs/README.md` atualizadas | ✅ |
| 4 | `VERCEL-ENV.md` §5 citava `https://admin.vercel.app` | `https://admin-elizabetefabri.vercel.app` | ✅ |
| 5 | `docs/agents/README.md` mandava criar `chore/agents` | `feature/agents` (só `feature/*` é aceito, T-0006) e `.gitattributes` no `git add` | ✅ |
| 6 | Exemplo `graphify path "registerServicePayment" "Transaction"` não encontra caminho | Troca por `transactionRepository` + nota (`src/generated/` fica fora do grafo) | ✅ |

## Gates

| Gate | Estado | Evidência |
|---|---|---|
| G1 Spec | ➖ | Atalho `doc` P |
| G2 Testes vermelhos | ➖ | Só documentação |
| G3 Pipeline verde | ✅ | Pipeline completo local em 2026-11-19 (ver T-0006) |
| G4 Review | ⬜ | PR |
| G5 QA | ➖ | Só documentação |
| G6 Registro | ✅ | `docs/CHANGELOG.md` |

## Handoffs

### Handoff: @coding-1 → Code Review (2026-11-19)
- Feito: itens 1–6.
- Decidido: Portal Dev = ADR-013 (o 007 já existia).
- Pendente / riscos: o repositório `elizfab/portal-dev` pode citar "ADR-007"; o `CHANGELOG.md` da raiz espera decisão da Liza.
- Arquivos tocados: `docs/CHANGELOG.md`, `docs/decisions/*`, `docs/architecture/ARCHITECTURE.md`, `docs/README.md`, `VERCEL-ENV.md`, `docs/agents/*`.
- Próximo passo: revisão no PR.
