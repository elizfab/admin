# Code Review: Cobertura de testes na CI (T-0010)

| Campo | Valor |
|---|---|
| PR | Automático no push de `feature/t-0007-dashboard-financeiro-cobertura` |
| Revisado em | 2026-11-19 |
| Decisão | ✅ Aprovado (revisão do agente; a revisão humana acontece no PR) |

## Achados

| # | Severidade | Arquivo:linha | Regra | Cenário que quebra | Correção sugerida |
|---|---|---|---|---|---|
| 1 | 🟡 | `scripts/coverage-check.ts` | R16 | Mexer em 1 linha de arquivo antigo cobra 95% do arquivo inteiro | É a decisão da Liza ("mexeu, testa"); WAIVED por escrito se precisar |
| 2 | 🟡 | `.github/workflows/ci.yml` | — | Etapa "Conferir cobertura" só validada localmente | Confirmar no primeiro PR |

## Regras R1–R17 conferidas

R1 ✅ R2 ✅ R3 ➖ R4 ➖ R5 ✅ R6 ✅ R7 ✅ R8 ✅ R9 ✅ R10 ✅ R11 ✅ R12 ➖ R13 ✅ R14 ✅ R15 ✅ R16 ✅ R17 ✅

## Regras validadas (`docs/implementations`) tocadas

- PLAT-R17 nova.
