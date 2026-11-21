# Passo 05 — Serviços e integração com o Financeiro

> **Fase:** 09 — Financeiro → Obra\
> **Tempo estimado:** 3 a 4 horas\
> **Depende de:** [Passo 04](04-schemas-e-tipos.md)

## Objetivo

Criar o coração do módulo: leituras isoladas por dona, serviços contratados com
valores calculados, **pagamento + lançamento no Financeiro na mesma transação
de banco**, compras com parcelas, metas e o dashboard. Provado por 11 testes no
PostgreSQL real com os **dados da sua planilha**.

## 💡 A peça principal: "tudo ou nada"

Registrar um pagamento grava **duas** coisas: o lançamento "Obra" no Financeiro
e o pagamento na obra. Se a segunda falhar (queda de conexão, regra violada),
a primeira não pode ficar sozinha: o Financeiro mostraria uma despesa que a
obra não conhece.

💡 `prisma.$transaction` é o **cofre com duas fechaduras**: ou as duas chaves
giram, ou nenhuma. O banco desfaz tudo o que foi feito dentro dele se qualquer
passo falhar.

```text
registerServicePayment
├── confere: o serviço é da obra da dona?          (senão 404)
├── confere: o valor cabe no que falta pagar?      (senão 400, nada é gravado)
└── $transaction
    ├── cria Transaction  (EXPENSE, CONSTRUCTION, "Lavanderia · Pedreiro Oswaldo: Reboque")
    └── cria ServicePayment (transactionId = o lançamento acima)
```

### O caminho inverso também é protegido

| Ação | Onde | Resultado |
|---|---|---|
| Excluir o pagamento | Obra | Apaga o pagamento **e** o lançamento (`$transaction`) |
| Excluir o lançamento | Financeiro | **409**: "Lançamento gerado pela Obra: altere em Financeiro → Obra." |
| Desfazer parcela paga | Obra | Parcela volta a "a pagar" e o lançamento some |
| Excluir a compra | Obra | Parcelas e lançamentos das pagas saem juntos |

### Leituras: isolamento pela obra

Só a obra tem `ownerId`. Toda consulta filtra **pela relação**:

```ts
prisma.constructionService.findFirst({
    where: { id: serviceId, project: { ownerId } }, // nunca só { id }
});
```

💡 É a mesma regra do Financeiro ("toda consulta filtra por dona"), só que
pela "pasta" (obra) em vez de cada folha.

### Por que as escritas ficam no serviço

Na Fase 07, o repositório fazia leituras **e** escritas. Aqui, as escritas que
mexem em **duas** tabelas precisam do mesmo `tx` (o cliente da transação), e
quem coordena é o serviço. O repositório fica com as leituras (onde mora a
regra de isolamento) e o serviço com as regras e as escritas atômicas.

## Pré-requisitos

- Passo 04 concluído.
- Migration aplicada também no banco de teste:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/admin_test \
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/admin_test \
npx prisma migrate deploy
```

## Passo a passo

### 1. Repositório (leituras isoladas)

`src/modules/construction/repositories/construction.repository.ts`:

```ts
import { prisma } from "@/lib/db/prisma";

/**
 * Leituras da obra. REGRA DE ISOLAMENTO: só ConstructionProject tem ownerId;
 * todo o resto é filtrado PELA OBRA (`project: { ownerId }`), nunca só pelo id.
 * As escritas que mexem em duas tabelas (pagamento + lançamento) ficam nos
 * serviços, dentro de prisma.$transaction.
 */

export const ownedProject = (ownerId: string, projectId: string) => ({
    id: projectId,
    ownerId,
});

export const constructionRepository = {
    listProjects(ownerId: string) {
        return prisma.constructionProject.findMany({ where: { ownerId }, orderBy: { createdAt: "asc" } });
    },

    findProject(ownerId: string, projectId: string) {
        return prisma.constructionProject.findFirst({
            where: ownedProject(ownerId, projectId),
            include: {
                areas: { orderBy: { name: "asc" } },
                phases: { orderBy: { number: "asc" } },
            },
        });
    },

    listServices(ownerId: string, projectId: string, phaseId?: string) {
        return prisma.constructionService.findMany({
            where: { projectId, phaseId, project: { ownerId } },
            include: { phase: true, area: true },
            orderBy: [{ phase: { number: "asc" } }, { trade: "asc" }, { createdAt: "asc" }],
        });
    },

    findService(ownerId: string, serviceId: string) {
        return prisma.constructionService.findFirst({
            where: { id: serviceId, project: { ownerId } },
            include: { phase: true, area: true, project: true },
        });
    },

    /** Total pago por serviço (uma linha por serviço com pagamento). */
    sumPaymentsByService(serviceIds: string[]) {
        return prisma.servicePayment.groupBy({
            by: ["serviceId"],
            where: { serviceId: { in: serviceIds } },
            _sum: { amountCents: true },
        });
    },

    listPayments(ownerId: string, projectId: string, serviceId?: string) {
        return prisma.servicePayment.findMany({
            where: { serviceId, service: { projectId, project: { ownerId } } },
            include: { service: { include: { phase: true } } },
            orderBy: [{ paidOn: "desc" }, { id: "desc" }],
        });
    },

    findPayment(ownerId: string, paymentId: string) {
        return prisma.servicePayment.findFirst({
            where: { id: paymentId, service: { project: { ownerId } } },
        });
    },

    listPurchases(ownerId: string, projectId: string) {
        return prisma.materialPurchase.findMany({
            where: { projectId, project: { ownerId } },
            include: { installments: { orderBy: { number: "asc" } }, area: true },
            orderBy: [{ purchasedOn: "asc" }, { createdAt: "asc" }],
        });
    },

    findPurchase(ownerId: string, purchaseId: string) {
        return prisma.materialPurchase.findFirst({
            where: { id: purchaseId, project: { ownerId } },
            include: { installments: true, project: true },
        });
    },

    findInstallment(ownerId: string, installmentId: string) {
        return prisma.materialInstallment.findFirst({
            where: { id: installmentId, purchase: { project: { ownerId } } },
            include: { purchase: { include: { project: true } } },
        });
    },

    listGoals(ownerId: string, projectId: string) {
        return prisma.constructionGoal.findMany({
            where: { projectId, project: { ownerId } },
            include: { area: true },
            orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        });
    },

    findGoal(ownerId: string, goalId: string) {
        return prisma.constructionGoal.findFirst({ where: { id: goalId, project: { ownerId } } });
    },
};
```

### 2. Obra, ambientes e fases

`src/modules/construction/services/project.service.ts`:

```ts
import { isUniqueConstraintError } from "@/lib/db/errors";
import { prisma } from "@/lib/db/prisma";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";

