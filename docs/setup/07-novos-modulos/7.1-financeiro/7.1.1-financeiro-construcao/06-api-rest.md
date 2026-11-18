# Passo 06 — API REST `/api/v1/finance/construction`

> **Fase:** 09 — Financeiro → Obra\
> **Tempo estimado:** 2 horas\
> **Depende de:** [Passo 05](05-servicos.md)\
> **Tipo:** especificação (padrão já validado: Fase 07, passo 07)

## Objetivo

Expor a obra pela API com o mesmo contrato do Financeiro, chamando **os mesmos
serviços** do passo 05 que as telas vão usar.

## 💡 Recurso "dentro" da obra, recurso "solto"

| Quando o recurso… | A rota leva… | Exemplo |
|---|---|---|
| É **criado** ou **listado** numa obra | o `projectId` | `POST /projects/:projectId/services` |
| Já tem id próprio | só o id dele | `PATCH /services/:id` |

💡 Como um endereço: para **mandar** uma carta nova, você precisa da rua (obra);
para **achar** uma carta que já tem número de rastreio, o número basta. O
serviço confere a dona pela obra de qualquer jeito.

## Pré-requisitos

- Passo 05 concluído.

## Passo a passo

### 1. As rotas

Base: `/api/v1/finance/construction`.

| Método | Rota | Corpo / query | Serviço | Sucesso |
|---|---|---|---|---|
| `GET` | `/projects` | — | `listProjects` | 200 |
| `POST` | `/projects` | `createProjectSchema` | `createProject` | 201 |
| `GET` | `/projects/:projectId` | — | `getProject` (com ambientes e fases) | 200 |
| `POST` | `/projects/:projectId/areas` | `createAreaSchema` | `addArea` | 201 |
| `POST` | `/projects/:projectId/phases` | `createPhaseSchema` | `addPhase` | 201 |
| `GET` | `/projects/:projectId/services` | `?phaseId=` opcional | `listServices` | 200 |
| `POST` | `/projects/:projectId/services` | `createServiceSchema` | `createService` | 201 |
| `GET` | `/services/:id` | — | `getService` (`summary`) | 200 |
| `PATCH` | `/services/:id` | `updateServiceSchema` | `updateService` | 200 |
| `DELETE` | `/services/:id` | — | `deleteService` | 204 (409 com pagamentos) |
| `GET` | `/projects/:projectId/payments` | `?serviceId=` opcional | `listPayments` | 200 |
| `POST` | `/payments` | `createServicePaymentSchema` | `registerServicePayment` | 201 |
| `DELETE` | `/payments/:id` | — | `deleteServicePayment` | 204 |
| `GET` | `/projects/:projectId/purchases` | — | `listPurchases` | 200 |
| `POST` | `/projects/:projectId/purchases` | `createPurchaseSchema` | `createPurchase` | 201 |
| `DELETE` | `/purchases/:id` | — | `deletePurchase` | 204 |
| `POST` | `/installments/:id/payment` | `payInstallmentSchema` | `payInstallment` | 200 (409 se já paga) |
| `DELETE` | `/installments/:id/payment` | — | `unpayInstallment` | 204 |
| `GET` | `/projects/:projectId/goals` | — | `listGoals` | 200 |
| `POST` | `/projects/:projectId/goals` | `createGoalSchema` | `createGoal` | 201 |
| `PATCH` | `/goals/:id` | `setGoalDoneSchema` (`{ "done": true \| false }`) | `setGoalDone` | 200 |
| `DELETE` | `/goals/:id` | — | `deleteGoal` | 204 |
| `GET` | `/projects/:projectId/dashboard` | `?month=AAAA-MM` (padrão: mês atual) | `getConstructionDashboard` | 200 |

💡 A parcela paga é `POST/DELETE .../payment` (um sub-recurso), e não um
`PATCH` com `paidOn`: pagar **cria** um lançamento e desfazer **apaga**. Os
verbos dizem isso sem precisar ler o corpo.

💡 `PATCH /goals/:id` recebe o estado **desejado** (`done`), e não "inverta":
dois cliques rápidos (ou uma requisição repetida) não desfazem um ao outro.

### 2. Estrutura de arquivos

```text
src/app/api/v1/finance/construction/
├── projects/route.ts
├── projects/[projectId]/route.ts
├── projects/[projectId]/{areas,phases,services,payments,purchases,goals,dashboard}/route.ts
├── services/[id]/route.ts
├── payments/route.ts · payments/[id]/route.ts
├── purchases/[id]/route.ts
├── installments/[id]/payment/route.ts
└── goals/[id]/route.ts
```

### 3. O molde de cada rota

Copie o padrão de `src/app/api/v1/finance/transactions/route.ts` (Fase 07):

1. `requireApiSession()`;
2. `idSchema.parse(...)` nos ids da URL (`await ctx.params`);
3. `schema.safeParse(await readJson(request))` → `ValidationError(toFieldErrors(...))`;
4. chama o serviço com `session.user.id`;
5. `ok` / `created` / `new Response(null, { status: 204 })`;
6. `catch (error) { return apiError(error); }`.

`?month=` reaproveita o `readMonthParam` de `src/app/api/v1/finance/month-param.ts`.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/app/api/v1/finance/construction/**/route.ts` | Criado | 15 arquivos de rota |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Logada, no console: `POST /api/v1/finance/construction/projects` com `{ "name": "Lavanderia" }` | 201 |
| 2 | `POST .../payments` com valor acima do que falta | 400 com `fieldErrors.amountCents` |
| 3 | `DELETE /api/v1/finance/transactions/<id de um lançamento "Obra">` | 409 |
| 4 | Outra conta: `GET .../services/<id>` | 404 |

**Critério de aceite:** os 4 testes passam (eles viram E2E no passo 10).

## Commit sugerido

```bash
git add src/app/api/v1/finance/construction
git commit -m "feat(obra): API REST"
```

---

← [Passo anterior](05-servicos.md) · [Índice da fase](README.md) · [Próximo passo](07-telas-de-cadastro.md) →
