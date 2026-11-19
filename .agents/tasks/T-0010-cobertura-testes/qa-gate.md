# QA Gate: Cobertura de testes na CI (T-0010)

| Campo | Valor |
|---|---|
| Decisão | **PASS** |
| Data | 2026-11-19 |
| Pipeline | typecheck ✅ format ✅ lint ✅ unit ✅ (200) e2e ✅ (55) cobertura ✅ (226 testes Jest; ≥ 95% no código novo; total 33,72% → 44,01%) |

## Rastreabilidade

| Requisito / cenário | Teste | Estado |
|---|---|---|
| PLAT-R17 regras (escopo, 95%, linha de base, commits de formatação) | `coverage-rules.test.ts` (22 casos) | ✅ |
| CLI no repositório real | `npm run coverage:check` local: ✅ arquivos e ✅ total | ✅ |

## Regressão (regras validadas tocadas)

| Regra | Teste | Estado |
|---|---|---|
| Testes de integração continuam rodando na CI | Dentro de `test:coverage` (projects) | ✅ |

## Não funcionais

- [x] `actionlint` nos workflows

## Riscos residuais

| Risco | Dono | Prazo |
|---|---|---|
| Primeira execução da etapa na CI | Liza (PR) | Primeiro push |
