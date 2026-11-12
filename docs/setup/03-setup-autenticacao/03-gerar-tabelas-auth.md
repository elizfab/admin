# Passo 03 — Gerar as tabelas de autenticação (CLI + migration)

> **Fase:** 03 — Autenticação\
> **Tempo estimado:** 20 min\
> **Depende de:** [Passo 02](02-instalar-configurar-better-auth.md)

## Objetivo

Usar o CLI do Better Auth para acrescentar ao `schema.prisma` os modelos
`Session`, `Account`, `Verification` e `RateLimit`, e aplicá-los ao banco
com uma migration.

## 💡 Por que gerar, em vez de escrever à mão

O Better Auth espera nomes de tabela e de coluna **exatos**. O CLI lê o seu
`auth.ts` (incluindo `additionalFields` e `rateLimit.storage: "database"`)
e escreve exatamente o que falta, como um **contador que lê a planta e
lista o material**. Escrever à mão abre espaço para um erro de digitação
que só aparece no primeiro login.

| Tabela | O que guarda |
|---|---|
| `session` | Cada login ativo: token, validade, IP e navegador |
| `account` | Como a pessoa entra. Para e-mail e senha: `providerId = "credential"` e o **hash** da senha |
| `verification` | Tokens temporários (redefinição de senha, verificação de e-mail) |
| `rateLimit` | Contadores de tentativas por IP e rota |

💡 Por que a senha fica em `account`, e não em `user`? Porque uma pessoa pode
ter **várias formas de entrar** (senha, Google, GitHub). Cada forma é uma
`account` ligada ao mesmo `user`.

## Pré-requisitos

- Passo 02 concluído.

## Passo a passo

### 1. Gerar o schema

```bash
npx auth@1.7 generate --config src/lib/auth/auth.ts --yes
```

| Parte | Significado |
|---|---|
| `auth@1.7` | CLI do Better Auth. Use a **mesma versão major.minor** do pacote `better-auth` instalado (`npm ls better-auth`) |
| `--config` | Caminho do `auth.ts` |
| `--yes` | Confirma a alteração do `schema.prisma` sem perguntar |

Esperado: `🚀 Schema was overwritten successfully!`

### 2. Revisar o que mudou

```bash
git diff prisma/schema.prisma
```

O CLI **preserva** o que você escreveu na Fase 02 (o `enum UserRole`, o
`isActive` e os comentários) e acrescenta:

- no `User`: as relações `sessions Session[]` e `accounts Account[]`;
- os modelos novos, com `@@map` em minúsculas e `onDelete: Cascade` nas relações.

💡 `onDelete: Cascade`: se um usuário for apagado, as sessões e contas
dele são apagadas junto. Faz sentido aqui, porque uma sessão sem dono não
tem utilidade.

O schema resultante:

`prisma/schema.prisma`:

```text
// Schema do banco. Documentação: https://pris.ly/d/prisma-schema
// Diagrama ER correspondente: docs/architecture/database-erd.drawio

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// ─── Identidade ──────────────────────────────────────────────
// Formato compatível com o Better Auth (Fase 03), que adicionará
// as tabelas session, account e verification.

enum UserRole {
  ADMIN
  USER
}

model User {
  id            String   @id
  name          String
  email         String   @unique
  emailVerified Boolean  @default(false)
  image         String?
  role          UserRole @default(USER)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  sessions Session[]
  accounts Account[]

  @@map("user")
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([token])
  @@index([userId])
  @@map("session")
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([userId])
  @@map("account")
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([identifier])
  @@map("verification")
}

model RateLimit {
  id          String @id
  key         String
  count       Int
  lastRequest BigInt

  @@unique([key])
  @@map("rateLimit")
}
```

### 3. Criar a migration e gerar o client

```bash
npm run db:migrate -- --name add_better_auth
npm run db:generate
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `prisma/schema.prisma` | Alterado (pelo CLI) | Modelos de autenticação |
| `prisma/migrations/<data>_add_better_auth/` | Criado | SQL das novas tabelas |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run db:status` | `Database schema is up to date!` |
| 2 | `docker compose exec postgres psql -U postgres -d admin_dev -c '\dt'` | Tabelas `account`, `rateLimit`, `session`, `user`, `verification` e `_prisma_migrations` |
| 3 | `npm run typecheck` | Sem erros |

**Critério de aceite:** os três testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Please remove import 'server-only' from your auth config file` | `server-only` no `auth.ts` ou no `prisma.ts` | Remover dos dois; ele fica só em `session.ts` (passo 06) |
| Aviso `MODULE_TYPELESS_PACKAGE_JSON` | O CLI carrega o TypeScript como ESM | Inofensivo; pode ignorar |
| Aviso `Base URL is not set` | O CLI roda sem o `.env.local` | Inofensivo para o `generate` |

## Commit sugerido

```bash
git add prisma
git commit -m "feat(auth): adiciona tabelas do Better Auth"
```

## Referências

- [Better Auth — CLI](https://www.better-auth.com/docs/concepts/cli)
- [Better Auth — Database (core schema)](https://www.better-auth.com/docs/concepts/database)
- [Better Auth — Prisma adapter](https://www.better-auth.com/docs/adapters/prisma)

---

← [Passo anterior](02-instalar-configurar-better-auth.md) · [Índice da fase](README.md) · [Próximo passo](04-rota-e-cliente.md) →
