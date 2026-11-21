# T-0021 — Financeiro: troca de abas sem salto e Voltar da Construção para o Financeiro

| Campo | Valor |
|---|---|
| Tipo | bug + change |
| Módulos | finance, construction |
| Tamanho | M |
| Tier | @coding-2 |
| Estado (Kanban) | Em desenvolvimento (pronto, sem commit a pedido da Liza) |
| Criada em | 2026-11-20 |
| Branch / PR | `feature/t-0020-financeiro-construcao` · sem commit |

## Pedido (palavras da Liza, `todo.md` item 3 e 4)

> O Voltar está correto em /finance, mas incorreto em /finance/construction. Ao alternar entre as tabs, a página apresenta saltos ou deslocamentos de layout.

## Aprovação (Gate G1)

- [x] Pedido escrito da Liza (`todo.md`, 2026-11-20)
- [x] Destino do Voltar em Construção: `/finance` (resposta da Liza, 2026-11-20)

## Análise (Analyst, 2026-11-20)

**Reprodução (Playwright, 1280×720, antes da correção):**

| Rota | Voltar (y) | Título h1 (y) | Abas (y) |
|---|---|---|---|
| `/finance` | 210 | 96 | 267 |
| `/finance/construction` | 96 | 129 | 219 |

**Causa raiz:** as duas abas montavam o topo **cada uma do seu jeito**: em `/finance`, título →
Voltar dentro de `<div class="page">` (flex com `gap`); em `/finance/construction`, Voltar →
título num fragmento, sem o container. As abas "pulavam" 48 px e o Voltar trocava de lugar
(acima × abaixo do título) — esse era o "comportamento incorreto" percebido. Fator extra: a
barra de rolagem aparece numa aba e não na outra quando a altura do conteúdo muda (largura útil
muda ~15 px). Não há animação, `loading.tsx` nem re-render envolvidos.

## Correção

- `src/modules/finance/components/FinanceLayout/` (`FinanceLayout.tsx`, `.module.scss`,
  `.types.ts`, `financeLayout.constants.ts`): topo **único** das abas (título "Painel
  Financeiro", descrição, barra Voltar + ações com **altura fixa**, abas). As duas páginas usam ele.
- Voltar sobe um nível (`FINANCE_BACK_LINK`): Transações → "Voltar ao início" (`/dashboard`);
  Construção → "Voltar ao Financeiro" (`/finance`). PLAT-R16 alterada.
- `BackLink` aceita `className` (para alinhar na barra).
- `src/styles/base/_reset.scss`: `html { scrollbar-gutter: stable; }`.
- O título "Painel Financeiro" adota a mudança local da Liza em `finance/page.tsx`.

## Testes

| Cenário | Teste | Estado |
|---|---|---|
| Topo igual, Voltar por aba, ações na barra | `tests/unit/modules/finance/FinanceLayout.test.tsx` | 🔴 → ✅ |
| `BackLink` com classe extra | `BackLink.test.tsx` | 🔴 → ✅ |
| Trocar de aba não desloca título, Voltar nem abas | `finance.spec.ts › trocar de aba não desloca…` (compara x, y e altura) | ✅ |
| Voltar de Construção → `/finance`; dos módulos → Dashboard | `navigation.spec.ts` | ✅ |
| Repetição | `--repeat-each=3` em finance, navigation, construction (77 verdes) | ✅ |

## Gates

| Gate | Estado | Evidência |
|---|---|---|
| G1 Spec | ✅ | Acima |
| G2 Testes vermelhos | ✅ | `FinanceLayout` não existia; `BackLink` sem `className` |
| G3 Pipeline verde | ✅ | typecheck, format, lint, 250 unit, 60 E2E, 276 Jest com cobertura, coverage:check (2026-11-20) |
| G4 Review | ⬜ | No PR, depois do commit da Liza |
| G5 QA | ✅ PASS | Rastreabilidade acima; axe nos dois temas |
| G6 Registro | ✅ | FIN-R12 (nova), PLAT-R16 (alterada), CHANGELOG |

## Handoffs

### Handoff: @coding → Liza (2026-11-20)
- Feito: acima; **sem commit e sem push** (pedido da Liza).
- Próximo passo: revisar o diff, comitar com as mensagens sugeridas no fim do `todo.md` e dar push.
