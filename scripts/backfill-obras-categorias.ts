/**
 * Preenchimento idempotente de `categoryIds` das obras existentes (ETAPA 05 §3).
 *
 * - "Construção do eitão"        → ["lavanderia"]
 * - "Azulejo das paredes do banheiro" → ["banheiro-lavanderia"]
 *
 * Pode rodar quantas vezes quiser: só grava quando categoryIds está vazio
 * e o nome casa (nunca sobrescreve categoria já definida pela usuária).
 *
 * Uso:  npx tsx scripts/backfill-obras-categorias.ts
 * Rollback: UPDATE construction_project SET "categoryIds" = '{}'
 *           WHERE "categoryIds" && ARRAY['lavanderia','banheiro-lavanderia'];
 */
import { config } from "dotenv";

// O Next.js carrega o .env.local sozinho; o tsx, não (mesmo padrão do seed).
// O client do Prisma nasce no import, então o env precisa vir antes.
config({ path: ".env.local", quiet: true });

const BACKFILL: { nameIncludes: string; categoryIds: string[] }[] = [
    { nameIncludes: "eitão", categoryIds: ["lavanderia"] },
    { nameIncludes: "azulejo", categoryIds: ["banheiro-lavanderia"] },
];

async function main() {
    // O client do Prisma nasce no import, então o env precisa vir antes.
    const { prisma } = await import("../src/lib/db/prisma");
    let updated = 0;

    for (const rule of BACKFILL) {
        const result = await prisma.constructionProject.updateMany({
            where: {
                name: { contains: rule.nameIncludes, mode: "insensitive" },
                categoryIds: { isEmpty: true },
            },
            data: { categoryIds: rule.categoryIds },
        });
        updated += result.count;
        console.log(
            `"${rule.nameIncludes}" → ${rule.categoryIds.join(", ")}: ${result.count} obra(s)`,
        );
    }

    console.log(`Concluído: ${updated} obra(s) categorizada(s).`);

    await prisma.$disconnect();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
