# T-0022 — "Obra" vira "Construção" e obras em grid (6 por linha)

| Campo | Valor |
|---|---|
| Tipo | change |
| Módulos | finance, construction, dashboard (rótulo de ícone) |
| Tamanho | M |
| Tier | @coding-2 |
| Estado (Kanban) | Em desenvolvimento (pronto, sem commit a pedido da Liza) |
| Criada em | 2026-11-20 |
| Branch / PR | `feature/t-0020-financeiro-construcao` · sem commit |

## Pedido (palavras da Liza, `todo.md` item 5)

> Na área identificada como Obra, altere o título para Construção; a área contempla vários projetos (telhado, lavanderia…). Na listagem, grid com 6 cards por linha, responsivo.

## Aprovação (Gate G1)

- [x] Pedido escrito da Liza (`todo.md`, 2026-11-20)
- [x] Escopo da troca: **tudo** (resposta da Liza, 2026-11-20). Critério: o nome da **área** e da **categoria** vira "Construção"; cada **item** continua "obra" ("Nova obra", "Ver na obra", "Nome da obra"), como no próprio pedido ("organização de múltiplas obras")

## Análise (Analyst, 2026-11-20)

- O modelo já suporta várias obras (`ConstructionProject` por dona); faltava a tela tratar a área como coleção.
- Textos com o nome da área/categoria: aba (`FinanceTabs`), título/metadata da página, categoria
  `CONSTRUCTION` (`transactionCategoryLabel`), selo da lista (`TransactionList`), opção em Nova
  transação (`TransactionForm`), 409 do Financeiro (`transaction.service.ts`), ícone `Hammer`
  dos cards do Dashboard, descrição "Receitas, despesas, saldo e obra.".
- **Não mudam:** rotas (`/finance/construction`), enum `CONSTRUCTION`, nomes de código, prefixo `OBRA-R*`,
  e o card "Portal Financeiro" já gravado no banco de cada conta (dado da Liza; editável pelo modal).
- R16: `TransactionList.tsx` e `TransactionForm.tsx` (0%) e `transaction.service.ts` (87%) passam a ser
  "alterados" → precisaram de testes.

## Correção

- Rótulos: `FinanceTabs`, `transaction.types.ts`, `TransactionList` e `TransactionForm` (lêem
  `transactionCategoryLabel.CONSTRUCTION`, sem texto fixo), `transaction.service.ts`, `icons.ts`, `defaults.ts`.
- Grid: `src/modules/construction/components/ConstructionProjectGrid/` (1 / 2 / 3 / 6 colunas;
  breakpoint `xl` = 1280 px novo em `_variables.scss`); a listagem saiu da página para o componente.
- `TransactionForm`: a action vazia virou `src/lib/utils/noop-action.ts` (reutilizável e testada).

## Testes

| Cenário | Teste | Estado |
|---|---|---|
| Cards, datas, Configurar, vazio | `ConstructionProjectGrid.test.tsx` | 🔴 → ✅ |
| 6 por linha ≥ 1280 px, 1 no celular | `construction.spec.ts › grid com até 6 obras…` | ✅ |
| Selo "Construção", Ver na obra, sem editar | `TransactionList.test.tsx` (0% → 100%) | 🔴 → ✅ |
| Opção "Construção" troca campos e action | `TransactionForm.test.tsx` (0% → 100%) | 🔴 → ✅ |
| 409 com a mensagem nova | `transaction.service.test.ts` | 🔴 → ✅ |
| Fluxo de pagamento pela categoria Construção | `construction.spec.ts › Nova transação → Obra…` (agora repetível: descrição única) | ✅ |

## Gates

| Gate | Estado | Evidência |
|---|---|---|
| G1 Spec | ✅ | Acima |
| G2 Testes vermelhos | ✅ | Rótulo "Construção" ausente; componente de grid não existia |
| G3 Pipeline verde | ✅ | typecheck, format, lint, 250 unit, 60 E2E, 276 Jest com cobertura, coverage:check (2026-11-20) |
| G4 Review | ⬜ | No PR, depois do commit da Liza |
| G5 QA | ✅ PASS |
| G6 Registro | ✅ | FIN-R08/R09/R11 e R12 alteradas, OBRA-R18 nova, CHANGELOG |

## Handoffs

### Handoff: @coding → Liza (2026-11-20)
- Feito: acima; **sem commit e sem push** (pedido da Liza).
- Próximo passo: revisar o diff, comitar com as mensagens sugeridas no fim do `todo.md` e dar push.
