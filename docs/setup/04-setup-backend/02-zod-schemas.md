# Passo 02 — Zod 4 e schemas de validação

> **Fase:** 04 — Backend\
> **Tempo estimado:** 45 min\
> **Depende de:** [Passo 01](01-modelo-project.md)

## Objetivo

Instalar o Zod, criar os utilitários de validação compartilhados e os
schemas de criação e atualização de projetos, com 7 testes.

## 💡 Por que

### Zod é a alfândega

Todo dado que vem **de fora** (formulário, JSON de API, parâmetro de URL)
passa pela alfândega antes de entrar: o Zod confere formato, tamanho e
tipo, **limpa** (remove espaços, transforma vazio em `null`) e devolve um
objeto já **tipado**. Se algo não passa, ele devolve a lista de problemas
por campo.

| Regra do projeto (seção 15.5) | Como aparece aqui |
|---|---|
| Validar no servidor, mesmo que o navegador valide | Os schemas rodam nas actions e nos endpoints |
| Não confiar no cliente para `userId`/`role` | Os schemas **não têm** `ownerId`; o Zod descarta campos desconhecidos (validado no passo 10) |
| Schemas separados quando as regras diferem | `createProjectSchema` × `updateProjectSchema` |
| Testar limites e campos opcionais | 7 testes neste passo |

### ⚠️ Zod 4: diferenças em relação a tutoriais (e ao exemplo da seção 15)

| Zod 3 (antigo) | Zod 4 (instalado) |
|---|---|
| `{ message: "..." }` | `{ error: "..." }` |
| `z.string().email()` / `.url()` | `z.email()` / `z.url()` (funções de topo) |
| `result.error.flatten()` | `z.flattenError(result.error)` |

### A armadilha do `.partial()` com `.default()`

Num PATCH, o cliente envia **só o que mudou**. Se o schema de atualização
herdasse o `status.default("PLANNED")` da criação, um PATCH com apenas o
nome **voltaria o status para PLANNED sem ninguém pedir**. Por isso o padrão
fica só na criação, e um teste garante isso.

## Pré-requisitos

- Passo 01 concluído.

## Passo a passo

### 1. Instalar

```bash
npm install zod
```

### 2. Utilitários compartilhados

```bash
mkdir -p src/lib/validations src/modules/projects/schemas
```

`src/lib/validations/common.schema.ts`:

```ts
import { z } from "zod";

/**
 * Converte "" (campo de formulário vazio) em null antes de validar.
 * Sem isso, um <input> vazio seria gravado como texto vazio.
 */
export function emptyToNull<T extends z.ZodType>(schema: T) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    schema.nullable(),
  );
}

/** IDs gerados com @default(cuid()) no Prisma. */
export const idSchema = z.cuid({ error: "Identificador inválido." });

/** Converte o erro do Zod em { campo: [mensagens] }. */
export function toFieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
}
```

| Função | Uso |
|---|---|
| `emptyToNull` | Um `<input>` vazio chega como `""`; no banco, “sem valor” é `null` |
| `idSchema` | Valida IDs `cuid` vindos da URL, antes de consultar o banco |
| `toFieldErrors` | Formato `{ campo: ["mensagem"] }`, usado pela API e pelos formulários |

### 3. Schemas de projeto

`src/modules/projects/schemas/project.schema.ts`:

```ts
import { z } from "zod";

import { emptyToNull } from "@/lib/validations/common.schema";

export const projectStatusValues = ["PLANNED", "IN_PROGRESS", "PAUSED", "DONE"] as const;

const projectFields = {
  name: z
    .string({ error: "Informe o nome." })
    .trim()
    .min(3, { error: "O nome precisa ter pelo menos 3 caracteres." })
    .max(100, { error: "O nome pode ter no máximo 100 caracteres." }),
  description: emptyToNull(
    z.string().trim().max(500, { error: "A descrição pode ter no máximo 500 caracteres." }),
  ),
  status: z.enum(projectStatusValues, { error: "Status inválido." }),
  repositoryUrl: emptyToNull(
    z.url({ protocol: /^https$/, error: "Informe uma URL válida começando com https://." }),
  ),
};

/** Criação: status opcional, com padrão PLANNED. */
export const createProjectSchema = z.object({
  ...projectFields,
  description: projectFields.description.optional(),
  repositoryUrl: projectFields.repositoryUrl.optional(),
  status: projectFields.status.default("PLANNED"),
});

/**
 * Atualização parcial (PATCH): todos os campos opcionais, SEM padrão
 * (senão um PATCH só com o nome voltaria o status para PLANNED).
 */
export const updateProjectSchema = z
  .object(projectFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    error: "Informe ao menos um campo para atualizar.",
  });

export type CreateProjectInput = z.output<typeof createProjectSchema>;
export type UpdateProjectInput = z.output<typeof updateProjectSchema>;
```

