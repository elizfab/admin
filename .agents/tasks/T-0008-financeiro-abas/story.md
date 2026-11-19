# T-0008 — Financeiro em abas (Transações | Obra)

| Campo | Valor |
|---|---|
| Tipo | change |
| Módulos | finance, construction |
| Tamanho | P |
| Tier | @coding-2 |
| Estado (Kanban) | Em desenvolvimento |
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
