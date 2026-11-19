# Plano técnico: Financeiro em abas (T-0008)

## Mapa requisito → camada

| Requisito | Camada | Arquivo |
|---|---|---|
| FIN-R11 | Componente (servidor) | `src/modules/finance/components/FinanceTabs/FinanceTabs.tsx` + `.module.scss` |
| FIN-R11 | Telas | `src/app/(private)/finance/page.tsx`, `src/app/(private)/finance/construction/page.tsx` |

- Abas são **links de navegação** (`<nav aria-label="Seções do Financeiro">` + `aria-current="page"`), não `role="tablist"`: cada aba é uma rota (ARIA APG: tabs são para painéis na mesma página).
- Estilo só com tokens de tema (R10).

## Riscos e testes que protegem

| Risco | Regra | Teste |
|---|---|---|
| Aba sem indicação acessível | R11 | `tests/unit/modules/finance/FinanceTabs.test.tsx`, `finance.spec.ts`, axe |
| "Nova transação" some | FIN-R06 | `finance.spec.ts` (fluxo existente) |

## Tier

**@coding-1** (≤ 3 arquivos de produção + estilo com tokens existentes).