| Trecho | Explicação |
|---|---|
| `as const` em `projectStatusValues` | Fixa os valores literais. Os mesmos do enum do Prisma |
| `.trim()` antes de `.min(3)` | `"  AB  "` vira `"AB"` e é recusado |
| `protocol: /^https$/` | Só aceita `https://`. Links `http://` são inseguros |
| `.refine(...)` no update | PATCH vazio (`{}`) não faz sentido e é recusado |
| `z.output<...>` | Tipo **depois** da validação (com `null` e padrão aplicados) |

### 4. Testes

```bash
mkdir -p tests/unit/modules/projects
```

`tests/unit/modules/projects/project.schema.test.ts`:

```ts
import { createProjectSchema, updateProjectSchema } from "@/modules/projects";

describe("createProjectSchema", () => {
  it("aceita um projeto válido e aplica o status padrão", () => {
    const result = createProjectSchema.safeParse({ name: "Personal Platform" });

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe("PLANNED");
  });

  it("remove espaços e rejeita nome curto", () => {
    const result = createProjectSchema.safeParse({ name: "  AB  " });

    expect(result.success).toBe(false);
  });

  it("converte campos vazios do formulário em null", () => {
    const result = createProjectSchema.safeParse({
      name: "Portal",
      description: "   ",
      repositoryUrl: "",
    });

    expect(result.data?.description).toBeNull();
    expect(result.data?.repositoryUrl).toBeNull();
  });

  it("exige https no link do repositório", () => {
    const result = createProjectSchema.safeParse({
      name: "Portal",
      repositoryUrl: "http://github.com/elizfab/portal",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita status desconhecido", () => {
    const result = createProjectSchema.safeParse({ name: "Portal", status: "ARCHIVED" });

    expect(result.success).toBe(false);
  });
});

describe("updateProjectSchema", () => {
  it("não injeta status padrão em atualização parcial", () => {
    const result = updateProjectSchema.safeParse({ name: "Novo nome" });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: "Novo nome" });
  });

  it("rejeita atualização sem nenhum campo", () => {
    expect(updateProjectSchema.safeParse({}).success).toBe(false);
  });
});
```

> O teste importa de `@/modules/projects`, a API pública do módulo, que é
> criada no passo 05. Até lá, importe de
> `@/modules/projects/schemas/project.schema`, ou crie já o `index.ts` do
> passo 05, item 2.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `package.json` / `package-lock.json` | Alterado | Dependência `zod` |
| `src/lib/validations/common.schema.ts` | Criado | Utilitários de validação |
| `src/modules/projects/schemas/project.schema.ts` | Criado | Contratos de entrada |
| `tests/unit/modules/projects/project.schema.test.ts` | Criado | 7 testes |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npx jest tests/unit/modules/projects/project.schema.test.ts` | `Tests: 7 passed` |
| 2 | **Prova do alarme:** em `updateProjectSchema`, troque as linhas `z` e `.object(projectFields)` por `createProjectSchema` e rode o teste | Os **2 testes de atualização falham**: o `default` injeta `status` e até um PATCH vazio `{}` passa a ser aceito. Desfaça a alteração |
| 3 | `npm run typecheck && npm run lint` | Sem erros |

**Critério de aceite:** os três testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Editor marca `message` como obsoleto (*deprecated*) | Sintaxe do Zod 3 | Usar `{ error: "..." }` |
| Editor marca `.flatten()` como obsoleto | API do Zod 3 | Usar `z.flattenError(error)` |
| `Cannot find module '@/modules/projects'` | O `index.ts` ainda não existe | Ver a nota do item 4 |

## Commit sugerido

```bash
git add package.json package-lock.json src/lib/validations src/modules/projects/schemas tests/unit/modules/projects
git commit -m "feat(projects): adiciona schemas Zod de criação e atualização"
```

## Referências

- [Zod 4 — Documentação](https://zod.dev/)
- [Zod 4 — Migration guide](https://zod.dev/v4/changelog)
- [Zod — Error formatting](https://zod.dev/error-formatting)
- ARCHITECTURE.md, seção 15

---

← [Passo anterior](01-modelo-project.md) · [Índice da fase](README.md) · [Próximo passo](03-erros-e-respostas.md) →
