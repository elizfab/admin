# Passo 03 — Preparação do banco e das sessões

> **Fase:** 05 — Testes E2E\
> **Tempo estimado:** 40 min\
> **Depende de:** [Passo 02](02-instalar-playwright.md)

## Objetivo

Antes de cada execução da suíte: deixar o banco de teste **sempre no mesmo
estado inicial**, criar as duas contas e salvar as sessões logadas.

## 💡 Por que

### Testes precisam começar sempre do mesmo ponto

Se uma execução deixasse um projeto chamado “Portal” no banco, a próxima,
ao tentar criar “Portal”, receberia “nome já existe” e falharia **sem nenhum
bug no código**. É o chamado teste *flaky* (instável). 💡 Antes de cada
aula, a lousa é apagada.

| Etapa | Comando ou ação | Destrutivo? |
|---|---|---|
| 1. Criar o banco, se faltar | `CREATE DATABASE admin_test` | Não |
| 2. Aplicar migrations | `prisma migrate deploy` | Não (só aplica o que falta) |
| 3. Limpar os dados | `TRUNCATE` de todas as tabelas | Sim, **só** no banco que passou pela trava `_test` |
| 4. Criar as contas | `prisma db seed` (2 vezes) | Não |

💡 O `TRUNCATE` também zera a tabela `rateLimit`. Por isso rodar a suíte
duas vezes seguidas não esbarra no limite de 5 logins por minuto
(validado).

### Por que salvar sessões (`storageState`)

Fazer login pela tela em **cada** teste seria lento e estouraria o rate
limit. O arquivo `auth.setup.ts` faz login **uma vez** por usuária, pela
API, e salva os cookies em `playwright/.auth/*.json`. Os testes carregam
esses cookies e já começam logados. 💡 É como ganhar uma pulseira na
entrada do evento, em vez de mostrar o ingresso em cada sala.

## Pré-requisitos

- Passo 02 concluído; banco local rodando.

## Passo a passo

### 1. Criação antecipada do banco — `tests/e2e/support/test-database.ts` e `prepare-database.ts`

💡 **Por que este passo existe:** o Playwright sobe o `webServer` e espera
`/api/v1/health` responder **antes** de rodar o `globalSetup`. O health
check responde `503` enquanto o banco não existe — e quem aplicaria as
migrations e criaria as tabelas é o próprio `globalSetup`. Sem criar o
banco antes, o servidor nunca fica pronto e a execução morre com
`Process from config.webServer exited early` ou
`Timed out waiting 180000ms from config.webServer`.

A solução é criar **apenas o banco** (sem migrations) no início do
`webServer.command`, antes do `build`/`start`. O `globalSetup` continua
responsável por migrations, limpeza e contas.

`tests/e2e/support/test-database.ts`:

```ts
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
```

`tests/e2e/support/prepare-database.ts`:

```ts
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
```

| Arquivo | Papel |
|---|---|
| `test-database.ts` | Função `createDatabaseIfMissing` compartilhada (conecta no banco `postgres` e cria o `_test`) |
| `prepare-database.ts` | Script avulso rodado por `npx tsx` dentro do `webServer.command` |

> O `tsx` já é dependência de desenvolvimento do projeto (usado pelo seed
> do Prisma), então nenhum pacote novo é necessário.

### 2. Preparação global — `tests/e2e/global-setup.ts`

`tests/e2e/global-setup.ts`:

```ts
import { execSync } from "node:child_process";

import { Client } from "pg";

import { assertTestDatabase, E2E_DATABASE_URL, e2eServerEnv, testUsers } from "./support/e2e-env";
import { createDatabaseIfMissing } from "./support/test-database";

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

    await createDatabaseIfMissing(databaseName, E2E_DATABASE_URL);

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
```

| Trecho | Explicação |
|---|---|
| `assertTestDatabase(...)` | **Primeira linha** da função: se o banco não for `_test`, nada acontece |
| `createDatabaseIfMissing(...)` | Idempotente: se o `prepare-database` já criou o banco, aqui é um no-op |
| `env: { ...process.env, ...e2eServerEnv }` | O Prisma recebe as URLs do banco de teste (prioridade sobre o `.env.local`) |
| `RESTART IDENTITY CASCADE` | Zera contadores e respeita as chaves estrangeiras |

### 3. Sessões — `tests/e2e/auth.setup.ts`

`tests/e2e/auth.setup.ts`:

