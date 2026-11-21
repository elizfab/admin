# QA Gate: Cards do dashboard no banco (T-0007)

| Campo | Valor |
|---|---|
| Decisão | **PASS** |
| Data | 2026-11-19 |
| Pipeline | typecheck ✅ format ✅ lint ✅ unit ✅ (200) e2e ✅ (55) cobertura ✅ (226 testes Jest; ≥ 95% no código novo; total 33,72% → 44,01%) |

## Rastreabilidade

| Requisito / cenário | Teste | Estado |
|---|---|---|
| FR-001 / DASH-R01 lista por dona e ordem | `dashboard-module.repository.test.ts` | ✅ |
| FR-002, FR-004 / DASH-R05 cadastrar pelo modal | `ModuleFormDialog.test.tsx`, `dashboard.spec.ts › cadastra um card…` | ✅ |
| FR-003 / DASH-R02, R03 validação e duplicado | `dashboard-module.schema.test.ts`, `dashboard-module.service.test.ts`, `dashboard.spec.ts › identificador repetido…` | ✅ |
| FR-005 / DASH-R05 editar | `ModuleFormDialog.test.tsx › editar`, `dashboard.spec.ts › edita o título…` | ✅ |
| FR-006 / DASH-R06 excluir com confirmação | `DeleteModuleButton.test.tsx`, `dashboard.spec.ts › …e exclui com confirmação` | ✅ |
| FR-007 / DASH-R04 isolamento | `isolation.spec.ts › Dashboard: …` | ✅ |
| FR-008 API | `dashboard.spec.ts › API: contrato…` | ✅ |
| FR-009 / DASH-R09 dados iniciais | `dashboard.spec.ts › mostra os 3 cards iniciais…`; migration conferida no banco local (todas as contas com 3 cards) | ✅ |
| FR-010 sem cards | `page.tsx` (mensagem); **sem teste E2E** (toda conta nasce com 3 cards) | ⚠️ coberto por leitura de código |
| FR-011 / DASH-R08 link externo | `ModuleCard.test.tsx` | ✅ |
| SC-001 cobertura | todos os arquivos novos do módulo com 100% nas 4 métricas | ✅ |
| SC-002 / DASH-R10 axe | `accessibility.spec.ts › modal "Novo card"…` | ✅ |

## Regressão (regras validadas tocadas)

| Regra | Teste | Estado |
|---|---|---|
| Navegação do dashboard | `navigation.spec.ts` (card vindo do banco) | ✅ |

## Não funcionais

- [x] axe sem violações (claro e escuro), Dashboard e modal
- [x] isolamento (outra usuária → 404)
- [x] `--repeat-each=3` em `dashboard`, `isolation`, `navigation` e `finance` (91 verdes). O bloco antigo de Projetos em `isolation.spec.ts` não repetia (nome fixo): corrigido nesta tarefa

## Riscos residuais

| Risco | Dono | Prazo |
|---|---|---|
| FR-010 sem teste automático | Tester | T-0012 |
| `projects.spec.ts` (antigo) falha com `--repeat-each=3` (nomes fixos) | Tester | T-0013 |
