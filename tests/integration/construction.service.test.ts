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
