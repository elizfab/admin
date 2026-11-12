# Passo 05 — Serviço e API pública do módulo

> **Fase:** 04 — Backend\
> **Tempo estimado:** 45 min\
> **Depende de:** [Passo 04](04-repositorio.md)

## Objetivo

Escrever as regras de negócio de projetos, definir as **portas de entrada**
do módulo (`index.ts` e `server.ts`) e testar as regras com o repositório
simulado.

## 💡 Por que

### O chef

O serviço recebe dados **já validados** e o `ownerId` **da sessão**, e aplica
as regras:

| Regra | Onde |
|---|---|
| Projeto alheio = “não encontrado” | `getProject` (reutilizado por update e delete) |
| Nome único por dona | `assertNameAvailable` |
| Renomear para o mesmo nome não é conflito | `updateProject` só checa quando o nome **muda** |

O serviço **não sabe** o que é HTTP, cookie ou formulário. Por isso as
mesmas funções servem à API e às telas.

> **Organização:** a seção 9.4 sugere um arquivo por caso de uso
> (`create-project.ts`, `list-projects.ts`…). Com 5 funções pequenas, um
> único `project.service.ts` é mais fácil de ler. Divida quando o arquivo
> crescer.

### Duas portas de entrada: `index.ts` e `server.ts`

Princípio 2 da arquitetura: outros módulos e as rotas importam só a **API
pública** do módulo, nunca os arquivos internos. Mas há um detalhe:

| Arquivo | Exporta | Quem pode importar |
|---|---|---|
| `index.ts` | Schemas e tipos | Qualquer um, inclusive Client Components |
| `server.ts` | Serviços (acessam o banco) | **Só o servidor**: tem `import "server-only"` |

💡 Se o `index.ts` exportasse os serviços, um Client Component que importasse
só um tipo arrastaria o Prisma junto, e o build quebraria (validado na Fase
02). São duas portas: a **da frente**, aberta a todos, e a **dos fundos**,
só para funcionários.

### Testar regras sem banco

O `jest.mock` troca o repositório por um **dublê**. O teste roda em
milissegundos, não precisa de Docker e verifica **só as regras**, por
exemplo: “se o projeto não é dela, `update` nem chega a ser chamado”.

## Pré-requisitos

- Passo 04 concluído.

## Passo a passo

### 1. Tipos do módulo

```bash
mkdir -p src/modules/projects/services src/modules/projects/types
```

`src/modules/projects/types/project.types.ts`:

```ts
import type { Project, ProjectStatus } from "@/generated/prisma/client";

// O módulo expõe seus próprios tipos; quem usa não importa do Prisma diretamente.
export type { Project, ProjectStatus };

export const projectStatusLabel: Record<ProjectStatus, string> = {
  PLANNED: "Planejado",
  IN_PROGRESS: "Em andamento",
  PAUSED: "Pausado",
  DONE: "Concluído",
};
```

### 2. Serviço

`src/modules/projects/services/project.service.ts`:

```ts
import { ConflictError, NotFoundError } from "@/lib/errors/app-error";

import { projectRepository } from "../repositories/project.repository";
import type { CreateProjectInput, UpdateProjectInput } from "../schemas/project.schema";

/**
 * Regras de negócio de projetos.
 * Recebe dados JÁ validados (Zod) e o ownerId vindo da SESSÃO — nunca do cliente.
 */

const NOT_FOUND = "Projeto não encontrado.";
const DUPLICATE_NAME = "Já existe um projeto com este nome.";

export async function listProjects(ownerId: string) {
  return projectRepository.listByOwner(ownerId);
}

export async function getProject(ownerId: string, id: string) {
  const project = await projectRepository.findByIdForOwner(id, ownerId);

  // Projeto de outra pessoa = "não encontrado" (não revela que ele existe).
  if (!project) throw new NotFoundError(NOT_FOUND);

  return project;
}

export async function createProject(ownerId: string, input: CreateProjectInput) {
  await assertNameAvailable(ownerId, input.name);

  return projectRepository.create(ownerId, input);
}

export async function updateProject(ownerId: string, id: string, input: UpdateProjectInput) {
  const current = await getProject(ownerId, id);

  if (input.name && input.name !== current.name) {
    await assertNameAvailable(ownerId, input.name);
  }

  return projectRepository.update(id, input);
}

export async function deleteProject(ownerId: string, id: string) {
  await getProject(ownerId, id);
  await projectRepository.delete(id);
}

async function assertNameAvailable(ownerId: string, name: string) {
  const existing = await projectRepository.findByNameForOwner(name, ownerId);

  if (existing) throw new ConflictError(DUPLICATE_NAME);
}
```

### 3. Portas de entrada

`src/modules/projects/index.ts`:

```ts
// API pública do módulo Projetos — parte SEGURA para servidor e navegador
// (schemas e tipos). Serviços ficam em "./server".
export * from "./schemas/project.schema";
export * from "./types/project.types";
```

`src/modules/projects/server.ts`:

```ts
import "server-only";

// API pública do módulo Projetos — SOMENTE servidor (acessa o banco).
// Importar este arquivo num Client Component gera erro de build.
export * from "./services/project.service";
```

