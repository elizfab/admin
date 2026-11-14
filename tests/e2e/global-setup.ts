import { execSync } from "node:child_process";

import { Client } from "pg";

import { assertTestDatabase, E2E_DATABASE_URL, e2eServerEnv, testUsers } from "./support/e2e-env";

/**
 * Executado UMA vez antes de todos os testes E2E:
 * 1. garante que o banco de teste existe;
 * 2. aplica as migrations (não destrutivo);
 * 3. limpa os dados das tabelas;
 * 4. cria as duas contas de teste.
 */
export default async function globalSetup() {
    const databaseName = assertTestDatabase(E2E_DATABASE_URL);
    const env = { ...process.env, ...e2eServerEnv };

    await createDatabaseIfMissing(databaseName);

    execSync("npx prisma migrate deploy", { env, stdio: "inherit" });

    await truncateAllTables();

    for (const user of Object.values(testUsers)) {
        execSync("npx prisma db seed", {
            env: {
                ...env,
                SEED_ADMIN_NAME: user.name,
                SEED_ADMIN_EMAIL: user.email,
                SEED_ADMIN_PASSWORD: user.password,
            },
            stdio: "inherit",
        });
    }
}

async function createDatabaseIfMissing(databaseName: string) {
    // Conecta no banco administrativo "postgres" para poder criar o de teste.
    const adminUrl = new URL(E2E_DATABASE_URL);
    adminUrl.pathname = "/postgres";

    const client = new Client({ connectionString: adminUrl.toString() });
    await client.connect();

    try {
        const { rowCount } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [
            databaseName,
        ]);

        if (rowCount === 0) {
            // Nome já validado por assertTestDatabase (só letras/_ e termina em _test).
            await client.query(`CREATE DATABASE "${databaseName}"`);
        }
    } finally {
        await client.end();
    }
}

async function truncateAllTables() {
    const client = new Client({ connectionString: E2E_DATABASE_URL });
    await client.connect();

    try {
        const { rows } = await client.query<{ tablename: string }>(
            `SELECT tablename FROM pg_tables
       WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`,
        );

        if (rows.length > 0) {
            const tables = rows.map(({ tablename }) => `"public"."${tablename}"`).join(", ");
            await client.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
        }
    } finally {
        await client.end();
    }
}
