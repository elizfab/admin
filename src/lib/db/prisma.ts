import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

// Em desenvolvimento, o Next.js recarrega módulos a cada alteração (hot reload).
// Guardar a instância em globalThis evita abrir uma nova conexão a cada recarga.
const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
};

function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error("DATABASE_URL não está definida.");
    }

    const adapter = new PrismaPg({ connectionString });

    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