import { constructionRepository } from "../repositories/construction.repository";
import type {
    CreateAreaInput,
    CreatePhaseInput,
    CreateProjectInput,
} from "../schemas/construction.schema";

export async function listProjects(ownerId: string) {
    return constructionRepository.listProjects(ownerId);
}

export async function getProject(ownerId: string, projectId: string) {
    const project = await constructionRepository.findProject(ownerId, projectId);

    if (!project) throw new NotFoundError("Obra não encontrada.");

    return project;
}

/** Cria a obra já com o ambiente "Geral" e a "Fase 01" (o mínimo para lançar serviços). */
export async function createProject(ownerId: string, input: CreateProjectInput) {
    if (input.startDate && input.plannedEndDate && input.plannedEndDate < input.startDate) {
        throw new ValidationError({ plannedEndDate: ["O fim previsto precisa ser depois do início."] });
    }

    try {
        return await prisma.constructionProject.create({
            data: {
                ...input,
                ownerId,
                areas: { create: { name: "Geral" } },
                phases: { create: { number: 1 } },
            },
        });
    } catch (error) {
        if (isUniqueConstraintError(error)) {
            throw new ConflictError("Já existe uma obra com esse nome.");
        }
        throw error;
    }
}

export async function addArea(ownerId: string, projectId: string, input: CreateAreaInput) {
    await getProject(ownerId, projectId);

    try {
        return await prisma.constructionArea.create({ data: { ...input, projectId } });
    } catch (error) {
        if (isUniqueConstraintError(error)) {
            throw new ConflictError("Esse ambiente já existe nesta obra.");
        }
        throw error;
    }
}

export async function addPhase(ownerId: string, projectId: string, input: CreatePhaseInput) {
    await getProject(ownerId, projectId);

    try {
        return await prisma.constructionPhase.create({ data: { ...input, projectId } });
    } catch (error) {
        if (isUniqueConstraintError(error)) {
            throw new ConflictError("Essa fase já existe nesta obra.");
        }
        throw error;
    }
}
```

💡 A obra nasce com o ambiente **Geral** e a **Fase 01**: o mínimo para você
já cadastrar o primeiro serviço sem passar pela configuração.

### 3. Serviços contratados

`src/modules/construction/services/contracted-service.service.ts`:

```ts
import { prisma } from "@/lib/db/prisma";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";

import { constructionRepository } from "../repositories/construction.repository";
import { phaseLabel, serviceStatus } from "../rules/construction.rules";
import type { CreateServiceInput, UpdateServiceInput } from "../schemas/construction.schema";
import { tradeLabel, type ServiceSummary } from "../types/construction.types";

/**
 * Serviços contratados (mão de obra). Pago, falta e status NÃO são guardados:
 * são calculados a partir dos pagamentos. Assim nunca ficam desatualizados.
 */

type ServiceRow = Awaited<ReturnType<typeof constructionRepository.listServices>>[number];

function toSummary(service: ServiceRow, paidCents: number): ServiceSummary {
    const label = phaseLabel(service.phase.number);

    return {
        id: service.id,
        label: `${label} | ${tradeLabel[service.trade]} | ${service.description}`,
        phaseId: service.phaseId,
        phaseLabel: label,
        areaName: service.area?.name ?? null,
        trade: service.trade,
        professionalName: service.professionalName,
        description: service.description,
        contractedCents: service.contractedCents,
        paidCents,
        remainingCents: Math.max(0, service.contractedCents - paidCents),
        status: serviceStatus(service.contractedCents, paidCents),
    };
}

export async function listServices(ownerId: string, projectId: string, phaseId?: string) {
    const services = await constructionRepository.listServices(ownerId, projectId, phaseId);
    const sums = await constructionRepository.sumPaymentsByService(services.map((s) => s.id));
    const paidById = new Map(sums.map((row) => [row.serviceId, row._sum.amountCents ?? 0]));

    return services.map((service) => toSummary(service, paidById.get(service.id) ?? 0));
}

