# Passo 01 — Ambiente de teste e banco isolado

> **Fase:** 05 — Testes E2E\
> **Tempo estimado:** 25 min\
> **Depende de:** [Fase 04 concluída](../04-setup-backend/README.md)

## Objetivo

Criar o arquivo central de configuração dos testes: endereço da aplicação
de teste, banco de teste, contas fictícias e a **trava de segurança** que
impede rodar testes fora de um banco `_test`.

## 💡 Por que

### Testes precisam de um “laboratório” próprio

Os testes E2E **apagam dados** a cada execução, para sempre começar do
mesmo ponto. Se rodassem no seu banco de desenvolvimento, apagariam os seus
projetos. 💡 É como um laboratório de química: os experimentos acontecem
na bancada de testes, nunca na cozinha de casa.

| Item | Valor de teste | Por quê |
|---|---|---|
| Porta | `3100` | Não conflita com o `npm run dev` (3000) |
| Banco | `admin_test` | Separado do `admin_dev` |
| Segredo da sessão | Texto fixo e fictício | Só existe no ambiente de teste |
| Contas | `dona.e2e@…` e `outra.e2e@…` | Duas usuárias, para testar o isolamento |

> As senhas aqui são **fictícias** e só existem no banco de teste local, por
> isso podem ficar no código. Nunca use estes valores em produção.

### A trava `_test`

A função `assertTestDatabase` lê o nome do banco na URL e **recusa** tudo
que não termine em `_test`. Mesmo que alguém configure por engano
`E2E_DATABASE_URL` apontando para `admin_dev` ou para o Supabase, os
testes param **antes** de apagar qualquer coisa.

### Por que não usar `prisma migrate reset`

O `migrate reset` apaga e recria o banco inteiro. Além de ser mais lento,
o Prisma 7 **bloqueia** esse comando quando ele é executado por um
assistente de IA, exigindo consentimento explícito (validado). A preparação
deste projeto (passo 03) usa operações não destrutivas no schema
(`migrate deploy`) e limpa **só os dados**, com a trava acima.

## Pré-requisitos

- Fase 04 concluída; banco local rodando (`npm run db:up`).

## Passo a passo

### 1. Criar o arquivo de ambiente

```bash
mkdir -p tests/e2e/support
```

`tests/e2e/support/e2e-env.ts`:

```ts
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
```

| Export | Uso |
|---|---|
| `E2E_BASE_URL` | Endereço da aplicação nos testes |
| `E2E_DATABASE_URL` | Banco de teste (pode ser sobrescrito pela variável de ambiente de mesmo nome) |
| `e2eServerEnv` | Variáveis que o servidor de teste e o Prisma recebem |
| `testUsers` | As duas contas e onde cada sessão será salva |
| `assertTestDatabase` | A trava de segurança |

💡 As variáveis de `e2eServerEnv` **têm prioridade** sobre o `.env.local`:
o Next.js e o `dotenv` não sobrescrevem variáveis que já existem no
ambiente. Assim o servidor de teste usa o `admin_test` mesmo com o
`.env.local` apontando para o `admin_dev` (validado).

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `tests/e2e/support/e2e-env.ts` | Criado | Configuração central dos testes |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run typecheck` | Sem erros |

O funcionamento real aparece no passo 03.

**Critério de aceite:** o typecheck passa.

## Commit sugerido

```bash
git add tests/e2e/support
git commit -m "test(e2e): adiciona configuração do ambiente de teste"
```

## Referências

- [Playwright — Best practices: test isolation](https://playwright.dev/docs/best-practices#make-tests-as-isolated-as-possible)
- [Next.js — Environment variables (ordem de carregamento)](https://nextjs.org/docs/app/guides/environment-variables#environment-variable-load-order)
- ARCHITECTURE.md, seção 17.3

---

[Índice da fase](README.md) · [Próximo passo](02-instalar-playwright.md) →
