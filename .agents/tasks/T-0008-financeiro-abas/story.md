# T-0008 — Financeiro em abas (Transações | Obra)

| Campo | Valor |
|---|---|
| Tipo | change |
| Módulos | finance, construction |
| Tamanho | P |
| Tier | @coding-2 |
| Estado (Kanban) | Pronto p/ deploy (na develop; produção pelo PR #11) |
| Criada em | 2026-11-19 |
| Branch / PR | `feature/t-0007-dashboard-financeiro-cobertura` · PR automático no push |

## Pedido (palavras da Liza)

> No painel Financeiro temos um btn: obra, nova transação; em vez de ser esse btn no canto superior direito, transformar ele em tab nav menu, com um container, onde as tabs fiquem abaixo do texto "Receitas, despesas, saldo e obra."; a 1ª aba com o conteúdo atual; e o btn nova transação fique dentro da página no canto esquerdo.

## Aprovação da spec (Gate G1)

- [x] Aprovado pela Liza em 2026-11-19 (respostas na sessão: cobertura 95% no código novo; Prettier com commit único; aba "Transações"; cards com cadastrar, editar e excluir).

## Análise (Analyst, 2026-11-19)
**Situação atual:** `src/app/(private)/finance/page.tsx` põe "Obra" e "Nova transação" no `action` do `PageHeader`; `/finance/construction` tem cabeçalho próprio "Obras".
**Regras validadas tocadas:** FIN-R06 (volta ao painel no mês) não muda. E2E `finance.spec.ts:50` clica no link "Nova transação" (continua existindo).
**Regras do projeto em jogo:** R10, R11 (aba atual com `aria-current`, foco visível).

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
