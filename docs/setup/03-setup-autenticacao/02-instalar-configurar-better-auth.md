# Passo 02 — Instalar e configurar o Better Auth

> **Fase:** 03 — Autenticação\
> **Tempo estimado:** 40 min\
> **Depende de:** [Passo 01](01-registrar-decisao-adr.md)

## Objetivo

Instalar o Better Auth, gerar o segredo e criar a configuração central em
`src/lib/auth/auth.ts`.

## 💡 Por que

O `auth.ts` é o **regulamento do prédio**: define quem entra (e-mail e
senha), se há cadastro (não há), quanto tempo vale o crachá (8 horas),
quantas tentativas são permitidas (5 por minuto) e quem está barrado
(contas desativadas). Todas as outras partes (rota, login, logout)
apenas **seguem** esse regulamento.

### O segredo (`BETTER_AUTH_SECRET`)

É a **chave do carimbo** que assina os cookies. Quem tiver o segredo pode
forjar sessões; por isso ele tem no mínimo 32 caracteres aleatórios, é
diferente em cada ambiente e nunca vai para o Git.

## Pré-requisitos

- Passo 01 concluído; banco local rodando.

## Passo a passo

### 1. Instalar

```bash
npm install better-auth server-only
```

| Pacote | Papel |
|---|---|
| `better-auth` | Autenticação (servidor e cliente) |
| `server-only` | Gera erro de build se um módulo de servidor for importado no navegador (usado no passo 06) |

### 2. Gerar o segredo e configurar as variáveis

```bash
openssl rand -base64 32
```

Copie o resultado e adicione ao `.env.local`:

```bash
BETTER_AUTH_SECRET="COLE-AQUI-O-VALOR-GERADO"
BETTER_AUTH_URL="http://localhost:3000"
```

E ao `.env.example`, **sem o valor**:

```bash
# ─── Autenticação (Fase 03) ─────────────────────────────────
# Gerar com: openssl rand -base64 32
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="http://localhost:3000"
```

💡 `BETTER_AUTH_URL` é o endereço base da aplicação. O Better Auth o usa para
montar URLs e para aceitar requisições somente dessa origem (proteção CSRF).

### 3. Criar a configuração

```bash
mkdir -p src/lib/auth
```

`src/lib/auth/auth.ts`:

```ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/db/prisma";

const EIGHT_HOURS = 60 * 60 * 8;

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    // Sem cadastro público: a conta administradora é criada pelo seed.
    disableSignUp: true,
    minPasswordLength: 12,
  },

  session: {
    expiresIn: EIGHT_HOURS,
    // Renova a validade, no máximo, uma vez por hora de uso.
    updateAge: 60 * 60,
  },

  user: {
    additionalFields: {
      // input: false → o cliente nunca consegue enviar/alterar estes campos.
      role: { type: "string", input: false },
      isActive: { type: "boolean", input: false },
    },
  },

  rateLimit: {
    enabled: true,
    // "database": o contador sobrevive a reinícios e funciona com várias
    // instâncias serverless (a memória de cada instância não é compartilhada).
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
    },
  },

  databaseHooks: {
    session: {
      create: {
        // Bloqueia login de contas desativadas (isActive = false).
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { isActive: true },
          });

          if (!user?.isActive) {
            return false;
          }

          return { data: session };
        },
      },
    },
  },

  // Precisa ser o último plugin: permite que Server Actions gravem cookies.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
```

| Configuração | 💡 Por quê |
|---|---|
| `disableSignUp: true` | Sem cadastro aberto (seção 11.1). Validado: o endpoint de cadastro responde `400 EMAIL_PASSWORD_SIGN_UP_DISABLED` |
| `minPasswordLength: 12` | Senhas longas são o fator que mais dificulta ataques de força bruta |
| `expiresIn: 8h` / `updateAge: 1h` | Crachá de 8 horas, renovado no máximo uma vez por hora de uso |
| `additionalFields` com `input: false` | `role` e `isActive` são lidos na sessão, mas **o cliente nunca consegue enviá-los** (seção 15.5: não confiar no frontend para `role`) |
| `rateLimit.storage: "database"` | Na Vercel há várias instâncias; um contador em memória seria zerado a cada instância nova |
| `customRules["/sign-in/email"]` | Limite mais rígido para o login: 5 tentativas por minuto |
| `databaseHooks.session.create.before` | Antes de criar a sessão, confere `isActive`. Retornar `false` cancela o login |
| `nextCookies()` por último | Permite que Server Actions gravem cookies; a documentação exige que seja o último plugin |
| `export type Session` | Tipo da sessão inferido da configuração, incluindo `role` e `isActive` |

⚠️ **Não** adicione `import "server-only"` neste arquivo: o CLI do Better
Auth (passo 03) precisa carregá-lo fora do Next.js e falha com
`Please remove import 'server-only' from your auth config file` (validado).

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `package.json` / `package-lock.json` | Alterado | `better-auth`, `server-only` |
| `.env.local` | Alterado | Segredo e URL (**não versionado**) |
| `.env.example` | Alterado | Bloco de autenticação, sem valores |
| `src/lib/auth/auth.ts` | Criado | Configuração central |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run typecheck` | Sem erros (validado: a configuração compila mesmo antes de as tabelas do passo 03 existirem) |
| 2 | `grep -c BETTER_AUTH_SECRET .env.example` | `1`, e o valor está vazio no `.env.example` |
| 3 | `git status --short` | `.env.local` não aparece |

**Critério de aceite:** os três testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Aviso `Base URL is not set` | `BETTER_AUTH_URL` ausente | Adicionar ao `.env.local` e reiniciar o `dev` |
| Segredo curto ou previsível | Digitado à mão | Gerar sempre com `openssl rand -base64 32` |

## Commit sugerido

```bash
git add package.json package-lock.json .env.example src/lib/auth/auth.ts
git commit -m "feat(auth): adiciona e configura Better Auth"
```

## Referências

- [Better Auth — Installation](https://www.better-auth.com/docs/installation)
- [Better Auth — Email & Password](https://www.better-auth.com/docs/authentication/email-password)
- [Better Auth — Rate limit](https://www.better-auth.com/docs/concepts/rate-limit)
- [Better Auth — Database hooks](https://www.better-auth.com/docs/concepts/database#database-hooks)
- ADR-006

---

← [Passo anterior](01-registrar-decisao-adr.md) · [Índice da fase](README.md) · [Próximo passo](03-gerar-tabelas-auth.md) →
