# Passo 06 — Primeira migration e geração do client

> **Fase:** 02 — Banco e Prisma\
> **Tempo estimado:** 20 min\
> **Depende de:** [Passo 05](05-configurar-prisma.md)

## Objetivo

Criar a tabela `user` no banco local por meio de uma **migration**, gerar
o Prisma Client e conferir o resultado no Prisma Studio.

## 💡 Por que migrations

A migration é o **diário de obras** do banco: cada alteração vira um arquivo
SQL numerado, versionado no Git. Qualquer banco (o seu, o de testes, o de
produção) chega ao **mesmo estado** aplicando o diário na ordem.

Alterar o banco “na mão” (pelo painel ou por SQL avulso) é como reformar sem
anotar: ninguém consegue reproduzir. Por isso a regra da seção 14.7 da
arquitetura é **nunca editar o banco de produção fora das migrations**.

### ⚠️ Mudança do Prisma 7

O `prisma migrate dev` **não roda mais** o `prisma generate` (nem o seed)
automaticamente. Depois de toda migration, gere o client explicitamente.
Validado: após o `migrate dev`, a pasta `src/generated` ainda não existe.

## Pré-requisitos

- Passo 05 concluído; banco local `healthy`.

## Passo a passo

### 1. Criar e aplicar a migration

```bash
npm run db:migrate -- --name init
```

💡 O `--` passa o argumento `--name init` para o comando dentro do script.

Esperado:

```text
Applying migration `20261111XXXXXX_init`
Your database is now in sync with your schema.
```

### 2. Revisar o SQL gerado

Abra `prisma/migrations/<data>_init/migration.sql`. Você verá o
`CREATE TYPE "UserRole"`, o `CREATE TABLE "user"` e o índice único do e-mail.

💡 Sempre leia a migration antes de commitar (passo 4 do fluxo da seção
14.7). É ali que se percebe, por exemplo, um `DROP COLUMN` acidental.

### 3. Gerar o Prisma Client

```bash
npm run db:generate
```

Esperado: `✔ Generated Prisma Client (7.x.x) to ./src/generated/prisma`.

### 4. Abrir o Prisma Studio

```bash
npm run db:studio
```

Abre o navegador (normalmente `http://localhost:5555`) com a tabela `User`,
ainda vazia. Encerre com `Ctrl+C`.

⚠️ O Prisma Studio é uma ferramenta administrativa **local**. Nunca a exponha
na internet (seção 14.8).

## O fluxo de toda alteração futura de banco

```text
editar schema.prisma → npx prisma validate → npm run db:migrate -- --name <nome>
→ revisar migration.sql → npm run db:generate → ajustar código e testes → commit
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `prisma/migrations/<data>_init/migration.sql` | Criado | SQL da criação da tabela `user` (**versionado**) |
| `prisma/migrations/migration_lock.toml` | Criado | Registra o provedor (`postgresql`) |
| `src/generated/prisma/` | Gerado | Client tipado (**não versionado**) |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run db:status` | `Database schema is up to date!` |
| 2 | `docker compose exec postgres psql -U postgres -d admin_dev -c '\d "user"'` | Colunas `id`, `name`, `email`, `role`, `isActive`… |
| 3 | `npm run typecheck` | Sem erros |
| 4 | `git status --short` | Aparece `prisma/migrations/`; **não** aparece `src/generated/` |

**Critério de aceite:** os quatro testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Can't reach database server at localhost:5432` | Banco parado | `npm run db:up` |
| `Cannot find module '@/generated/prisma/client'` | Client não gerado | `npm run db:generate` |
| `Drift detected` | O banco foi alterado fora das migrations | Em ambiente **local**: `npx prisma migrate reset` (⚠️ apaga os dados locais) |

## Commit sugerido

```bash
git add prisma/migrations
git commit -m "feat(db): cria migration inicial com a tabela user"
```

## Referências

- [Prisma — Migrate](https://www.prisma.io/docs/orm/prisma-migrate/getting-started)
- [Prisma — Studio](https://www.prisma.io/docs/orm/tools/prisma-studio)
- ARCHITECTURE.md, seções 14.6 a 14.8

---

← [Passo anterior](05-configurar-prisma.md) · [Índice da fase](README.md) · [Próximo passo](07-cliente-prisma.md) →
