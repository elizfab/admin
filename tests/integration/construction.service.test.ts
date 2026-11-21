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
import {
    addArea,
    createProject,
    getProject,
    updateProject,
} from "@/modules/construction/services/project.service";
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
        await expect(addArea(owner, projectId, { name: "Geral" })).rejects.toBeInstanceOf(
            ConflictError,
        );
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

        await expect(deleteTransaction(owner, transaction.id)).rejects.toBeInstanceOf(
            ConflictError,
        );
    });

    it("excluir um pagamento apaga o lançamento junto", async () => {
        const [payment] = await prisma.servicePayment.findMany({ where: { serviceId: eitaoId } });

        await deleteServicePayment(owner, payment.id);

        expect(
            await prisma.transaction.findUnique({ where: { id: payment.transactionId } }),
        ).toBeNull();
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

        const plan = card.installments.map((i) => [
            i.dueOn.toISOString().slice(0, 10),
            i.amountCents,
        ]);

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
        expect(dash.labor).toMatchObject({
            contractedCents: 1980500,
            paidCents: 360000,
            paidPercent: 18,
        });
        expect(dash.materials).toMatchObject({
            totalCents: 815956,
            paidCents: 738652,
            unpaidCents: 77304,
            installmentPurchasesUnpaidCents: 77304,
            dueThisMonthCents: 38652,
        });
        expect(dash.goals).toMatchObject({ total: 2, done: 1, percent: 50 });
        expect(
            (await prisma.constructionGoal.findUniqueOrThrow({ where: { id: goal.id } })).doneAt,
        ).toEqual(day("2025-11-15"));
        expect(dash.schedule).toEqual({ elapsedDays: 45, remainingDays: 45, percent: 50 });
        expect(dash.overall.investmentCents).toBe(1980500 + 815956);
    });

    it("excluir a compra apaga os lançamentos das parcelas pagas", async () => {
        const [card] = await listPurchases(owner, projectId);

        await deletePurchase(owner, card.id);

        expect(await constructionTransactions()).toBe(4); // 3 do eitão + 1 do Pix
    });
});

