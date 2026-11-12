# Passo 01 — Modelo `Project` no banco

> **Fase:** 04 — Backend\
> **Tempo estimado:** 25 min\
> **Depende de:** [Fase 03 concluída](../03-setup-autenticacao/README.md)

## Objetivo

Adicionar o modelo `Project` ao `schema.prisma`, ligado à usuária dona, e
aplicar a migration.

## 💡 Por que cada decisão do modelo

| Campo / regra | Decisão | 💡 Por quê |
|---|---|---|
| `id` | `@default(cuid())` | Diferente do `User` (cujo id é gerado pelo Better Auth), aqui o banco gera. O cuid é difícil de adivinhar, ao contrário de `1, 2, 3…` |
| `name` | `VarChar(100)` | O limite existe no banco **e** no Zod: duas travas, uma em cada camada |
| `description` | `VarChar(500)`, opcional | Texto curto; `null` quando vazio |
| `status` | `enum ProjectStatus` | Lista fechada: o banco recusa valores fora dela |
| `repositoryUrl` | Opcional | Link do GitHub |
| `ownerId` | Obrigatório, FK para `user` | **Propriedade do registro** (seção 13.2): base do isolamento entre usuárias |
| `onDelete: Restrict` | — | Não deixa apagar uma usuária que ainda tem projetos. Evita perda de dados acidental |
| `@@unique([ownerId, name])` | — | A mesma dona não pode ter dois projetos com o mesmo nome; donas diferentes podem |

💡 **Índice composto:** o `@@unique([ownerId, name])` cria um índice que
começa por `ownerId`. Como toda listagem filtra por `ownerId`, esse índice
já acelera as buscas, e um `@@index([ownerId])` separado seria redundante
(seção 22.4: “índices justificados”). Pense na lista telefônica: ordenada
por sobrenome e nome, ela também serve para achar todos de um sobrenome.

## Pré-requisitos

- Fase 03 concluída; banco local rodando.

## Passo a passo

### 1. Relação no `User`

No modelo `User`, junto das relações já existentes, adicione:

```prisma
  projects Project[]
```

### 2. Enum e modelo `Project`

Ao final do `prisma/schema.prisma`:

```prisma
// ─── Projetos ────────────────────────────────────────────────

enum ProjectStatus {
  PLANNED
  IN_PROGRESS
  PAUSED
  DONE
}

model Project {
  id            String        @id @default(cuid())
  name          String        @db.VarChar(100)
  description   String?       @db.VarChar(500)
  status        ProjectStatus @default(PLANNED)
  repositoryUrl String?
  ownerId       String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Restrict: não é possível apagar um usuário que ainda tem projetos.
  owner User @relation(fields: [ownerId], references: [id], onDelete: Restrict)

  // Um mesmo usuário não pode ter dois projetos com o mesmo nome.
  // Este índice composto também acelera as buscas por ownerId.
  @@unique([ownerId, name])
  @@map("project")
}
```

### 3. Validar, migrar e gerar

```bash
npx prisma format
npx prisma validate
npm run db:migrate -- --name add_projects
npm run db:generate
```

### 4. Revisar o SQL gerado

`prisma/migrations/<data>_add_projects/migration.sql` deve conter:

- `CREATE TYPE "ProjectStatus" AS ENUM (...)`;
- `CREATE TABLE "project"`;
- `CREATE UNIQUE INDEX "project_ownerId_name_key"`;
- a FK com `ON DELETE RESTRICT`.

### 5. Atualizar o ERD

No `docs/architecture/database-erd.drawio`, marque `Project` como
**implementado** e inclua o `status` e o índice único.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `prisma/schema.prisma` | Alterado | Enum e modelo `Project` |
| `prisma/migrations/<data>_add_projects/` | Criado | SQL da nova tabela |
| `docs/architecture/database-erd.drawio` | Alterado | ERD atualizado |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run db:status` | `Database schema is up to date!` |
| 2 | `docker compose exec postgres psql -U postgres -d admin_dev -c '\d project'` | Colunas e o índice `project_ownerId_name_key` |
| 3 | `npm run typecheck` | Sem erros |

**Critério de aceite:** os três testes passam.

## Commit sugerido

```bash
git add prisma docs/architecture/database-erd.drawio
git commit -m "feat(projects): adiciona modelo Project com dona e nome único"
```

## Referências

- [Prisma — Relations](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations)
- [Prisma — Referential actions](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions)
- [Prisma — Indexes](https://www.prisma.io/docs/orm/prisma-schema/data-model/indexes)
- ARCHITECTURE.md, seções 13.2 e 22.4

---

[Índice da fase](README.md) · [Próximo passo](02-zod-schemas.md) →