export async function getService(ownerId: string, serviceId: string) {
    const service = await constructionRepository.findService(ownerId, serviceId);

    if (!service) throw new NotFoundError("Serviço não encontrado.");

    const [sum] = await constructionRepository.sumPaymentsByService([service.id]);

    return { service, summary: toSummary(service, sum?._sum.amountCents ?? 0) };
}

/** Fase e ambiente precisam ser DA MESMA obra (senão um id de outra obra entraria). */
async function assertBelongsToProject(projectId: string, input: { phaseId?: string; areaId?: string }) {
    if (input.phaseId) {
        const phase = await prisma.constructionPhase.findFirst({ where: { id: input.phaseId, projectId } });
        if (!phase) throw new ValidationError({ phaseId: ["Fase inválida para esta obra."] });
    }

    if (input.areaId) {
        const area = await prisma.constructionArea.findFirst({ where: { id: input.areaId, projectId } });
        if (!area) throw new ValidationError({ areaId: ["Ambiente inválido para esta obra."] });
    }
}

export async function createService(ownerId: string, projectId: string, input: CreateServiceInput) {
    const project = await constructionRepository.findProject(ownerId, projectId);

    if (!project) throw new NotFoundError("Obra não encontrada.");

    await assertBelongsToProject(projectId, input);

    return prisma.constructionService.create({ data: { ...input, projectId } });
}

export async function updateService(ownerId: string, serviceId: string, input: UpdateServiceInput) {
    const { service, summary } = await getService(ownerId, serviceId);

    await assertBelongsToProject(service.projectId, input);

    // Não deixa o contratado ficar MENOR do que o que já foi pago.
    if (input.contractedCents !== undefined && input.contractedCents < summary.paidCents) {
        throw new ValidationError({
            contractedCents: ["O valor contratado não pode ser menor que o total já pago."],
        });
    }

    return prisma.constructionService.update({ where: { id: serviceId }, data: input });
}

export async function deleteService(ownerId: string, serviceId: string) {
    const { summary } = await getService(ownerId, serviceId);

    if (summary.paidCents > 0) {
        throw new ConflictError("Este serviço tem pagamentos. Exclua os pagamentos antes.");
    }

    await prisma.constructionService.delete({ where: { id: serviceId } });
}
```

### 4. Pagamentos (com o lançamento no Financeiro)

`src/modules/construction/services/payment.service.ts`:

```ts
import { formatCents } from "@/lib/money/money";
import { prisma } from "@/lib/db/prisma";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";

import { constructionRepository } from "../repositories/construction.repository";
import type { CreateServicePaymentInput } from "../schemas/construction.schema";
import { tradeLabel } from "../types/construction.types";

import { getService } from "./contracted-service.service";

/**
 * Pagamento a um profissional = DUAS gravações que precisam andar juntas:
 * 1. o lançamento (Transaction, categoria Obra) no Financeiro;
 * 2. o pagamento (ServicePayment) ligado a esse lançamento.
 * prisma.$transaction garante "tudo ou nada": se a 2ª falhar, a 1ª é desfeita.
 */

export async function listPayments(ownerId: string, projectId: string, serviceId?: string) {
    return constructionRepository.listPayments(ownerId, projectId, serviceId);
}

export async function registerServicePayment(ownerId: string, input: CreateServicePaymentInput) {
    const { service, summary } = await getService(ownerId, input.serviceId);

    if (input.amountCents > summary.remainingCents) {
        throw new ValidationError({
            amountCents: [`O valor passa do que falta pagar (${formatCents(summary.remainingCents)}).`],
        });
    }

    const who = [tradeLabel[service.trade], service.professionalName].filter(Boolean).join(" ");
    const description = `${service.project.name} · ${who}: ${service.description}`.slice(0, 120);

    return prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
            data: {
                ownerId,
                type: "EXPENSE",
                category: "CONSTRUCTION",
                description,
                amountCents: input.amountCents,
                occurredOn: input.paidOn,
            },
        });

        return tx.servicePayment.create({
            data: {
                serviceId: service.id,
                paidOn: input.paidOn,
                amountCents: input.amountCents,
                method: input.method,
                notes: input.notes,
                transactionId: transaction.id,
            },
        });
    });
}

export async function deleteServicePayment(ownerId: string, paymentId: string) {
    const payment = await constructionRepository.findPayment(ownerId, paymentId);

    if (!payment) throw new NotFoundError("Pagamento não encontrado.");

    // Ordem: o pagamento aponta para o lançamento (Restrict), então ele sai primeiro.
    await prisma.$transaction([
        prisma.servicePayment.delete({ where: { id: payment.id } }),
        prisma.transaction.delete({ where: { id: payment.transactionId } }),
    ]);
}
```

### 5. Compras e parcelas

`src/modules/construction/services/purchase.service.ts`:

```ts
import { prisma } from "@/lib/db/prisma";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";

import { constructionRepository } from "../repositories/construction.repository";
import {
    addMonths,
    isInstantMethod,
    purchaseStatus,
    splitInstallments,
} from "../rules/construction.rules";
import type { CreatePurchaseInput } from "../schemas/construction.schema";

