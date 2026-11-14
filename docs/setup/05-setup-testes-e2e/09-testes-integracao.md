# Passo 09 — Testes de integração com banco (Jest)

> **Fase:** 05 — Testes E2E\
> **Tempo estimado:** 40 min\
> **Depende de:** [Passo 08](08-testes-acessibilidade.md)

## Objetivo

Testar o **repositório** de projetos contra o PostgreSQL **real** (banco
`admin_test`): o filtro por dona e a restrição `@@unique` funcionando no
banco, e não só nos dublês.

## 💡 Por que, se já existem testes unitários do serviço

Os testes unitários (Fase 04) usam um **dublê** do repositório: eles
provam que o serviço **chama** `findByIdForOwner`, mas não que a consulta
de verdade **filtra** pela dona. 💡 O ensaio com o dublê confere a coreografia;
o teste de integração sobe ao palco com o ator de verdade.

| Teste | Unitário (dublê) | Integração (banco real) |
|---|---|---|
| Serviço recusa projeto alheio | ✅ | — |
| A **consulta SQL** filtra por `ownerId` | ❌ não consegue | ✅ |
| O **banco** recusa nome duplicado (`P2002` → `ConflictError`) | ❌ não consegue | ✅ |
| Donas diferentes podem repetir o nome | ❌ não consegue | ✅ |

### Por que uma configuração separada do Jest

| Comando | Config | Banco | Quando rodar |
|---|---|---|---|
| `npm test` | `jest.config.ts` | Nenhum | Sempre: é rápido e não depende de nada |
| `npm run test:integration` | `jest.integration.config.ts` | `admin_test` | Com o Docker de pé |

Se os testes de integração estivessem no `npm test`, ele quebraria sempre
que o banco estivesse desligado.

### ⚠️ O Prisma 7 é ESM, e o Jest é CommonJS

O client gerado do Prisma 7 carrega o motor de consultas como módulo ESM
(`.mjs`), e o Jest no Node 22 não consegue carregá-lo
(`Must use import to load ES Module`, validado). A opção
`--experimental-vm-modules` também não resolveu (validado). A solução: o
próprio pacote traz a versão CommonJS do mesmo arquivo (`.js`), e a
configuração de integração mapeia uma para a outra. A **aplicação não muda**;
o mapeamento existe só nos testes.

## Pré-requisitos

- Passo 08 concluído; banco `admin_test` criado (pelo `npm run test:e2e` do passo 03).

## Passo a passo

### 1. Tirar a integração do `npm test`

No `jest.config.ts`, troque o `testPathIgnorePatterns` por:

```ts
  // E2E (Playwright) e integração (precisa de banco) têm comandos próprios.
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/tests/e2e/", "<rootDir>/tests/integration/"],
```

### 2. Configuração de integração — `jest.integration.config.ts` (na raiz)

`jest.integration.config.ts`:

```ts
import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

// Testes de integração: banco REAL de teste (admin_test). Rodar com `npm run test:integration`.
const config: Config = {
  testEnvironment: "node",
  // Roda antes de cada arquivo de teste: aponta DATABASE_URL para o banco de teste.
  setupFiles: ["<rootDir>/tests/integration/setup-env.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // O client do Prisma 7 importa o motor de consultas em ESM (.mjs), que o
    // Jest (CommonJS) não carrega. O pacote traz a versão CommonJS equivalente (.js).
    "^@prisma/client/runtime/(query_compiler_fast_bg\\.postgresql(?:\\.wasm-base64)?)\\.mjs$":
      "<rootDir>/node_modules/@prisma/client/runtime/$1.js",
  },
  testMatch: ["<rootDir>/tests/integration/**/*.test.ts"],
};

export default createJestConfig(config);
```

### 3. Apontar para o banco de teste

```bash
mkdir -p tests/integration
```

`tests/integration/setup-env.ts`:

```ts
import { assertTestDatabase, E2E_DATABASE_URL } from "../e2e/support/e2e-env";

// Trava de segurança: nunca rodar contra um banco que não termine em "_test".
assertTestDatabase(E2E_DATABASE_URL);

process.env.DATABASE_URL = E2E_DATABASE_URL;
```

💡 Por que um `setupFiles`, e não o código direto na configuração? O
arquivo de configuração do Jest não consegue importar outros módulos
TypeScript do projeto (`ERR_MODULE_NOT_FOUND`, validado). Os `setupFiles`
são transpilados pelo próprio Jest e rodam **antes** de cada arquivo de
teste, ou seja, antes de o Prisma ler o `DATABASE_URL`.

### 4. Testes do repositório

`tests/integration/project.repository.test.ts`:

