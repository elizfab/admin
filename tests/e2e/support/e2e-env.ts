/**
 * Configuração do ambiente de testes E2E.
 * Tudo aqui é FICTÍCIO e LOCAL: banco próprio de teste e contas de teste.
 * Nunca aponte estes valores para o banco de desenvolvimento ou de produção.
 */

export const E2E_PORT = 3100;
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;

export const E2E_DATABASE_URL =
    process.env.E2E_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/admin_test";

/** Variáveis repassadas ao servidor Next.js e aos comandos do Prisma durante os testes. */
export const e2eServerEnv = {
    DATABASE_URL: E2E_DATABASE_URL,
    DIRECT_URL: E2E_DATABASE_URL,
    BETTER_AUTH_URL: E2E_BASE_URL,
    BETTER_AUTH_SECRET: "segredo-apenas-para-testes-e2e-nao-usar-em-producao",
};

export const testUsers = {
    owner: {
        name: "Dona E2E",
        email: "dona.e2e@example.com",
        password: "dona-e2e-senha-forte-123",
        storageState: "playwright/.auth/owner.json",
    },
    other: {
        name: "Outra E2E",
        email: "outra.e2e@example.com",
        password: "outra-e2e-senha-forte-123",
        storageState: "playwright/.auth/other.json",
    },
} as const;

/** Trava de segurança: só aceita bancos cujo nome termina em "_test". */
export function assertTestDatabase(url: string) {
    const databaseName = new URL(url).pathname.replace(/^\//, "");

    if (!databaseName.endsWith("_test")) {
        throw new Error(
            `Banco "${databaseName}" recusado: os testes só rodam em bancos cujo nome termina com "_test".`,
        );
    }

    return databaseName;
}