describe("categorias e paginação dos cards (ETAPA 05)", () => {
    it("createProject grava categoryIds e updateProject troca a lista", async () => {
        const obra = await createProject(owner, {
            name: "Teste categorias",
            categoryIds: ["lavanderia", "banheiro-lavanderia"],
        });

        expect((await getProject(owner, obra.id)).categoryIds).toEqual([
            "lavanderia",
            "banheiro-lavanderia",
        ]);

        await updateProject(owner, obra.id, { categoryIds: [] });
        expect((await getProject(owner, obra.id)).categoryIds).toEqual([]);

        await prisma.constructionProject.delete({ where: { id: obra.id } });
    });

    it("listProjectCards filtra por categoria e isola por dona", async () => {
        const { listProjectCards, countProjectsByCategory } =
            await import("@/modules/construction/services/project.service");
        const obra = await createProject(owner, {
            name: "Obra filtrada",
            categoryIds: ["escritorio-lavanderia"],
        });

        const escritorio = await listProjectCards(owner, {
            categoryId: "escritorio-lavanderia",
        });
        expect(escritorio.items.map((p) => p.id)).toContain(obra.id);

        const lavanderia = await listProjectCards(owner, { categoryId: "lavanderia" });
        expect(lavanderia.items.map((p) => p.id)).not.toContain(obra.id);

        const banheiro = await listProjectCards(owner, { categoryId: "banheiro-lavanderia" });
        expect(banheiro.items.map((p) => p.id)).not.toContain(obra.id);

        const sem = await listProjectCards(owner, { uncategorized: true });
        // A obra do beforeAll não tem categoria; a "Obra filtrada" também não entra aqui.
        expect(sem.items.map((p) => p.id)).toContain(projectId);

        const { counts, uncategorized } = await countProjectsByCategory(owner);
        expect(counts.get("escritorio-lavanderia")).toBe(1);
        expect(uncategorized).toBeGreaterThanOrEqual(1);

        // Outra dona não vê nada.
        const alheio = await listProjectCards(other, { categoryId: "lavanderia" });
        expect(alheio.items).toHaveLength(0);

        await prisma.constructionProject.delete({ where: { id: obra.id } });
    });

    it("paginação: 13 obras → 12 + hasMore; ordenação do mais recente", async () => {
        const { listProjectCards } =
            await import("@/modules/construction/services/project.service");
        const criadas: string[] = [];
        for (let i = 0; i < 13; i++) {
            const obra = await createProject(owner, {
                name: `Paginacao ${String(i).padStart(2, "0")}`,
                startDate: day(`2026-01-${String(i + 1).padStart(2, "0")}`),
                categoryIds: ["lavanderia"],
            });
            criadas.push(obra.id);
        }

        const primeira = await listProjectCards(owner, { categoryId: "lavanderia" });
        expect(primeira.items).toHaveLength(12);
        expect(primeira.hasMore).toBe(true);
        // Mais recente primeiro: 2026-01-13 é a primeira.
        expect(primeira.items[0].startDate).toEqual(day("2026-01-13"));

        const segunda = await listProjectCards(owner, { categoryId: "lavanderia" }, 12);
        expect(segunda.items).toHaveLength(1);
        expect(segunda.hasMore).toBe(false);

        await prisma.constructionProject.deleteMany({ where: { id: { in: criadas } } });
    });

    it("rejeita fim previsto antes do início (criação e atualização)", async () => {
        await expect(
            createProject(owner, {
                name: "Datas invertidas",
                startDate: day("2026-05-10"),
                plannedEndDate: day("2026-05-01"),
            }),
        ).rejects.toBeInstanceOf(ValidationError);

        await expect(
            updateProject(owner, projectId, { plannedEndDate: day("2025-01-01") }),
        ).rejects.toBeInstanceOf(ValidationError);
    });

    it("datas iguais mantêm ordem estável por id", async () => {
        const { listProjectCards } =
            await import("@/modules/construction/services/project.service");
        const criadas: string[] = [];
        for (const nome of ["Empate A", "Empate B"]) {
            const obra = await createProject(owner, {
                name: nome,
                startDate: day("2026-03-01"),
                categoryIds: ["lavanderia"],
            });
            criadas.push(obra.id);
        }

        const pagina = await listProjectCards(owner, { categoryId: "lavanderia" });
        const ids = pagina.items.map((p) => p.id);
        const posA = ids.indexOf(criadas[0]);
        const posB = ids.indexOf(criadas[1]);
        expect(posA).toBeGreaterThanOrEqual(0);
        expect(posB).toBeGreaterThanOrEqual(0);
        // Desempate estável: id crescente.
        expect(criadas[0] < criadas[1] ? posA < posB : posB < posA).toBe(true);

        await prisma.constructionProject.deleteMany({ where: { id: { in: criadas } } });
    });

    it("listProjectCards sem filtro lista todas as obras da dona", async () => {
        const { listProjectCards } =
            await import("@/modules/construction/services/project.service");

        const pagina = await listProjectCards(owner, {});

        expect(pagina.items.map((p) => p.id)).toContain(projectId);
        expect(pagina.items.length).toBeLessThanOrEqual(12);
    });
});

describe("listagens e conflitos de unicidade (ETAPA 05)", () => {
    it("listProjects devolve as obras da dona da mais recente à mais antiga", async () => {
        const { listProjects } = await import("@/modules/construction/services/project.service");

        const projects = await listProjects(owner);

        expect(projects.length).toBeGreaterThanOrEqual(1);
        expect(projects.map((p) => p.id)).toContain(projectId);
        const starts = projects.map((p) => p.startDate?.getTime() ?? -Infinity);
        expect(starts).toEqual([...starts].sort((a, b) => b - a));
    });

    it("listPayments devolve os pagamentos da obra (com serviço e fase)", async () => {
        const { listPayments } = await import("@/modules/construction/services/payment.service");

        const payments = await listPayments(owner, projectId);

        expect(payments.length).toBeGreaterThanOrEqual(3);
        expect(payments.every((p) => p.service.projectId === projectId)).toBe(true);
    });

    it("nome de obra repetido → ConflictError na criação e na atualização", async () => {
        await expect(createProject(owner, { name: "Lavanderia" })).rejects.toBeInstanceOf(
            ConflictError,
        );

        const obra = await createProject(owner, { name: "Obra conflito" });
        await expect(updateProject(owner, obra.id, { name: "Lavanderia" })).rejects.toBeInstanceOf(
            ConflictError,
        );
        await prisma.constructionProject.delete({ where: { id: obra.id } });
    });

    it("addPhase cria a fase 2 e recusa número repetido", async () => {
        const { addPhase } = await import("@/modules/construction/services/project.service");

        const fase = await addPhase(owner, projectId, { number: 2, name: "Alvenaria" });
        expect(fase.number).toBe(2);

        await expect(addPhase(owner, projectId, { number: 2 })).rejects.toBeInstanceOf(
            ConflictError,
        );
        await prisma.constructionPhase.delete({ where: { id: fase.id } });
    });

    it("obra de outra dona: getProject → 404", async () => {
        await expect(getProject(other, projectId)).rejects.toBeInstanceOf(NotFoundError);
    });
});