```ts
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db/prisma";
import { ConflictError } from "@/lib/errors/app-error";
import { projectRepository } from "@/modules/projects/repositories/project.repository";

/**
 * Integração: repositório + Prisma + PostgreSQL REAIS (banco admin_test).
 * Prova o que os testes unitários (com dublês) não conseguem:
 * o filtro por dona e a restrição @@unique funcionando no banco.
 */

const ownerA = `it-owner-a-${randomUUID()}`;
const ownerB = `it-owner-b-${randomUUID()}`;

beforeAll(async () => {
  await prisma.user.createMany({
    data: [ownerA, ownerB].map((id) => ({ id, name: id, email: `${id}@example.com` })),
  });
});

afterAll(async () => {
  // Limpa só o que este arquivo criou, na ordem certa (Restrict).
  await prisma.project.deleteMany({ where: { ownerId: { in: [ownerA, ownerB] } } });
  await prisma.user.deleteMany({ where: { id: { in: [ownerA, ownerB] } } });
  await prisma.$disconnect();
});

describe("projectRepository (banco real)", () => {
  it("findByIdForOwner não encontra projeto de outra dona", async () => {
    const project = await projectRepository.create(ownerA, { name: "Do A", status: "PLANNED" });

    await expect(projectRepository.findByIdForOwner(project.id, ownerA)).resolves.toMatchObject({
      id: project.id,
    });
    await expect(projectRepository.findByIdForOwner(project.id, ownerB)).resolves.toBeNull();
  });

  it("listByOwner devolve só os projetos da dona", async () => {
    await projectRepository.create(ownerB, { name: "Do B", status: "PLANNED" });

    const listA = await projectRepository.listByOwner(ownerA);

    expect(listA.every((project) => project.ownerId === ownerA)).toBe(true);
  });

  it("o banco recusa nome duplicado para a mesma dona (ConflictError)", async () => {
    await projectRepository.create(ownerA, { name: "Duplicado", status: "PLANNED" });

    await expect(
      projectRepository.create(ownerA, { name: "Duplicado", status: "PLANNED" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("donas diferentes podem usar o mesmo nome", async () => {
    await expect(
      projectRepository.create(ownerB, { name: "Duplicado", status: "PLANNED" }),
    ).resolves.toMatchObject({ ownerId: ownerB, name: "Duplicado" });
  });
});
```

| Trecho | Explicação |
|---|---|
| `randomUUID()` nos ids | Os dados deste arquivo não colidem com os de outros testes nem com os dos E2E |
| `afterAll` apaga projetos **antes** dos usuários | A relação é `Restrict` (Fase 04): um usuário com projetos não pode ser apagado |
| `prisma.$disconnect()` | Fecha o pool de conexões; sem isso, o Jest fica “pendurado” no final |

### 5. Script

No `package.json`:

```json
"test:integration": "jest -c jest.integration.config.ts"
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `jest.config.ts` | Alterado | Ignora `tests/integration/` |
| `jest.integration.config.ts` | Criado | Configuração de integração |
| `tests/integration/setup-env.ts` | Criado | Trava `_test` + `DATABASE_URL` |
| `tests/integration/project.repository.test.ts` | Criado | 4 testes |
| `package.json` | Alterado | Script `test:integration` |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run test:integration` | `Tests: 4 passed` |
| 2 | `npm test` | Continua com os unitários passando (sem a integração) |
| 3 | **Prova do alarme:** o mesmo bug do passo 07 (`{ where: { id } }` no `findByIdForOwner`) | `1 failed` (“não encontra projeto de outra dona”). Desfaça |
| 4 | `npm run db:down` e `npm run test:integration` | Falha de conexão (esperado). Depois `npm run db:up` |

**Critério de aceite:** os testes 1 a 3 passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Must use import to load ES Module: ...query_compiler_fast_bg.postgresql.mjs` | Faltou o mapeamento `.mjs` → `.js` | Conferir o `moduleNameMapper` do item 2 |
| `database "admin_test" does not exist` | O banco de teste ainda não foi criado | Rodar `npm run test:e2e` uma vez (passo 03) |
| `Jest did not exit one second after the test run` | Pool de conexões aberto | Manter o `prisma.$disconnect()` no `afterAll` |
| Aviso do Prisma sugerindo `npm i prisma@latest` | O CLI viu a versão 8 (RC) como novidade | **Ignorar**: a versão fica fixada em `^7` no `package.json`; não atualizar para a RC |

## Commit sugerido

```bash
git add jest.config.ts jest.integration.config.ts tests/integration package.json
git commit -m "test(integration): adiciona testes do repositório contra o banco real"
```

## Referências

- [Jest — setupFiles](https://jestjs.io/docs/configuration#setupfiles-array)
- [Jest — moduleNameMapper](https://jestjs.io/docs/configuration#modulenamemapper-objectstring-string--arraystring)
- [Jest — ECMAScript Modules](https://jestjs.io/docs/ecmascript-modules)
- ARCHITECTURE.md, seção 16.5 (“Testes de integração com banco”)

---

← [Passo anterior](08-testes-acessibilidade.md) · [Índice da fase](README.md) · [Próximo passo](10-rotina-e-validacao.md) →
