# QA Gate: Botão "Voltar ao início" (T-0009)

| Campo | Valor |
|---|---|
| Decisão | **PASS** |
| Data | 2026-11-19 |
| Pipeline | typecheck ✅ format ✅ lint ✅ unit ✅ (200) e2e ✅ (55) cobertura ✅ (226 testes Jest; ≥ 95% no código novo; total 33,72% → 44,01%) |

## Rastreabilidade

| Requisito / cenário | Teste | Estado |
|---|---|---|
| PLAT-R16 nas 4 páginas | `BackLink.test.tsx`, `navigation.spec.ts › … tem "Voltar ao início"…` (4 testes) | ✅ |

## Regressão (regras validadas tocadas)

| Regra | Teste | Estado |
|---|---|---|
| Navegação pela sidebar | `navigation.spec.ts` | ✅ |

## Não funcionais

- [x] axe em `/projects`, `/finance`, `/finance/construction`, `/studies`, dois temas
- [x] `--repeat-each=3` nos specs afetados

## Riscos residuais

| Risco | Dono | Prazo |
|---|---|---|
| — | — | — |
