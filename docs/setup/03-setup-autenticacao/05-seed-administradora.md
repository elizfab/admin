# Passo 05 — Seed da conta administradora

> **Fase:** 03 — Autenticação\
> **Tempo estimado:** 30 min\
> **Depende de:** [Passo 04](04-rota-e-cliente.md)

## Objetivo

Criar a conta administradora com um script **idempotente**, que lê os dados
de variáveis de ambiente e grava a senha com o mesmo hash do Better Auth.

## 💡 Por que um seed, e não um formulário de cadastro

Sem cadastro público, alguém precisa criar a **primeira chave**. O seed é o
chaveiro oficial: cria a conta de forma controlada, reproduzível e sem senha
escrita no código (seção 14.9).

| Regra | Como o script cumpre |
|---|---|
| Sem senha no código | Lê `SEED_ADMIN_*` do `.env.local` |
| Hash forte | `hashPassword` do próprio Better Auth (scrypt): o login reconhece a senha |
| Idempotente | Se o e-mail já existe, não faz nada. Rodar 2 vezes = rodar 1 vez |
| Atômico | `$transaction`: cria `user` e `account` juntos, ou nenhum dos dois |
| Senha mínima | Recusa senhas com menos de 12 caracteres |

💡 **Idempotente** é como um interruptor de “ligar”: apertar várias vezes
não liga a luz “mais vezes”.

## Pré-requisitos

- Passo 04 concluído.

## Passo a passo

### 1. Variáveis do seed

No `.env.local` (use **sua** senha forte e única; um gerenciador de senhas
pode gerá-la):

```bash
SEED_ADMIN_NAME="Seu Nome"
SEED_ADMIN_EMAIL="seu-email@exemplo.com"
SEED_ADMIN_PASSWORD="uma-senha-forte-com-12-ou-mais-caracteres"
```

No `.env.example`, sem valores:

```bash
# Seed da conta administradora (somente local; use uma senha forte e única)
SEED_ADMIN_NAME=""
SEED_ADMIN_EMAIL=""
SEED_ADMIN_PASSWORD=""
```

### 2. Criar o script `prisma/seed.ts`

`prisma/seed.ts`:

```ts
/**
 * Seed da conta administradora inicial.
 *
 * - Lê nome, e-mail e senha de variáveis de ambiente (nunca do código).
 * - Gera o hash com o mesmo algoritmo do Better Auth (scrypt).
 * - É idempotente: rodar duas vezes não duplica dados.
 *
 * Executar: npx prisma db seed
 */
import { randomUUID } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { config } from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client";

config({ path: ".env.local", quiet: true });

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }

  return value;
}

async function main() {
  const name = requireEnv("SEED_ADMIN_NAME");
  const email = requireEnv("SEED_ADMIN_EMAIL").toLowerCase();
  const password = requireEnv("SEED_ADMIN_PASSWORD");

  if (password.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD precisa ter pelo menos 12 caracteres.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: requireEnv("DIRECT_URL") }),
  });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      console.log(`Administradora já existe (${email}). Nada foi alterado.`);
      return;
    }

    const userId = randomUUID();

    // Transação: cria usuário e credencial juntos, ou nenhum dos dois.
    await prisma.$transaction([
      prisma.user.create({
        data: {
          id: userId,
          name,
          email,
          emailVerified: true,
          role: "ADMIN",
        },
      }),
      prisma.account.create({
        data: {
          id: randomUUID(),
          userId,
          accountId: userId,
          providerId: "credential", // login por e-mail e senha
          password: await hashPassword(password),
        },
      }),
    ]);

    console.log(`Administradora criada: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

| Trecho | Explicação |
|---|---|
| Client próprio (sem `@/lib/db/prisma`) | O seed roda **fora** do Next.js (com `tsx`), onde o alias `@/` não existe |
| `DIRECT_URL` | Scripts administrativos usam a conexão direta |
| `providerId: "credential"` | É assim que o Better Auth identifica login por e-mail e senha |
| `emailVerified: true` | Conta criada por quem administra o sistema; não há e-mail a confirmar |
| `main().catch(...)` | O `tsx` deste projeto não aceita `await` no topo do arquivo (validado); por isso o código fica dentro de `main()` |

### 3. Registrar o seed no `prisma7.config.ts`

```ts
migrations: {
  path: "prisma/migrations",
  seed: "tsx prisma/seed.ts",
},
```

### 4. Executar

```bash
npx prisma db seed
```

💡 Lembrete do Prisma 7: o seed **não roda sozinho** depois do `migrate dev`;
é sempre explícito.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `prisma/seed.ts` | Criado | Script da conta administradora |
| `prisma7.config.ts` | Alterado | Comando de seed |
| `.env.local` / `.env.example` | Alterados | Variáveis `SEED_ADMIN_*` |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npx prisma db seed` | `Administradora criada: <e-mail>` |
| 2 | `npx prisma db seed` (de novo) | `Administradora já existe (<e-mail>). Nada foi alterado.` |
| 3 | `npm run db:studio` → tabela `User` | 1 registro com `role = ADMIN` e `isActive = true` |
| 4 | Studio → tabela `Account` | `providerId = credential` e `password` como hash longo, **nunca** a senha em texto |
| 5 | Login via API: `curl -s -o /dev/null -w "%{http_code}\n" -H "Origin: http://localhost:3000" -H "Content-Type: application/json" -d '{"email":"SEU-EMAIL","password":"SUA-SENHA"}' http://localhost:3000/api/auth/sign-in/email` (com `npm run dev` rodando) | `200` |

**Critério de aceite:** os cinco testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Variável de ambiente ausente: SEED_ADMIN_...` | Variável não definida no `.env.local` | Adicionar (item 1) |
| `Top-level await is currently not supported with the "cjs" output format` | `await` fora de função | Manter o código dentro de `main()` |
| Login responde `401` após o seed | Senha do seed diferente da digitada, ou e-mail com maiúsculas | O seed grava o e-mail em minúsculas; conferir a senha |

## Commit sugerido

```bash
git add prisma/seed.ts prisma7.config.ts .env.example
git commit -m "feat(auth): adiciona seed idempotente da conta administradora"
```

## Referências

- [Prisma — Seeding](https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding)
- [Better Auth — Email & Password (hash)](https://www.better-auth.com/docs/authentication/email-password)
- ARCHITECTURE.md, seção 14.9

---

← [Passo anterior](04-rota-e-cliente.md) · [Índice da fase](README.md) · [Próximo passo](06-sessao-no-servidor.md) →
