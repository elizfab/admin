# T-0012 — Cobertura ≥ 95%: Plataforma

| Campo | Valor |
|---|---|
| Tipo | chore |
| Módulos | Plataforma |
| Tamanho | M |
| Tier | @coding-2 |
| Estado (Kanban) | Backlog |
| Criada em | 2026-11-19 |

## Pedido

Levar `src/lib/auth`, `src/lib/db`, `src/lib/http`, `src/components/**` a ≥ 95% (linhas, comandos, ramos, funções), conforme T-0010. Ao terminar,
`npm run coverage:baseline` grava o novo total.

## Como começar

`npm run test:coverage` e abra `coverage/lcov-report/index.html` para ver as linhas sem teste.
