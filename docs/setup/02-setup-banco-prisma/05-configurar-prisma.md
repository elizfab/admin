# Passo 05 — Configurar o Prisma (config, schema, variáveis e scripts)

> **Fase:** 02 — Banco e Prisma\
> **Tempo estimado:** 30 min\
> **Depende de:** [Passo 04](04-instalar-prisma.md)

## Objetivo

Criar o `prisma7.config.ts`, o `prisma/schema.prisma` com o modelo `User`,
as variáveis de ambiente e os scripts `db:*`.

## 💡 Por que

### Dois arquivos, dois papéis

| Arquivo | Pergunta que responde |
|---|---|
| `prisma7.config.ts` | **Como** o CLI trabalha: onde está o schema, onde ficam as migrations, qual URL usar |
| `prisma/schema.prisma` | **O que** existe no banco: modelos, campos, relações |

> O nome `prisma7.config.ts` é o gerado pelo Prisma 7.10+. Versões
> anteriores usavam `prisma.config.ts`, e tutoriais antigos podem usar esse nome.

### Duas URLs: `DATABASE_URL` × `DIRECT_URL`

| Variável | Quem usa | No Supabase (Fase 06) | Local |
|---|---|---|---|
| `DATABASE_URL` | A aplicação, a cada requisição | Transaction pooler (6543) | `localhost:5432` |
| `DIRECT_URL` | O CLI (migrations) e o seed | Direct ou Session pooler | `localhost:5432` |

Localmente as duas são iguais. Separá-las desde já evita mudar o código
no deploy.

### Por que carregar o `.env.local` no config

O Next.js lê o `.env.local` sozinho, mas o CLI do Prisma não lê arquivo
nenhum: no Prisma 7, as variáveis precisam ser carregadas explicitamente.
Carregar o **mesmo** `.env.local` mantém uma única fonte de verdade.

## Pré-requisitos

- Passo 04 concluído; banco local rodando (`npm run db:up`).

## Passo a passo

### 1. Criar o `prisma7.config.ts` na raiz

```ts
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// O Next.js carrega o .env.local sozinho; o CLI do Prisma, não.
// Por isso carregamos o mesmo arquivo aqui, para uma única fonte de variáveis.
// Em CI/Vercel o arquivo não existe e as variáveis vêm do ambiente.
config({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations usam a conexão direta (não o pooler).
    url: process.env["DIRECT_URL"],
  },
});
```

💡 Não use `npx prisma init`: além dos arquivos do Prisma, ele cria pastas
de configuração para assistentes de IA (`.claude/`, `.agents/`…) na raiz.
Criar os arquivos à mão deixa o projeto limpo e ensina o que cada um faz.

### 2. Criar o `prisma/schema.prisma`

```bash
mkdir -p prisma
```

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

  @@map("user")
}
```

| Trecho | Explicação |
|---|---|
| `provider = "prisma-client"` | Gerador do Prisma 7 (o antigo era `prisma-client-js`) |
| `output` | Onde o client tipado é gerado. **Obrigatório** no Prisma 7 |
| `datasource` sem `url` | No Prisma 7, a URL fica no config, não no schema |
| `@@map("user")` | O modelo se chama `User` no código e `user` no banco |

### 3. Variáveis de ambiente

No `.env.local` (crie se não existir):

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/admin_dev"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/admin_dev"
```

No `.env.example`, adicione o bloco (valores locais de exemplo, sem segredo real):

```bash
# ─── Banco de dados (Fase 02) ───────────────────────────────
# Runtime da aplicação (no Supabase: pooler em modo transaction).
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/admin_dev"
# Migrations e seed (conexão direta).
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/admin_dev"
```

💡 Anatomia da URL: `postgresql://USUÁRIO:SENHA@HOST:PORTA/BANCO`.

### 4. Ignorar o client gerado no Git

Adicione ao final do `.gitignore`:

```gitignore
# prisma (código gerado: recriado por `npm install` / `npm run db:generate`)
/src/generated/
```

💡 Código gerado é como **fotocópia**: você guarda o original (o
`schema.prisma`) e tira cópias quando precisa. Versionar a cópia só gera
conflitos e diffs gigantes.

### 5. Scripts no `package.json`

```json
"postinstall": "prisma generate",
"db:up": "docker compose up -d",
"db:down": "docker compose down",
"db:generate": "prisma generate",
"db:migrate": "prisma migrate dev",
"db:deploy": "prisma migrate deploy",
"db:status": "prisma migrate status",
"db:studio": "prisma studio"
```

| Script | 💡 Por quê |
|---|---|
| `postinstall` | Roda sozinho após `npm install`. Garante o client gerado em um clone novo e na Vercel (validado: funciona mesmo sem variáveis de ambiente) |
| `db:migrate` | Desenvolvimento: cria e aplica migrations |
| `db:deploy` | Produção: só aplica migrations já existentes, sem criar novas |

### 6. Validar e formatar o schema

```bash
npx prisma validate
npx prisma format
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `prisma7.config.ts` | Criado | Configuração do CLI |
| `prisma/schema.prisma` | Criado | Modelo de dados (`User`) |
| `.env.local` | Criado / alterado | URLs do banco local (**não versionado**) |
| `.env.example` | Alterado | Bloco de variáveis do banco |
| `.gitignore` | Alterado | Ignora `/src/generated/` |
| `package.json` | Alterado | Scripts `db:*` e `postinstall` |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npx prisma validate` | `The schema at prisma/schema.prisma is valid 🚀` |
| 2 | `git status --short` | Aparecem `prisma7.config.ts`, `prisma/` e `.env.example`; **não** aparece `.env.local` |

**Critério de aceite:** os dois testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `The datasource.url property is required in your Prisma config file` | `DIRECT_URL` ausente no `.env.local` | Conferir o arquivo e o nome da variável |
| ``The datasource property `url` is no longer supported in schema files`` (P1012) | `url` dentro do `schema.prisma` (estilo Prisma 6) | Remover; a URL fica no `prisma7.config.ts` |
| `Error validating: ... output` | Faltou `output` no generator | Adicionar `output = "../src/generated/prisma"` |

## Commit sugerido

```bash
git add prisma7.config.ts prisma .env.example .gitignore package.json
git commit -m "chore(db): configura Prisma, schema inicial e scripts de banco"
```

## Referências

- [Prisma — Config reference](https://www.prisma.io/docs/orm/reference/prisma-config-reference)
- [Prisma — Schema](https://www.prisma.io/docs/orm/prisma-schema/overview)
- ARCHITECTURE.md, seções 12.2 e 14

---

← [Passo anterior](04-instalar-prisma.md) · [Índice da fase](README.md) · [Próximo passo](06-primeira-migration.md) →
