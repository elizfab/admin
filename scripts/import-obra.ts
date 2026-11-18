/**
 * Importa os dados da planilha da obra (Fase 09, passo 10) para o Admin.
 *
 * Uso:
 *   npx tsx scripts/import-obra.ts <pasta-com-os-CSVs>
 *
 * Espera nesta pasta os CSVs exportados da planilha (Arquivo → Fazer
 * download → .csv):
 *   - servicos.csv       (aba "Serviços contratados")
 *   - pagamentos.csv     (aba "Pagamentos realizados")
 *   - compras.csv        (aba "Gestão de compras de materiais")
 *   - metas.csv          (aba "Metas")
 *
 * O script chama os SERVIÇOS do módulo (nunca o Prisma direto), então as
 * mesmas regras valem: pagamento não passa do que falta, compra gera as
 * parcelas e cada pagamento vira uma despesa "Obra" no Financeiro.
 *
 * Ajuste os nomes das colunas em COLUMN_MAP conforme o seu CSV real.
 * Rode primeiro no banco LOCAL; para produção, aponte DATABASE_URL só no
 * terminal — nunca grave credenciais em arquivo.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { parseMoneyToCents } from "../src/lib/money/money";

// ─── Ajuste aqui conforme os cabeçalhos do SEU CSV ─────────────
const COLUMN_MAP = {
    servicos: {
        idAutomatico: "id", // "Fase 01 | Pedreiro | Construção do eitão"
        fase: "fase", // "Fase 01"
        profissao: "profissao", // "Pedreiro"
        profissional: "profissional",
        descricao: "descricao",
        ambiente: "ambiente",
        contratado: "contratado", // "9.805,00"
    },
    pagamentos: {
        idAutomatico: "servico", // casa com o ID automático do serviço
        data: "data", // "17/11/2025"
        valor: "valor",
        forma: "forma", // "Pix", "Dinheiro", "Cartão"…
    },
    compras: {
        item: "item",
        loja: "loja",
        data: "data",
        valor: "valor",
        forma: "forma",
        parcelas: "parcelas", // "1x", "3x", "30 dias", "Pago"…
        ambiente: "ambiente",
    },
    metas: {
        meta: "meta",
        ambiente: "ambiente",
        concluida: "concluida", // "sim"/data de conclusão
    },
} as const;

const TRADE_BY_LABEL: Record<string, string> = {
    pedreiro: "MASON",
    carpinteiro: "CARPENTER",
    azulejista: "TILER",
    eletricista: "ELECTRICIAN",
    encanador: "PLUMBER",
    calheiro: "GUTTER_INSTALLER",
    pintor: "PAINTER",
    vidraceiro: "GLAZIER",
};

const METHOD_BY_LABEL: Record<string, string> = {
    pix: "PIX",
    dinheiro: "CASH",
    "cartão de débito": "DEBIT_CARD",
    débito: "DEBIT_CARD",
    "cartão de crédito": "CREDIT_CARD",
    crédito: "CREDIT_CARD",
    "cartão": "CREDIT_CARD",
    transferência: "BANK_TRANSFER",
    boleto: "BOLETO",
};

// ─── Utilidades de CSV e datas ─────────────────────────────────

function parseCsv(text: string): Record<string, string>[] {
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0].split(";").map((h) => h.trim().toLowerCase());

    return lines.slice(1).map((line) => {
        const cells = line.split(";").map((c) => c.trim());
        return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""]));
    });
}

/** "17/11/2025" → Date UTC; já ISO passa direto. */
function parseBrDate(value: string): Date {
    const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
    if (br) return new Date(Date.UTC(+br[3], +br[2] - 1, +br[1]));
    return new Date(`${value.trim()}T00:00:00.000Z`);
}

function normalize(value: string) {
    return value.trim().toLowerCase();
}

function tradeOf(label: string) {
    return TRADE_BY_LABEL[normalize(label)] ?? "OTHER";
}

function methodOf(label: string) {
    return METHOD_BY_LABEL[normalize(label)] ?? "PIX";
}

// ─── Importação ────────────────────────────────────────────────

