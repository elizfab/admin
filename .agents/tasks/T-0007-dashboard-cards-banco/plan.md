# Plano técnico: cards do dashboard no banco (T-0007)

> Architect · o **como**. Referência: módulo `projects` (mesmas camadas).

## Mapa requisito → camada

| Requisito | Camada | Arquivo |
|---|---|---|
| FR-001, FR-007 | Repositório (sempre com `ownerId`) | `src/modules/dashboard/repositories/dashboard-module.repository.ts` |
| FR-003, FR-005, FR-006 | Serviço | `src/modules/dashboard/services/dashboard-module.service.ts` |
| FR-003 | Schemas Zod + ícones permitidos | `src/modules/dashboard/schemas/dashboard-module.schema.ts`, `src/modules/dashboard/icons.ts` |
| FR-002, FR-004–FR-006 | Server Actions | `src/modules/dashboard/actions/dashboard-module.actions.ts` |
| FR-002, FR-005, FR-006, FR-010, FR-011 | Componentes | `ModuleCard`, `ModuleFormDialog`, `DeleteModuleButton` |
| FR-008 | API | `src/app/api/v1/dashboard/modules/route.ts`, `[id]/route.ts` |
| FR-009 | Migration + seed | `prisma/migrations/…_add_dashboard_modules`, `prisma/seed.ts` |
| Modal | UI genérica | `src/components/ui/Dialog/Dialog.tsx` (Radix, como o AlertDialog) |

## Banco (Prisma)

| Mudança | Detalhe | Aditiva? |
|---|---|---|
| `enum DashboardModuleStatus` | `AVAILABLE`, `EXTERNAL`, `SOON` | Sim |
| `model DashboardModule` (`dashboard_module`) | `id` cuid, `ownerId` → User (Cascade), `slug` VarChar(40), `title` VarChar(60), `description` VarChar(160), `href` VarChar(300), `icon` VarChar(40), `status` (padrão `AVAILABLE`), `createdAt`, `updatedAt`; `@@unique([ownerId, slug])` | Sim |
| Dados iniciais | `INSERT … SELECT FROM "user"` com os 3 cards atuais (do `modules.mock.ts` da Liza) | Sim (só insere) |

`icon` guarda o **nome** do ícone (ex.: `BookOpen`); o componente vem do mapa `dashboardIcons`.

## Contratos

### Schemas (Zod)

- `createDashboardModuleSchema`: `slug`, `title`, `description`, `href`, `icon` obrigatórios; `status` com `.default("AVAILABLE")` (R7).
- `updateDashboardModuleSchema`: `.partial()` **sem** default + `refine` (corpo não vazio) (R7).

### API

| Método | Rota | Corpo | Sucesso | Erros |
|---|---|---|---|---|
| GET | `/api/v1/dashboard/modules` | — | 200 `{ data: Card[] }` | 401 |
| POST | `/api/v1/dashboard/modules` | create | 201 `{ data: Card }` | 400, 401, 409 |
| GET | `/api/v1/dashboard/modules/:id` | — | 200 | 400, 401, 404 |
| PATCH | `/api/v1/dashboard/modules/:id` | update | 200 | 400, 401, 404, 409 |
| DELETE | `/api/v1/dashboard/modules/:id` | — | 204 | 400, 401, 404 |

## Riscos e testes que protegem

| Risco | Regra (R/ID) | Teste |
|---|---|---|
| Ler/alterar card de outra dona | R1, R2 | `tests/e2e/isolation.spec.ts` (cards), `tests/integration/dashboard-module.repository.test.ts` |
| Identificador duplicado vira erro 500 | R6 | `dashboard-module.service.test.ts`, integração (`@@unique`) |
| PATCH parcial volta status ao padrão | R7 | `dashboard-module.schema.test.ts` |
| Dashboard vazio em produção | R15 | Migration com `INSERT`; E2E `navigation.spec.ts` (3 cards do seed) |
| Modal inacessível | R11 | `accessibility.spec.ts` (modal aberto, dois temas) |
| `redirect()` dentro do `try` | R13 | Actions sem redirect (o modal fecha no cliente) |

## Tier

**@coding-2**: um módulo seguindo o roteiro, migration aditiva.

## Decisões

- [ ] ADR necessário? Não: mesmo padrão dos módulos existentes.