/**
 * Compras de material. Cada compra gera parcelas na criação:
 * - Pix, dinheiro, débito e transferência: 1 parcela JÁ PAGA no dia da compra
 *   (e o lançamento no Financeiro);
 * - cartão de crédito e boleto: N parcelas mensais A PAGAR, a partir do
 *   1º vencimento ("30 dias" = 1x com vencimento 1 mês depois).
 * Cada parcela marcada como paga gera o seu lançamento no Financeiro.
 */

export async function listPurchases(ownerId: string, projectId: string) {
    const purchases = await constructionRepository.listPurchases(ownerId, projectId);

    return purchases.map((purchase) => {
        const paidCents = purchase.installments
            .filter((installment) => installment.paidOn)
            .reduce((sum, installment) => sum + installment.amountCents, 0);

        return {
            ...purchase,
            paidCents,
            unpaidCents: purchase.totalCents - paidCents,
            status: purchaseStatus(purchase.installments),
        };
    });
}

function installmentDescription(projectName: string, item: string, number: number, count: number) {
    const suffix = count > 1 ? ` (${number}/${count})` : "";
    return `${projectName} · Material: ${item}${suffix}`.slice(0, 120);
}

export async function createPurchase(ownerId: string, projectId: string, input: CreatePurchaseInput) {
    const project = await constructionRepository.findProject(ownerId, projectId);

    if (!project) throw new NotFoundError("Obra não encontrada.");

    if (input.areaId && !project.areas.some((area) => area.id === input.areaId)) {
        throw new ValidationError({ areaId: ["Ambiente inválido para esta obra."] });
    }

    const instant = isInstantMethod(input.method);

    if (instant && input.installmentsCount !== 1) {
        throw new ValidationError({
            installmentsCount: ["Pix, dinheiro, débito e transferência são sempre 1x."],
        });
    }

    const { firstDueOn, ...data } = input;
    const plan = splitInstallments(
        input.totalCents,
        input.installmentsCount,
        instant ? input.purchasedOn : (firstDueOn ?? addMonths(input.purchasedOn, 1)),
    );

    return prisma.$transaction(async (tx) => {
        const purchase = await tx.materialPurchase.create({ data: { ...data, projectId } });

        for (const installment of plan) {
            let transactionId: string | undefined;

            if (instant) {
                const transaction = await tx.transaction.create({
                    data: {
                        ownerId,
                        type: "EXPENSE",
                        category: "CONSTRUCTION",
                        description: installmentDescription(project.name, input.item, 1, 1),
                        amountCents: installment.amountCents,
                        occurredOn: input.purchasedOn,
                    },
                });
                transactionId = transaction.id;
            }

            await tx.materialInstallment.create({
                data: {
                    ...installment,
                    purchaseId: purchase.id,
                    paidOn: instant ? input.purchasedOn : null,
                    transactionId,
                },
            });
        }

        return purchase;
    });
}

export async function payInstallment(ownerId: string, installmentId: string, paidOn: Date) {
    const installment = await constructionRepository.findInstallment(ownerId, installmentId);

    if (!installment) throw new NotFoundError("Parcela não encontrada.");
    if (installment.paidOn) throw new ConflictError("Esta parcela já está paga.");

    const { purchase } = installment;

    return prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
            data: {
                ownerId,
                type: "EXPENSE",
                category: "CONSTRUCTION",
                description: installmentDescription(
                    purchase.project.name,
                    purchase.item,
                    installment.number,
                    purchase.installmentsCount,
                ),
                amountCents: installment.amountCents,
                occurredOn: paidOn,
            },
        });

        return tx.materialInstallment.update({
            where: { id: installment.id },
            data: { paidOn, transactionId: transaction.id },
        });
    });
}

/** Desfaz o pagamento de uma parcela (e apaga o lançamento que ele gerou). */
export async function unpayInstallment(ownerId: string, installmentId: string) {
    const installment = await constructionRepository.findInstallment(ownerId, installmentId);

    if (!installment) throw new NotFoundError("Parcela não encontrada.");
    if (!installment.transactionId) return;

    await prisma.$transaction([
        prisma.materialInstallment.update({
            where: { id: installment.id },
            data: { paidOn: null, transactionId: null },
        }),
        prisma.transaction.delete({ where: { id: installment.transactionId } }),
    ]);
}

export async function deletePurchase(ownerId: string, purchaseId: string) {
    const purchase = await constructionRepository.findPurchase(ownerId, purchaseId);

    if (!purchase) throw new NotFoundError("Compra não encontrada.");

    const transactionIds = purchase.installments
        .map((installment) => installment.transactionId)
        .filter((id): id is string => id !== null);

    // Ordem: a compra leva as parcelas (Cascade); depois os lançamentos ficam livres.
    await prisma.$transaction([
        prisma.materialPurchase.delete({ where: { id: purchase.id } }),
        prisma.transaction.deleteMany({ where: { id: { in: transactionIds }, ownerId } }),
    ]);
}
```

### 6. Metas

`src/modules/construction/services/goal.service.ts`:

```ts
import { prisma } from "@/lib/db/prisma";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";

