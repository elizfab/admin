# Passo 04 — Rota de autenticação e cliente

> **Fase:** 03 — Autenticação\
> **Tempo estimado:** 15 min\
> **Depende de:** [Passo 03](03-gerar-tabelas-auth.md)

## Objetivo

Expor os endpoints do Better Auth em `/api/auth/*` e criar o cliente usado
pelos Client Components.

## 💡 Por que

- A **rota** é o balcão onde o navegador entrega o pedido (“quero entrar”,
  “quero sair”). Um único arquivo *catch-all* `[...all]` atende todos os
  endpoints do Better Auth: `/sign-in/email`, `/sign-out`, `/get-session`…
- O **cliente** é o formulário pronto que o navegador preenche para falar
  com esse balcão, com tipos e tratamento de erro.

## Pré-requisitos

- Passo 03 concluído.

## Passo a passo

### 1. Route Handler catch-all

```bash
mkdir -p "src/app/api/auth/[...all]"
```

`src/app/api/auth/[...all]/route.ts`:

```ts
import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth/auth";

// Expõe os endpoints do Better Auth em /api/auth/* (sign-in, sign-out, get-session…).
export const { GET, POST } = toNextJsHandler(auth);
```

💡 `[...all]` captura qualquer caminho depois de `/api/auth/`. É o mesmo
conceito de rota dinâmica do App Router, mas pegando vários segmentos.

### 2. Cliente

`src/lib/auth/auth-client.ts`:

```ts
import { createAuthClient } from "better-auth/react";

// Cliente para Client Components. Mesmo domínio: não precisa de baseURL.
export const authClient = createAuthClient();
```

⚠️ Importe sempre de `better-auth/react` em Client Components.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/app/api/auth/[...all]/route.ts` | Criado | Endpoints do Better Auth |
| `src/lib/auth/auth-client.ts` | Criado | Cliente para o navegador |

## ✅ Como testar

Com `npm run dev` rodando:

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `curl -s http://localhost:3000/api/auth/get-session` | `null` (ninguém logado) |
| 2 | Tentar cadastro: `curl -s -H "Origin: http://localhost:3000" -H "Content-Type: application/json" -d '{"name":"x","email":"x@x.com","password":"123456789012"}' http://localhost:3000/api/auth/sign-up/email` | `{"message":"Email and password sign up is not enabled","code":"EMAIL_PASSWORD_SIGN_UP_DISABLED"}` |

**Critério de aceite:** os dois testes passam. O teste 2 prova que **não
existe cadastro público**.

## Commit sugerido

```bash
git add "src/app/api/auth" src/lib/auth/auth-client.ts
git commit -m "feat(auth): expõe rotas do Better Auth e cliente"
```

## Referências

- [Better Auth — Next.js integration](https://www.better-auth.com/docs/integrations/next)
- [Next.js — Dynamic routes (catch-all)](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes)

---

← [Passo anterior](03-gerar-tabelas-auth.md) · [Índice da fase](README.md) · [Próximo passo](05-seed-administradora.md) →
