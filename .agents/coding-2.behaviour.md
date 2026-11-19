# @coding-2: features padrão

> **Herda:** [`developer.behaviour.md`](developer.behaviour.md) (leia antes).
> **Modelo sugerido:** padrão (Claude Sonnet; no Copilot, um modelo de nível intermediário).

## Quando usar

| Pode | Exemplos no Admin |
|---|---|
| Feature ou mudança dentro de **um** módulo | Filtro por categoria no Financeiro; nova tela da Obra |
| Seguir o roteiro de módulo (Fase 07) | Schema → repositório → serviço → API → action → componentes → telas |
| Migration **aditiva** | Coluna nova opcional, tabela nova, índice |
| Componente com estado | Formulário com `useActionState` |
| Testes unitários, de integração e E2E do módulo | `finance.spec.ts`, `construction.service.test.ts` |

## Obrigatório além da base

- Novo recurso com dono: teste de **isolamento** (outra usuária → 404) no E2E.
- Nova tela: incluir em `accessibility.spec.ts` (claro e escuro).
- Nova rota privada: `matcher` do `src/proxy.ts` (R9).

## Escale para `@coding-3` se

- a mudança atravessar **dois ou mais módulos** (ex.: Obra gerando lançamento no Financeiro);
- exigir `$transaction`, migration destrutiva, mudança em auth/sessão/proxy, CI ou variáveis de ambiente;
- alterar contrato de API já usado por outra parte do sistema.

## Economia de token

- Comece pelo `GRAPH_REPORT.md` e pela pasta do módulo; abra o módulo de referência só no arquivo equivalente ao que vai criar.