import { constructionRepository } from "../repositories/construction.repository";
import type { CreateGoalInput } from "../schemas/construction.schema";

export async function listGoals(ownerId: string, projectId: string) {
    return constructionRepository.listGoals(ownerId, projectId);
}

export async function createGoal(ownerId: string, projectId: string, input: CreateGoalInput) {
    const project = await constructionRepository.findProject(ownerId, projectId);

    if (!project) throw new NotFoundError("Obra não encontrada.");

    if (input.areaId && !project.areas.some((area) => area.id === input.areaId)) {
        throw new ValidationError({ areaId: ["Ambiente inválido para esta obra."] });
    }

    const last = await prisma.constructionGoal.aggregate({
        where: { projectId },
        _max: { position: true },
    });

    return prisma.constructionGoal.create({
        data: { ...input, projectId, position: (last._max.position ?? 0) + 1 },
    });
}

/**
 * Marca (done = true) ou desmarca a meta. Recebe o estado DESEJADO, e não
 * "inverta": dois cliques rápidos ou uma requisição repetida não se anulam.
 * `today` = data sem hora (meia-noite UTC).
 */
export async function setGoalDone(ownerId: string, goalId: string, done: boolean, today: Date) {
    const goal = await constructionRepository.findGoal(ownerId, goalId);

    if (!goal) throw new NotFoundError("Meta não encontrada.");

    return prisma.constructionGoal.update({
        where: { id: goal.id },
        data: { doneAt: done ? (goal.doneAt ?? today) : null },
    });
}

export async function deleteGoal(ownerId: string, goalId: string) {
    const goal = await constructionRepository.findGoal(ownerId, goalId);

    if (!goal) throw new NotFoundError("Meta não encontrada.");

    await prisma.constructionGoal.delete({ where: { id: goal.id } });
}
```

### 7. Dashboard

`src/modules/construction/services/dashboard.service.ts`:

```ts
import { monthRange } from "@/lib/dates/month";

import { constructionRepository } from "../repositories/construction.repository";
import { percent, scheduleProgress } from "../rules/construction.rules";
import type { ConstructionDashboard, ConstructionTrade } from "../types/construction.types";

import { listServices } from "./contracted-service.service";
import { listPurchases } from "./purchase.service";
import { getProject } from "./project.service";

/**
 * Números do "Dashboard de evolução", todos derivados dos registros:
 * metas, mão de obra (serviços + pagamentos), materiais (compras + parcelas).
 * `today` = data sem hora; `month` = "AAAA-MM" (parcelas do mês).
 */
export async function getConstructionDashboard(
    ownerId: string,
    projectId: string,
    today: Date,
    month: string,
): Promise<ConstructionDashboard> {
    const project = await getProject(ownerId, projectId);
    const [services, purchases, goals] = await Promise.all([
        listServices(ownerId, projectId),
        listPurchases(ownerId, projectId),
        constructionRepository.listGoals(ownerId, projectId),
    ]);

    // ── Metas ──
    const done = goals.filter((goal) => goal.doneAt).length;
    const areaGroups = new Map<string, { done: number; total: number }>();

    for (const goal of goals) {
        const name = goal.area?.name ?? "Sem ambiente";
        const group = areaGroups.get(name) ?? { done: 0, total: 0 };
        group.total += 1;
        if (goal.doneAt) group.done += 1;
        areaGroups.set(name, group);
    }

    // ── Mão de obra ──
    const byTrade = new Map<ConstructionTrade, { contractedCents: number; remainingCents: number }>();

    for (const service of services) {
        const row = byTrade.get(service.trade) ?? { contractedCents: 0, remainingCents: 0 };
        row.contractedCents += service.contractedCents;
        row.remainingCents += service.remainingCents;
        byTrade.set(service.trade, row);
    }

    const laborContracted = services.reduce((sum, s) => sum + s.contractedCents, 0);
    const laborPaid = services.reduce((sum, s) => sum + s.paidCents, 0);

    // ── Materiais ──
    const { start, end } = monthRange(month);
    const materialsTotal = purchases.reduce((sum, p) => sum + p.totalCents, 0);
    const materialsPaid = purchases.reduce((sum, p) => sum + p.paidCents, 0);
    const dueThisMonth = purchases
        .flatMap((p) => p.installments)
        .filter((i) => i.dueOn >= start && i.dueOn < end)
        .reduce((sum, i) => sum + i.amountCents, 0);

    // ── Resumo ──
    const investment = laborContracted + materialsTotal;
    const paid = laborPaid + materialsPaid;
    const schedule = scheduleProgress(project.startDate, project.plannedEndDate, today);

    return {
        goals: {
            total: goals.length,
            done,
            pending: goals.length - done,
            percent: percent(done, goals.length),
            byArea: [...areaGroups].map(([areaName, group]) => ({
                areaName,
                ...group,
                percent: percent(group.done, group.total),
            })),
        },
        labor: {
            byTrade: [...byTrade].map(([trade, row]) => ({ trade, ...row })),
            contractedCents: laborContracted,
            paidCents: laborPaid,
            remainingCents: laborContracted - laborPaid,
            paidPercent: percent(laborPaid, laborContracted),
            servicesCount: services.length,
        },
        materials: {
            totalCents: materialsTotal,
            paidCents: materialsPaid,
            unpaidCents: materialsTotal - materialsPaid,
            installmentPurchasesUnpaidCents: purchases
                .filter((p) => p.status === "INSTALLMENTS")
                .reduce((sum, p) => sum + p.unpaidCents, 0),
            pendingPurchasesCents: purchases
                .filter((p) => p.status === "PENDING")
                .reduce((sum, p) => sum + p.unpaidCents, 0),
            purchasesCount: purchases.length,
            dueThisMonthCents: dueThisMonth,
            paidPercent: percent(materialsPaid, materialsTotal),
        },
        overall: {
            investmentCents: investment,
            paidCents: paid,
            remainingCents: investment - paid,
            paidPercent: percent(paid, investment),
            laborSharePercent: percent(laborContracted, investment),
            materialsSharePercent: percent(materialsTotal, investment),
            averagePaidPerDayCents:
                schedule && schedule.elapsedDays > 0 ? Math.round(paid / schedule.elapsedDays) : null,
        },
        schedule,
    };
}
```

| Card da planilha | Campo | Conta |
|---|---|---|
| Progresso geral das metas | `goals.percent` | concluídas ÷ total |
| Carpinteiro, Pedreiro… | `labor.byTrade` | Σ contratado e Σ falta por profissão |
| Mão de obra quitada | `labor.paidPercent` | Σ pago ÷ Σ contratado |
| Total em compras / Já pago / A pagar | `materials.totalCents` / `paidCents` / `unpaidCents` | Σ parcelas |
| Compras parceladas | `materials.installmentPurchasesUnpaidCents` | Σ a pagar das compras "Parcelado" |
| Parcelas do mês | `materials.dueThisMonthCents` | Σ parcelas que **vencem** no mês (exato, não estimado) |
| Investimento total | `overall.investmentCents` | contratado + compras |
| Custo médio por dia | `overall.averagePaidPerDayCents` | total pago ÷ dias decorridos |
| Cronograma | `schedule` | início, fim previsto e hoje |

### 8. API de servidor do módulo

`src/modules/construction/server.ts`:

```ts
import "server-only";

