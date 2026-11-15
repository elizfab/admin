import { assertTestDatabase, E2E_DATABASE_URL } from "./e2e-env";
import { createDatabaseIfMissing } from "./test-database";

/**
 * Executado pelo webServer do Playwright ANTES do `next build`/`next start`:
 * o health check (/api/v1/health) só responde 200 quando o banco existe,
 * e o globalSetup (que rodaria depois) só executa quando o servidor
 * já está no ar. Por isso a criação do banco precisa acontecer aqui.
 * O restante da preparação (migrations, limpeza e contas) continua
 * no global-setup.ts.
 */
async function main() {
    const databaseName = assertTestDatabase(E2E_DATABASE_URL);
    await createDatabaseIfMissing(databaseName, E2E_DATABASE_URL);
}

main().catch((error) => {
    console.error("[e2e] falha ao preparar o banco de teste:", error);
    process.exit(1);
});
