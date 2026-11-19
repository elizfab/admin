# T-0013 — Cobertura ≥ 95%: Projetos

| Campo | Valor |
|---|---|
| Tipo | chore |
| Módulos | Projetos |
| Tamanho | M |
| Tier | @coding-2 |
| Estado (Kanban) | Backlog |
| Criada em | 2026-11-19 |

## Pedido

Levar `src/modules/projects/**` (actions, repositório, componentes) a ≥ 95% (linhas, comandos, ramos, funções), conforme T-0010. Ao terminar,
`npm run coverage:baseline` grava o novo total.

## Como começar

`npm run test:coverage` e abra `coverage/lcov-report/index.html` para ver as linhas sem teste.

## Encontrado no QA da T-0007 (2026-11-19)

- `tests/e2e/projects.spec.ts` (`cria projeto…` e `impede renomear…`) falha com
  `--repeat-each=3`: usa nomes fixos e não limpa os projetos. Corrigir junto (nome único
  por execução + limpeza), como foi feito no bloco de Projetos do `isolation.spec.ts`.