// API pública do módulo Obra — SOMENTE servidor (acessa o banco).
export * from "./services/contracted-service.service";
export * from "./services/dashboard.service";
export * from "./services/goal.service";
export * from "./services/payment.service";
export * from "./services/project.service";
export * from "./services/purchase.service";
```

### 9. Financeiro: bloquear lançamentos gerados

Em `src/modules/finance/repositories/transaction.repository.ts`, o
`findByIdForOwner` passa a trazer as ligações:

```ts
    findByIdForOwner(id: string, ownerId: string) {
        return prisma.transaction.findFirst({
            where: { id, ownerId },
            // Lançamento gerado pela Obra (Fase 09): um dos dois vem preenchido.
            include: {
                servicePayment: { select: { id: true } },
                materialInstallment: { select: { id: true } },
            },
        });
    },
```

Em `src/modules/finance/services/transaction.service.ts`, `update` e `delete`
passam por uma checagem nova (importe `ConflictError`):

```ts
/**
 * Lançamentos gerados pela Obra (pagamento de serviço ou parcela de material)
 * só mudam pela Obra: senão o Financeiro e a Obra mostrariam valores diferentes.
 */
async function getEditableTransaction(ownerId: string, id: string) {
    const transaction = await getTransaction(ownerId, id);

    if (transaction.servicePayment || transaction.materialInstallment) {
        throw new ConflictError("Lançamento gerado pela Obra: altere em Financeiro → Obra.");
    }

    return transaction;
}

export async function updateTransaction(
    ownerId: string,
    id: string,
    input: UpdateTransactionInput,
) {
    await getEditableTransaction(ownerId, id);

    return transactionRepository.update(id, input);
}

export async function deleteTransaction(ownerId: string, id: string) {
    await getEditableTransaction(ownerId, id);
    await transactionRepository.delete(id);
}
```

### 10. Teste de integração (os dados da planilha)

`tests/integration/construction.service.test.ts`:

```ts
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db/prisma";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { createServicePaymentSchema } from "@/modules/construction/schemas/construction.schema";
import {
    createService,
    getService,
    listServices,
} from "@/modules/construction/services/contracted-service.service";
import { getConstructionDashboard } from "@/modules/construction/services/dashboard.service";
import { createGoal, setGoalDone } from "@/modules/construction/services/goal.service";
import {
    deleteServicePayment,
    registerServicePayment,
} from "@/modules/construction/services/payment.service";
import { addArea, createProject, getProject } from "@/modules/construction/services/project.service";
import {
    createPurchase,
    deletePurchase,
    listPurchases,
    payInstallment,
    unpayInstallment,
} from "@/modules/construction/services/purchase.service";
import { deleteTransaction } from "@/modules/finance/services/transaction.service";

/**
 * Integração: a Obra contra o PostgreSQL REAL, reproduzindo a planilha
 * "Lavanderia" (Fase 01, Oswaldo, compras parceladas) e conferindo que cada
 * pagamento vira um lançamento no Financeiro, sempre dentro da mesma transação.
 */

const owner = `it-obra-${randomUUID()}`;
const other = `it-obra-outra-${randomUUID()}`;
const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
let projectId: string;
let phaseId: string;
let eitaoId: string;

