# QA Gate: Financeiro em abas (T-0008)

| Campo | Valor |
|---|---|
| Decisão | **PASS** |
| Data | 2026-11-19 |
| Pipeline | typecheck ✅ format ✅ lint ✅ unit ✅ (200) e2e ✅ (55) cobertura ✅ (226 testes Jest; ≥ 95% no código novo; total 33,72% → 44,01%) |

## Rastreabilidade

| Requisito / cenário | Teste | Estado |
|---|---|---|
| FIN-R11 abas e aba atual | `FinanceTabs.test.tsx`, `finance.spec.ts › navega pelas abas…` | ✅ |
| "Nova transação" dentro da aba | `finance.spec.ts › navega pelas abas…` | ✅ |

## Regressão (regras validadas tocadas)

| Regra | Teste | Estado |
|---|---|---|
| FIN-R06 | `finance.spec.ts › cria despesa pela tela…` | ✅ |

## Não funcionais

- [x] axe em `/finance` e `/finance/construction`, dois temas
- [x] `--repeat-each=3` nos specs afetados

## Riscos residuais

| Risco | Dono | Prazo |
|---|---|---|
| — | — | — |
