# T-0015 — Cobertura ≥ 95%: Financeiro → Obra

| Campo | Valor |
|---|---|
| Tipo | chore |
| Módulos | Financeiro → Obra |
| Tamanho | M |
| Tier | @coding-2 |
| Estado (Kanban) | Backlog |
| Criada em | 2026-11-19 |

## Pedido

Levar `src/modules/construction/**` (actions, repositórios, serviços, componentes) a ≥ 95% (linhas, comandos, ramos, funções), conforme T-0010. Ao terminar,
`npm run coverage:baseline` grava o novo total.

## Como começar

`npm run test:coverage` e abra `coverage/lcov-report/index.html` para ver as linhas sem teste.