const pay = (serviceId: string, amountCents: number, paidOn: string) =>
    registerServicePayment(
        owner,
        createServicePaymentSchema.parse({ serviceId, amountCents, paidOn, method: "PIX" }),
    );

const constructionTransactions = () =>
    prisma.transaction.count({ where: { ownerId: owner, category: "CONSTRUCTION" } });

beforeAll(async () => {
    await prisma.user.createMany({
        data: [owner, other].map((id) => ({ id, name: id, email: `${id}@example.com` })),
    });

    const project = await createProject(owner, {
        name: "Lavanderia",
        startDate: day("2025-10-01"),
        plannedEndDate: day("2025-12-30"),
    });
    projectId = project.id;
    phaseId = (await getProject(owner, projectId)).phases[0].id;

    const base = { phaseId, professionalName: "Oswaldo", trade: "MASON" as const };
    const service = (description: string, contractedCents: number, extra = {}) =>
        createService(owner, projectId, { ...base, description, contractedCents, ...extra });

    eitaoId = (await service("Construção do eitão", 360000)).id;
    await service("Esgoto da lavanderia", 120000);
    await service("Reboque", 980500);
    await service("Calhas", 220000, { trade: "GUTTER_INSTALLER", professionalName: undefined });
    await service("Carpintaria", 300000, { trade: "CARPENTER", professionalName: undefined });
});

afterAll(async () => {
    // Pagamentos bloqueiam a exclusão do serviço (Restrict): saem primeiro.
    await prisma.servicePayment.deleteMany({ where: { service: { project: { ownerId: owner } } } });
    await prisma.constructionProject.deleteMany({ where: { ownerId: { in: [owner, other] } } });
    await prisma.transaction.deleteMany({ where: { ownerId: { in: [owner, other] } } });
    await prisma.user.deleteMany({ where: { id: { in: [owner, other] } } });
    await prisma.$disconnect();
});

describe("serviços e pagamentos", () => {
    it("a obra nasce com o ambiente 'Geral' e a 'Fase 01'", async () => {
        const project = await getProject(owner, projectId);

        expect(project.areas.map((a) => a.name)).toEqual(["Geral"]);
        expect(project.phases.map((p) => p.number)).toEqual([1]);
        await expect(addArea(owner, projectId, { name: "Geral" })).rejects.toBeInstanceOf(ConflictError);
    });

    it("3 pagamentos quitam o eitão e geram 3 lançamentos 'Obra' no Financeiro", async () => {
        await pay(eitaoId, 60000, "2025-10-03");
        await pay(eitaoId, 200000, "2025-10-11");
        await pay(eitaoId, 100000, "2025-10-18");

        const { summary } = await getService(owner, eitaoId);

        expect(summary).toMatchObject({ paidCents: 360000, remainingCents: 0, status: "PAID" });
        expect(summary.label).toBe("Fase 01 | Pedreiro | Construção do eitão");
        expect(await constructionTransactions()).toBe(3);
    });

    it("recusa pagar mais do que falta (e não cria lançamento)", async () => {
        await expect(pay(eitaoId, 1, "2025-10-20")).rejects.toBeInstanceOf(ValidationError);
        expect(await constructionTransactions()).toBe(3);
    });

    it("lançamento gerado pela Obra não pode ser excluído pelo Financeiro", async () => {
        const transaction = await prisma.transaction.findFirstOrThrow({
            where: { ownerId: owner, category: "CONSTRUCTION" },
        });

        await expect(deleteTransaction(owner, transaction.id)).rejects.toBeInstanceOf(ConflictError);
    });

    it("excluir um pagamento apaga o lançamento junto", async () => {
        const [payment] = await prisma.servicePayment.findMany({ where: { serviceId: eitaoId } });

        await deleteServicePayment(owner, payment.id);

        expect(await prisma.transaction.findUnique({ where: { id: payment.transactionId } })).toBeNull();
        await pay(eitaoId, payment.amountCents, payment.paidOn.toISOString().slice(0, 10));
    });

    it("outra usuária não enxerga nem paga o serviço", async () => {
        await expect(getService(other, eitaoId)).rejects.toBeInstanceOf(NotFoundError);
        await expect(
            registerServicePayment(
                other,
                createServicePaymentSchema.parse({
                    serviceId: eitaoId,
                    amountCents: 100,
                    paidOn: "2025-10-20",
                    method: "PIX",
                }),
            ),
        ).rejects.toBeInstanceOf(NotFoundError);
        expect(await listServices(other, projectId)).toEqual([]);
    });
});