### 4. Testes do serviço

`tests/unit/modules/projects/project.service.test.ts`:

```ts
import { ConflictError, NotFoundError } from "@/lib/errors/app-error";
import { projectRepository } from "@/modules/projects/repositories/project.repository";
import {
  createProject,
  deleteProject,
  getProject,
  updateProject,
} from "@/modules/projects/services/project.service";

// O repositório (banco) é substituído por um dublê: testamos só as REGRAS.
jest.mock("@/modules/projects/repositories/project.repository", () => ({
  projectRepository: {
    listByOwner: jest.fn(),
    findByIdForOwner: jest.fn(),
    findByNameForOwner: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const repo = jest.mocked(projectRepository);
const OWNER = "owner-1";
const project = { id: "p1", name: "Portal", ownerId: OWNER };

beforeEach(() => jest.resetAllMocks());

describe("getProject", () => {
  it("busca sempre filtrando pela dona", async () => {
    repo.findByIdForOwner.mockResolvedValue(project as never);

    await getProject(OWNER, "p1");

    expect(repo.findByIdForOwner).toHaveBeenCalledWith("p1", OWNER);
  });

  it("lança NotFoundError quando o projeto não é da usuária", async () => {
    repo.findByIdForOwner.mockResolvedValue(null);

    await expect(getProject("outra-pessoa", "p1")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("createProject", () => {
  it("recusa nome duplicado para a mesma dona", async () => {
    repo.findByNameForOwner.mockResolvedValue({ id: "existente" } as never);

    await expect(
      createProject(OWNER, { name: "Portal", status: "PLANNED" }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("cria quando o nome está livre", async () => {
    repo.findByNameForOwner.mockResolvedValue(null);
    repo.create.mockResolvedValue(project as never);

    await createProject(OWNER, { name: "Portal", status: "PLANNED" });

    expect(repo.create).toHaveBeenCalledWith(OWNER, { name: "Portal", status: "PLANNED" });
  });
});

describe("updateProject e deleteProject", () => {
  it("não atualiza projeto de outra pessoa", async () => {
    repo.findByIdForOwner.mockResolvedValue(null);

    await expect(updateProject("outra-pessoa", "p1", { name: "X" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("não checa duplicidade quando o nome não muda", async () => {
    repo.findByIdForOwner.mockResolvedValue(project as never);

    await updateProject(OWNER, "p1", { name: "Portal", status: "DONE" });

    expect(repo.findByNameForOwner).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith("p1", { name: "Portal", status: "DONE" });
  });

  it("não exclui projeto de outra pessoa", async () => {
    repo.findByIdForOwner.mockResolvedValue(null);

    await expect(deleteProject("outra-pessoa", "p1")).rejects.toBeInstanceOf(NotFoundError);
    expect(repo.delete).not.toHaveBeenCalled();
  });
});
```

| Trecho | Explicação |
|---|---|
| `jest.mocked(projectRepository)` | Dá tipos aos mocks (`mockResolvedValue` com autocompletar) |
| `as never` | Os dublês devolvem objetos parciais; o cast evita montar um `Project` completo |
| `beforeEach(() => jest.resetAllMocks())` | Cada teste começa com dublês limpos |
| `expect(repo.update).not.toHaveBeenCalled()` | Prova que a regra **barrou antes** de chegar ao banco |

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/modules/projects/types/project.types.ts` | Criado | Tipos e rótulos de status |
| `src/modules/projects/services/project.service.ts` | Criado | Regras de negócio |
| `src/modules/projects/index.ts` | Criado | API pública (segura para o cliente) |
| `src/modules/projects/server.ts` | Criado | API pública (somente servidor) |
| `tests/unit/modules/projects/project.service.test.ts` | Criado | 7 testes |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm test` | `Tests: 29 passed` (10 anteriores + 7 de schema + 5 de respostas + 7 de serviço) |
| 2 | **Prova do alarme:** em `deleteProject`, apague a linha `await getProject(ownerId, id);` e rode `npm test` | “não exclui projeto de outra pessoa” **falha**. Desfaça a alteração |
| 3 | `npm run typecheck && npm run lint` | Sem erros |

**Critério de aceite:** os três testes passam.

💡 O teste 2 simula o bug de segurança mais comum em APIs (OWASP API1:
*Broken Object Level Authorization*): esquecer a checagem de dona em uma
operação. Agora existe um alarme para ele.

## Commit sugerido

```bash
git add src/modules/projects tests/unit/modules/projects
git commit -m "feat(projects): adiciona serviço com regras de negócio e testes"
```

## Referências

- [Jest — Mock functions](https://jestjs.io/docs/mock-functions)
- [Jest — jest.mocked](https://jestjs.io/docs/jest-object#jestmockedsource-options)
- [Next.js — Preventing environment poisoning (server-only)](https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning)
- ARCHITECTURE.md, seções 1.1 (princípios 2 e 3) e 9

---

← [Passo anterior](04-repositorio.md) · [Índice da fase](README.md) · [Próximo passo](06-route-handlers.md) →