async function main() {
    const folder = process.argv[2];
    if (!folder) {
        console.error("Uso: npx tsx scripts/import-obra.ts <pasta-com-os-CSVs>");
        process.exit(1);
    }

    const { prisma } = await import("../src/lib/db/prisma");
    const services = await import("../src/modules/construction/server");

    const owner = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
    if (!owner) throw new Error("Nenhuma usuária no banco. Rode o seed antes.");
    const ownerId = owner.id;

    const read = (file: string) => parseCsv(readFileSync(join(folder, file), "utf8"));

    // 1. Obra + fases + ambientes + serviços
    await services.createProject(ownerId, {
        name: "Lavanderia",
        startDate: undefined,
        plannedEndDate: undefined,
    });
    // createProject devolve a obra sem os includes; busca com áreas/fases.
    const created = await prisma.constructionProject.findFirstOrThrow({
        where: { ownerId, name: "Lavanderia" },
    });
    const project = await services.getProject(ownerId, created.id);

    const phaseByLabel = new Map<string, string>();
    const areaByLabel = new Map<string, string>();
    const serviceByAutoId = new Map<string, string>();

    for (const area of project.areas) areaByLabel.set(normalize(area.name), area.id);
    for (const phase of project.phases) {
        phaseByLabel.set(normalize(`fase ${String(phase.number).padStart(2, "0")}`), phase.id);
        phaseByLabel.set(normalize(`fase ${phase.number}`), phase.id);
    }

    for (const row of read("servicos.csv")) {
        const c = COLUMN_MAP.servicos;
        const phaseLabel = row[c.fase];
        const phaseId = phaseByLabel.get(normalize(phaseLabel));
        if (!phaseId) {
            // Fase nova? cria na numeração seguinte.
            const next = Math.max(0, ...project.phases.map((p) => p.number)) + 1;
            const created = await services.addPhase(ownerId, project.id, {
                number: next,
                name: phaseLabel.replace(/^fase\s*/i, "") || undefined,
            });
            phaseByLabel.set(normalize(phaseLabel), created.id);
            project.phases.push(created);
        }

        let areaId: string | undefined;
        const areaName = row[c.ambiente];
        if (areaName) {
            const key = normalize(areaName);
            if (!areaByLabel.has(key)) {
                const created = await services.addArea(ownerId, project.id, { name: areaName });
                areaByLabel.set(key, created.id);
            }
            areaId = areaByLabel.get(key);
        }

        const service = await services.createService(ownerId, project.id, {
            phaseId: phaseByLabel.get(normalize(phaseLabel))!,
            areaId,
            trade: tradeOf(row[c.profissao]) as never,
            professionalName: row[c.profissional] || undefined,
            description: row[c.descricao],
            contractedCents: parseMoneyToCents(row[c.contratado]),
        });
        serviceByAutoId.set(normalize(row[c.idAutomatico]), service.id);
    }

    // 2. Pagamentos (cada um vira uma despesa "Obra" no Financeiro)
    for (const row of read("pagamentos.csv")) {
        const c = COLUMN_MAP.pagamentos;
        const serviceId = serviceByAutoId.get(normalize(row[c.idAutomatico]));
        if (!serviceId) {
            console.warn(`Pagamento sem serviço correspondente: ${row[c.idAutomatico]}`);
            continue;
        }
        await services.registerServicePayment(ownerId, {
            serviceId,
            paidOn: parseBrDate(row[c.data]),
            amountCents: parseMoneyToCents(row[c.valor]),
            method: methodOf(row[c.forma]) as never,
            notes: undefined,
        });
    }

    // 3. Compras de material
    for (const row of read("compras.csv")) {
        const c = COLUMN_MAP.compras;
        const label = normalize(row[c.parcelas]);
        const paid = label === "pago" || label === "quitado";
        const match = /(\d+)\s*x/.exec(label);
        const installmentsCount = paid ? 1 : match ? Number(match[1]) : 1;
        const method = paid ? "PIX" : /cart|cr[eé]dito/.test(label) ? "CREDIT_CARD" : methodOf(row[c.forma]);

        await services.createPurchase(ownerId, project.id, {
            item: row[c.item],
            supplier: row[c.loja] || undefined,
            purchasedOn: parseBrDate(row[c.data]),
            totalCents: parseMoneyToCents(row[c.valor]),
            method: method as never,
            installmentsCount,
            firstDueOn: undefined,
            notes: undefined,
        });
    }

    // 4. Metas
    for (const row of read("metas.csv")) {
        const c = COLUMN_MAP.metas;
        await services.createGoal(ownerId, project.id, {
            title: row[c.meta],
            areaId: areaByLabel.get(normalize(row[c.ambiente] ?? "")),
        });
    }

    const dashboard = await services.getConstructionDashboard(ownerId, project.id, new Date(), "2026-01");
    console.log("Importação concluída:", project.name);
    console.log(`  Mão de obra: ${dashboard.labor.servicesCount} serviços`);
    console.log(`  Investimento total: R$ ${(dashboard.overall.investmentCents / 100).toFixed(2)}`);

    await prisma.$disconnect();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