describe("compras de material", () => {
    it("cartão 3x gera 3 parcelas a pagar; Pix gera 1 parcela já paga", async () => {
        await createPurchase(owner, projectId, {
            item: "Materiais de construção",
            supplier: "Construmarques",
            purchasedOn: day("2025-09-29"),
            totalCents: 115956,
            method: "CREDIT_CARD",
            installmentsCount: 3,
        });
        await createPurchase(owner, projectId, {
            item: "Madeira cobertura",
            supplier: "Coberfort",
            purchasedOn: day("2025-10-08"),
            totalCents: 700000,
            method: "PIX",
            installmentsCount: 1,
        });

        const [card, pix] = await listPurchases(owner, projectId);

        const plan = card.installments.map((i) => [i.dueOn.toISOString().slice(0, 10), i.amountCents]);

        expect(plan).toEqual([
            ["2025-10-29", 38652],
            ["2025-11-29", 38652],
            ["2025-12-29", 38652],
        ]);
        expect(card.status).toBe("INSTALLMENTS");
        expect(pix).toMatchObject({ status: "PAID", paidCents: 700000 });
        expect(await constructionTransactions()).toBe(4); // 3 do eitão + 1 do Pix
    });

    it("Pix em 2x é recusado", async () => {
        await expect(
            createPurchase(owner, projectId, {
                item: "Areia",
                purchasedOn: day("2025-10-24"),
                totalCents: 16000,
                method: "PIX",
                installmentsCount: 2,
            }),
        ).rejects.toBeInstanceOf(ValidationError);
    });

    it("pagar e desfazer uma parcela cria e apaga o lançamento", async () => {
        const [card] = await listPurchases(owner, projectId);
        const first = card.installments[0];

        await payInstallment(owner, first.id, day("2025-10-29"));
        expect(await constructionTransactions()).toBe(5);
        await expect(payInstallment(owner, first.id, day("2025-10-29"))).rejects.toBeInstanceOf(
            ConflictError,
        );

        await unpayInstallment(owner, first.id);
        expect(await constructionTransactions()).toBe(4);

        await payInstallment(owner, first.id, day("2025-10-29"));
    });
});

describe("dashboard", () => {
    it("bate com a planilha: Pedreiro R$ 14.605,00 com R$ 11.005,00 a pagar", async () => {
        const goal = await createGoal(owner, projectId, { title: "Rebocar todas as paredes" });
        await createGoal(owner, projectId, { title: "Comprar o chuveiro" });
        await setGoalDone(owner, goal.id, true, day("2025-11-15"));
        await setGoalDone(owner, goal.id, true, day("2025-11-20")); // repetir não muda a data

        const dash = await getConstructionDashboard(owner, projectId, day("2025-11-15"), "2025-11");

        expect(dash.labor.byTrade.find((row) => row.trade === "MASON")).toEqual({
            trade: "MASON",
            contractedCents: 1460500,
            remainingCents: 1100500,
        });
        expect(dash.labor).toMatchObject({ contractedCents: 1980500, paidCents: 360000, paidPercent: 18 });
        expect(dash.materials).toMatchObject({
            totalCents: 815956,
            paidCents: 738652,
            unpaidCents: 77304,
            installmentPurchasesUnpaidCents: 77304,
            dueThisMonthCents: 38652,
        });
        expect(dash.goals).toMatchObject({ total: 2, done: 1, percent: 50 });
        expect((await prisma.constructionGoal.findUniqueOrThrow({ where: { id: goal.id } })).doneAt).toEqual(
            day("2025-11-15"),
        );
        expect(dash.schedule).toEqual({ elapsedDays: 45, remainingDays: 45, percent: 50 });
        expect(dash.overall.investmentCents).toBe(1980500 + 815956);
    });

    it("excluir a compra apaga os lançamentos das parcelas pagas", async () => {
        const [card] = await listPurchases(owner, projectId);

        await deletePurchase(owner, card.id);

        expect(await constructionTransactions()).toBe(4); // 3 do eitão + 1 do Pix
    });
});
```

💡 O teste do dashboard confere **o mesmo número** do seu "Dashboard de
evolução": Pedreiro **R$ 14.605,00** com **R$ 11.005,00** a pagar.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/modules/construction/repositories/construction.repository.ts` | Criado | Leituras isoladas pela obra |
| `src/modules/construction/services/*.service.ts` | Criado | 6 serviços |
| `src/modules/construction/server.ts` | Criado | API de servidor |
| `src/modules/finance/repositories/transaction.repository.ts` | Alterado | Traz as ligações com a Obra |
| `src/modules/finance/services/transaction.service.ts` | Alterado | 409 para lançamento gerado |
| `tests/integration/construction.service.test.ts` | Criado | 11 testes |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run test:integration` | `Tests: 19 passed` |
| 2 | `npm test` | `Tests: 105 passed` |
| 3 | `npm run typecheck && npm run lint` | Sem erros |

**Critério de aceite:** os 3 testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Foreign key constraint violated: service_payment_serviceId_fkey` ao apagar a obra | Pagamentos bloqueiam (`Restrict`) | Apague os pagamentos antes (é proposital: dinheiro pago não some por acidente) |
| Lançamento "Obra" sobra no Financeiro | Escrita fora do `$transaction` | Toda escrita em duas tabelas usa `prisma.$transaction` |
| `relation "construction_project" does not exist` | Migration não aplicada no `admin_test` | Comando dos pré-requisitos |

## Commit sugerido

```bash
git add src/modules/construction src/modules/finance tests/integration/construction.service.test.ts
git commit -m "feat(obra): repositório e serviços com lançamento atômico no Financeiro"
```

## Referências

- [Prisma — Transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)
- [Prisma — Relation filters](https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries#relation-filters)

---

← [Passo anterior](04-schemas-e-tipos.md) · [Índice da fase](README.md) · [Próximo passo](06-api-rest.md) →
