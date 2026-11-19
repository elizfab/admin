# Code Review: Cards do dashboard no banco (T-0007)

| Campo | Valor |
|---|---|
| PR | Automático no push de `feature/t-0007-dashboard-financeiro-cobertura` |
| Revisado em | 2026-11-19 |
| Decisão | ✅ Aprovado (revisão do agente; a revisão humana acontece no PR) |

## Achados

| # | Severidade | Arquivo:linha | Regra | Cenário que quebra | Correção sugerida |
|---|---|---|---|---|---|
| 1 | 🟡 | `prisma/migrations/20261119184015_add_dashboard_modules/migration.sql` | — | "Portal Financeiro" nasce como "Em breve", mas o Financeiro já está em produção | Dado copiado do `modules.mock.ts` da Liza; ela ajusta pelo modal (Editar) |
| 2 | 🟡 | `src/modules/dashboard/schemas/dashboard-module.schema.ts` | — | Link interno pode apontar para rota que não existe (card leva ao 404) | Aceito: fora do escopo; o 404 já é em português |
| 3 | 🟡 | `src/components/ui/AlertDialog/AlertDialog.module.scss:8` | R10 | Cor fixa `rgb()` no overlay (código antigo, não alterado aqui) | Trocar pelo mesmo `color-mix` do Dialog novo (anotado em T-0012) |

## Regras R1–R17 conferidas

R1 ✅ R2 ✅ R3 ➖ R4 ➖ R5 ✅ R6 ✅ R7 ✅ R8 ✅ R9 ✅ R10 ✅ R11 ✅ R12 ➖ R13 ✅ R14 ✅ R15 ✅ R16 ✅ R17 ✅

## Regras validadas (`docs/implementations`) tocadas

- Nenhuma regra antiga alterada; regras novas DASH-R01 a DASH-R10.
