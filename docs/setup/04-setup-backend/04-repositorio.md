# Passo 04 — Repositório (acesso a dados)

> **Fase:** 04 — Backend\
> **Tempo estimado:** 30 min\
> **Depende de:** [Passo 03](03-erros-e-respostas.md)

## Objetivo

Criar o repositório de projetos: o **único** lugar do módulo que conversa
com o Prisma, com o isolamento por dona embutido em cada consulta.

## 💡 Por que

### O estoquista

O repositório é o **estoquista**: o chef (serviço) pede “os ingredientes da
mesa 4”, e ele sabe em que prateleira buscar. Se um dia o estoque mudar de
lugar (outro ORM, cache, outra tabela), só o estoquista precisa aprender o
caminho novo.

### Isolamento na consulta, e não depois

```ts
// ❌ busca qualquer projeto e confere depois: fácil de esquecer a conferência
const p = await prisma.project.findUnique({ where: { id } });

// ✅ a consulta já filtra pela dona: projeto alheio simplesmente "não existe"
const p = await prisma.project.findFirst({ where: { id, ownerId } });
```

💡 É a diferença entre o porteiro conferir o crachá na saída e o elevador
**só ter os botões dos andares** que o crachá libera.

### Duas travas para nome duplicado

1. O **serviço** consulta antes e responde `409` com mensagem clara (passo 05).
2. Se duas requisições chegarem ao mesmo tempo, as duas podem passar pela
   consulta. O **banco** (`@@unique`) barra a segunda com o erro `P2002`,
   que o repositório traduz em `ConflictError`. É a rede de segurança.

## Pré-requisitos

- Passo 03 concluído.

## Passo a passo

### 1. Tradução de erros do Prisma

`src/lib/db/errors.ts`:

```ts
import { Prisma } from "@/generated/prisma/client";

/** P2002 = violação de restrição única (ex.: @@unique([ownerId, name])). */
export function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
```

### 2. Repositório

```bash
mkdir -p src/modules/projects/repositories
```

`src/modules/projects/repositories/project.repository.ts`:

```ts
import { ConflictError } from "@/lib/errors/app-error";
import { prisma } from "@/lib/db/prisma";
import { isUniqueConstraintError } from "@/lib/db/errors";

import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "../schemas/project.schema";

const DUPLICATE_NAME = "Já existe um projeto com este nome.";

/**
 * Acesso a dados de projetos.
 * REGRA: toda leitura filtra por ownerId — o isolamento entre usuários
 * acontece na consulta, e não depois dela.
 */
export const projectRepository = {
  listByOwner(ownerId: string) {
    return prisma.project.findMany({
      where: { ownerId },
      orderBy: { updatedAt: "desc" },
    });
  },

  findByIdForOwner(id: string, ownerId: string) {
    return prisma.project.findFirst({ where: { id, ownerId } });
  },

  findByNameForOwner(name: string, ownerId: string) {
    return prisma.project.findUnique({
      where: { ownerId_name: { ownerId, name } },
      select: { id: true },
    });
  },

  async create(ownerId: string, data: CreateProjectInput) {
    try {
      return await prisma.project.create({ data: { ...data, ownerId } });
    } catch (error) {
      // Rede de segurança para corrida entre duas requisições simultâneas.
      if (isUniqueConstraintError(error))
        throw new ConflictError(DUPLICATE_NAME);
      throw error;
    }
  },

  async update(id: string, data: UpdateProjectInput) {
    try {
      return await prisma.project.update({ where: { id }, data });
    } catch (error) {
      if (isUniqueConstraintError(error))
        throw new ConflictError(DUPLICATE_NAME);
      throw error;
    }
  },

  delete(id: string) {
    return prisma.project.delete({ where: { id } });
  },
};
```

| Método               | Observação                                                          |
| -------------------- | ------------------------------------------------------------------- |
| `listByOwner`        | Ordena pelos atualizados mais recentemente                          |
| `findByIdForOwner`   | `findFirst` com `id` **e** `ownerId`                                |
| `findByNameForOwner` | Usa a chave composta `ownerId_name`, gerada pelo `@@unique`         |
| `create`             | `ownerId` entra **aqui**, vindo do serviço (que o recebe da sessão) |
| `update` / `delete`  | Por `id`: o serviço **já confirmou** a dona antes de chamar         |

## Arquivos criados ou alterados

| Arquivo                                                   | Ação   | Descrição                     |
| --------------------------------------------------------- | ------ | ----------------------------- |
| `src/lib/db/errors.ts`                                    | Criado | Detecta violação de unicidade |
| `src/modules/projects/repositories/project.repository.ts` | Criado | Acesso a dados de projetos    |

## ✅ Como testar

| #   | Teste               | Resultado esperado                                         |
| --- | ------------------- | ---------------------------------------------------------- |
| 1   | `npm run typecheck` | Sem erros (confirma os nomes gerados, como `ownerId_name`) |
| 2   | `npm run lint`      | Sem erros                                                  |

O comportamento é testado pelo serviço (passo 05) e pela API (passo 10).

**Critério de aceite:** os dois testes passam.

## Commit sugerido

```bash
git add src/lib/db/errors.ts src/modules/projects/repositories
git commit -m "feat(projects): adiciona repositório com isolamento por dona"
```

## Referências

- [Prisma — CRUD](https://www.prisma.io/docs/orm/prisma-client/queries/crud)
- [Prisma — Error reference (P2002)](https://www.prisma.io/docs/orm/reference/error-reference#p2002)
- [OWASP — Broken Object Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)
- ARCHITECTURE.md, seções 9 e 13.2

---

← [Passo anterior](03-erros-e-respostas.md) · [Índice da fase](README.md) · [Próximo passo](05-servico.md) →
