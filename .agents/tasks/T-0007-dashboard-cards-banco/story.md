# T-0007 — Cards do dashboard no banco, com cadastro, edição e exclusão

| Campo | Valor |
|---|---|
| Tipo | feature |
| Módulos | dashboard |
| Tamanho | M |
| Tier | @coding-2 |
| Estado (Kanban) | Em desenvolvimento |
| Criada em | 2026-11-19 |
| Branch / PR | `feature/t-0007-dashboard-financeiro-cobertura` · PR automático no push |

## Pedido (palavras da Liza)

> Se é só adicionarmos os itens ao banco de dados, no dashboard ao lado do title dashboard no canto superior direito deve ter um btn que abre um modal onde inserimos as informações do card: id, title, description, href, icon, status… e após cadastrar mostra no dash o card.

## Aprovação da spec (Gate G1)

- [x] Aprovado pela Liza em 2026-11-19 (respostas na sessão: cobertura 95% no código novo; Prettier com commit único; aba "Transações"; cards com cadastrar, editar e excluir).

## Análise (Analyst, 2026-11-19)
**Pedido:** a Liza quer cadastrar os cards do dashboard pela tela, guardados no banco.
**Situação atual:** os cards são uma constante (`src/modules/dashboard/data/modules.mock.ts`), sem tabela nem API. Os rótulos de status em português vêm do mapa `statusLabel` em `src/modules/dashboard/components/ModuleCard/ModuleCard.tsx:8-12`.
**Regras validadas tocadas:** nenhuma (módulo novo); E2E `navigation.spec.ts` conta os cards do mock.
**Regras do projeto em jogo:** R1, R2 (cards por dona), R6, R7, R9 (`/dashboard` já está no matcher), R10, R11, R15 (migration aditiva com dados iniciais).
**Impacto e riscos:** produção já tem a administradora: sem dados iniciais o dashboard ficaria vazio após o deploy → a migration insere os 3 cards atuais para cada usuária existente; o seed faz o mesmo para contas novas.

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
