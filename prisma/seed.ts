/**
 * Seed da conta administradora inicial.
 *
 * - Lê nome, e-mail e senha de variáveis de ambiente (nunca do código).
 * - Gera o hash com o mesmo algoritmo do Better Auth (scrypt).
 * - É idempotente: rodar duas vezes não duplica dados.
 *
 * Executar: npx prisma db seed
 */
import { randomUUID } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { config } from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client";
import { defaultDashboardModules } from "../src/modules/dashboard/defaults";

config({ path: ".env.local", quiet: true });

function requireEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Variável de ambiente ausente: ${name}`);
    }

    return value;
}

async function main() {
    const name = requireEnv("SEED_ADMIN_NAME");
    const email = requireEnv("SEED_ADMIN_EMAIL").toLowerCase();
    const password = requireEnv("SEED_ADMIN_PASSWORD");

    if (password.length < 12) {
        throw new Error("SEED_ADMIN_PASSWORD precisa ter pelo menos 12 caracteres.");
    }

    const prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: requireEnv("DIRECT_URL") }),
    });

    try {
        const existing = await prisma.user.findUnique({ where: { email } });

        if (existing) {
            console.log(`Administradora já existe (${email}). Nada foi alterado.`);
            return;
        }

        const userId = randomUUID();

        // Transação: cria usuário, credencial e os cards iniciais do Dashboard juntos, ou nada.
        await prisma.$transaction([
            prisma.user.create({
                data: {
                    id: userId,
                    name,
                    email,
                    emailVerified: true,
                    role: "ADMIN",
                },
            }),
            prisma.account.create({
                data: {
                    id: randomUUID(),
                    userId,
                    accountId: userId,
                    providerId: "credential", // login por e-mail e senha
                    password: await hashPassword(password),
                },
            }),
            // createdAt com 1 ms de diferença mantém a ordem dos cards (mais antigo primeiro).
            prisma.dashboardModule.createMany({
                data: defaultDashboardModules.map((card, index) => ({
                    ...card,
                    ownerId: userId,
                    createdAt: new Date(Date.now() + index),
                })),
            }),
        ]);

        console.log(`✅ Administradora criada com sucesso!: ${email}`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
