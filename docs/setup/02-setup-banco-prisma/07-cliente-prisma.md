# Passo 07 — Cliente Prisma reutilizável

> **Fase:** 02 — Banco e Prisma\
> **Tempo estimado:** 15 min\
> **Depende de:** [Passo 06](06-primeira-migration.md)

## Objetivo

Criar **uma única** instância do Prisma Client, compartilhada por toda a
aplicação, em `src/lib/db/prisma.ts`.

## 💡 Por que uma instância só

Cada `new PrismaClient()` abre um **pool de conexões** com o banco. Criar um
por requisição é como abrir um caixa novo no banco para cada cliente: em
pouco tempo acabam os caixas (`too many connections`).

### O truque do `globalThis` em desenvolvimento

No `npm run dev`, o Next.js recarrega os módulos a cada arquivo salvo (*hot
reload*). Sem cuidado, cada recarga criaria um client novo. Guardar a
instância em `globalThis`, um “bolso” que sobrevive às recargas, resolve
isso. Em produção não há hot reload, então não é necessário.

## Pré-requisitos

- Passo 06 concluído (client gerado).

## Passo a passo

### 1. Criar o arquivo

```bash
mkdir -p src/lib/db
```

`src/lib/db/prisma.ts`:

```ts
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
```

| Trecho | Explicação |
|---|---|
| `PrismaPg({ connectionString })` | *Driver adapter* do Prisma 7: o Prisma usa o driver `pg` para falar com o banco |
| `throw` se faltar `DATABASE_URL` | Falha rápida e clara, em vez de um erro confuso de conexão depois |
| `@/generated/prisma/client` | Import do client gerado no passo 06 |

### 2. Regras de uso (ARCHITECTURE.md, seções 14.5 e 22.2)

- Importar o `prisma` **somente** em código de servidor: Server Components,
  Route Handlers, Server Actions e serviços.
- **Nunca** em arquivos com `"use client"`.
- Nas próximas fases, o acesso ao banco ficará nos **repositórios** de cada
  módulo (`modules/<x>/repositories`), e não espalhado pelas páginas.

💡 **Proteções contra vazamento para o navegador:**

1. `DATABASE_URL` não começa com `NEXT_PUBLIC_`, então o Next.js **nunca** a
   envia ao navegador.
2. O driver `pg` depende de módulos do Node. Se um Client Component
   importar este arquivo, o build quebra com `Module not found: Can't resolve 'dns'`
   (e `'fs'`) — validado.
3. Na Fase 03, os módulos usados pelas páginas (`lib/auth/session.ts`)
   recebem `import "server-only"`, que gera erro de build explícito se
   forem importados no cliente.

> Por que não colocar `import "server-only"` aqui? O CLI do Better Auth
> (Fase 03) precisa carregar este arquivo fora do Next.js, e o `server-only`
> impede isso (validado).

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/lib/db/prisma.ts` | Criado | Instância única do Prisma Client |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run typecheck` | Sem erros |
| 2 | `npm run lint` | Sem erros |

O teste funcional (consulta real ao banco) é o próximo passo.

**Critério de aceite:** os dois testes passam.

## Commit sugerido

```bash
git add src/lib/db
git commit -m "feat(db): adiciona instância reutilizável do Prisma Client"
```

## Referências

- [Prisma — Driver adapters](https://www.prisma.io/docs/orm/overview/databases/database-drivers)
- [Prisma — Best practice: Next.js](https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help)

---

← [Passo anterior](06-primeira-migration.md) · [Índice da fase](README.md) · [Próximo passo](08-health-check.md) →
