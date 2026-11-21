import { randomUUID } from "node:crypto";

import { monthRange } from "@/lib/dates/month";
import { prisma } from "@/lib/db/prisma";
import { transactionRepository } from "@/modules/finance/repositories/transaction.repository";

/**
 * Integração: repositório do Financeiro contra o PostgreSQL REAL (admin_test).
 * Prova o que os dublês não provam: filtro por dona, limites do mês
 * (coluna DATE) e as SOMAS feitas pelo banco (groupBy).
 */

const ownerA = `it-fin-a-${randomUUID()}`;
const ownerB = `it-fin-b-${randomUUID()}`;
const november = monthRange("2026-11");
const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

beforeAll(async () => {
    await prisma.user.createMany({
        data: [ownerA, ownerB].map((id) => ({ id, name: id, email: `${id}@example.com` })),
    });

    // Atalho para montar os lançamentos de teste em uma linha cada.
    const tx = (
        ownerId: string,
        type: "INCOME" | "EXPENSE",
        amountCents: number,
        isoDay: string,
        category: "SALARY" | "FOOD" | "HOUSING" | "OTHER" = "OTHER",
    ) => ({ ownerId, type, amountCents, occurredOn: day(isoDay), category, description: "Teste" });

    await prisma.transaction.createMany({
        data: [
            tx(ownerA, "INCOME", 500000, "2026-11-05", "SALARY"),
            tx(ownerA, "EXPENSE", 12345, "2026-11-01", "FOOD"),
            tx(ownerA, "EXPENSE", 20000, "2026-11-30", "HOUSING"),
            tx(ownerA, "EXPENSE", 655, "2026-11-15", "FOOD"),
            // Fora do mês (limites): 31/10 e 01/12 não podem entrar em novembro.
            tx(ownerA, "EXPENSE", 99999, "2026-10-31"),
            tx(ownerA, "EXPENSE", 99999, "2026-12-01"),
            // De outra dona, no mesmo mês.
            tx(ownerB, "EXPENSE", 77777, "2026-11-10"),
        ],
    });
});

afterAll(async () => {
    await prisma.transaction.deleteMany({ where: { ownerId: { in: [ownerA, ownerB] } } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerA, ownerB] } } });
    await prisma.$disconnect();
});

describe("transactionRepository (banco real)", () => {
    it("lista só a dona e só o mês, incluindo o 1º e o último dia", async () => {
        const list = await transactionRepository.listByOwnerInRange(ownerA, november);

        expect(list).toHaveLength(4);
        expect(list.every((t) => t.ownerId === ownerA)).toBe(true);
        // Ordem: mais recente primeiro.
        expect(list.map((t) => t.occurredOn.toISOString().slice(0, 10))).toEqual([
            "2026-11-30",
            "2026-11-15",
            "2026-11-05",
            "2026-11-01",
        ]);
    });

    it("sumByType soma no banco, por tipo", async () => {
        const totals = await transactionRepository.sumByType(ownerA, november);
        const byType = Object.fromEntries(totals.map((row) => [row.type, row._sum.amountCents]));

        expect(byType).toEqual({ INCOME: 500000, EXPENSE: 33000 });
    });

    it("sumExpensesByCategory agrupa só despesas, da maior para a menor", async () => {
        const rows = await transactionRepository.sumExpensesByCategory(ownerA, november);

        expect(rows.map((row) => [row.category, row._sum.amountCents])).toEqual([
            ["HOUSING", 20000],
            ["FOOD", 13000],
        ]);
    });

    it("findByIdForOwner não encontra transação de outra dona", async () => {
        const [fromB] = await transactionRepository.listByOwnerInRange(ownerB, november);

        await expect(transactionRepository.findByIdForOwner(fromB.id, ownerA)).resolves.toBeNull();
    });
});