```ts
import { expect, test as setup } from "@playwright/test";

import { E2E_BASE_URL, testUsers } from "./support/e2e-env";

/**
 * Faz login uma vez por usuária e salva os cookies em arquivo (storageState).
 * Os testes reaproveitam essas sessões em vez de logar de novo a cada teste,
 * o que é mais rápido e não esbarra no rate limit de login (5/minuto).
 */
for (const [key, user] of Object.entries(testUsers)) {
  setup(`autentica ${key}`, async ({ request }) => {
    const response = await request.post("/api/auth/sign-in/email", {
      data: { email: user.email, password: user.password },
      headers: { Origin: E2E_BASE_URL },
    });

    expect(response.ok()).toBeTruthy();

    await request.storageState({ path: user.storageState });
  });
}
```

💡 O cabeçalho `Origin` é exigido pela proteção CSRF do Better Auth (Fase
03): sem ele, o login responde `403`.

### 4. Ajuste no `playwright.config.ts`

No `webServer` do `playwright.config.ts` (criado no passo 02), troque o
`command` para executar o `prepare-database.ts` **antes** do build:

```ts
  // Sobe a aplicação de PRODUÇÃO (build + start) apontando para o banco de teste.
  webServer: {
    // O banco precisa existir ANTES do servidor subir: o health check
    // responde 503 sem ele e o Playwright nunca liberaria o webServer
    // para rodar o globalSetup (que é quem migraria/semeia o banco).
    command: `npx tsx tests/e2e/support/prepare-database.ts && npm run build && npm run start -- --port ${E2E_PORT}`,
    url: `${E2E_BASE_URL}/api/v1/health`,
    env: e2eServerEnv,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
```

> Se você já tinha copiado a configuração do passo 02 **antes** desta
> correção, o `command` antigo era só `npm run build && npm run start ...`
> — é exatamente essa linha que precisa mudar.

### 5. Primeira execução

```bash
npm run test:e2e
```

Ainda não há arquivos de teste (`*.spec.ts`), então o Playwright roda
**só o setup**. Observe no terminal:

1. o `prepare-database` (silencioso quando o banco já existe);
2. o `build` da aplicação;
3. `All migrations have been successfully applied.`;
4. `Administradora criada: dona.e2e@example.com` e `outra.e2e@example.com`;
5. `✓ autentica owner` e `✓ autentica other`.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `tests/e2e/support/test-database.ts` | Criado | `createDatabaseIfMissing` compartilhada |
| `tests/e2e/support/prepare-database.ts` | Criado | Cria o banco antes do servidor subir |
| `tests/e2e/global-setup.ts` | Criado | Banco limpo + contas |
| `tests/e2e/auth.setup.ts` | Criado | Sessões salvas |
| `playwright.config.ts` | Alterado | `webServer.command` passa a rodar o `prepare-database` primeiro |
| `playwright/.auth/*.json` | Gerado | Cookies das contas de teste (**ignorado** pelo Git) |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run test:e2e` | `2 passed` (os dois setups) |
| 2 | `docker compose exec postgres psql -U postgres -l` | Aparece o banco `admin_test` |
| 3 | `ls playwright/.auth/` | `owner.json` e `other.json` |
| 4 | **Prova da trava:** `E2E_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/admin_dev" npm run test:e2e` | Erro `Banco "admin_dev" recusado…` e **nada** é apagado |
| 5 | `npm run test:e2e` de novo | `2 passed` (repetível) |

**Critério de aceite:** os cinco testes passam. O teste 4 é o mais importante.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `ECONNREFUSED 127.0.0.1:5432` | Banco parado | `npm run db:up` |
| `Process from config.webServer exited early` ou `Timed out waiting 180000ms from config.webServer`, com o log repetindo `database "admin_test" does not exist` | O `webServer.command` não roda o `prepare-database` antes do `build`/`start` (health check responde 503 sem o banco) | Conferir o `command` no `playwright.config.ts` (passo 4 acima) |
| `Timed out waiting 180000ms from config.webServer` (outros casos) | Build falhou ou demorou | Rode `npm run build` sozinho para ver o erro |
| `autentica owner` falha com `403` | Faltou o cabeçalho `Origin` | Conferir o `auth.setup.ts` |
| Erro de porta 3100 em uso | Outro programa (não o servidor de teste) usando a porta | Encerrar o programa ou trocar `E2E_PORT` no `e2e-env.ts` |

## Commit sugerido

```bash
git add tests/e2e/support tests/e2e/global-setup.ts tests/e2e/auth.setup.ts playwright.config.ts
git commit -m "test(e2e): prepara banco de teste e sessões das usuárias"
```

## Referências

- [Playwright — Global setup](https://playwright.dev/docs/test-global-setup-teardown)
- [Playwright — Authentication (storageState)](https://playwright.dev/docs/auth)
- [PostgreSQL — TRUNCATE](https://www.postgresql.org/docs/16/sql-truncate.html)

---

← [Passo anterior](02-instalar-playwright.md) · [Índice da fase](README.md) · [Próximo passo](04-testes-autenticacao.md) →
