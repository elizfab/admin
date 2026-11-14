import { Client } from "pg";

/**
 * Conecta no banco administrativo "postgres" e cria o banco de teste
 * se ele ainda não existir. Usado tanto pelo globalSetup quanto pelo
 * script prepare-database (que roda antes do servidor subir, pois o
 * health check só responde 200 quando o banco já existe).
 */
export async function createDatabaseIfMissing(databaseName: string, connectionString: string) {
    const adminUrl = new URL(connectionString);
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
