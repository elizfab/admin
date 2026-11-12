# Passo 06 — Sessão no servidor e layout protegido

> **Fase:** 03 — Autenticação\
> **Tempo estimado:** 30 min\
> **Depende de:** [Passo 05](05-seed-administradora.md)

## Objetivo

Criar os helpers `getSession`, `requireSession` e `requireRole`, proteger o
layout privado **no servidor** e fazer a raiz `/` redirecionar conforme a sessão.

## 💡 Por que

### Validação no servidor, sempre

O cookie de sessão é um **crachá**. O helper `getSession()` leva o crachá ao
banco e pergunta: “esta sessão existe e está dentro da validade?”. Só o
servidor consegue responder isso com segurança; o navegador pode ser
manipulado.

### Por que `cache()` do React

Numa mesma requisição, o layout **e** a página podem pedir a sessão. O
`cache()` faz a consulta ao banco **uma vez** por requisição e reaproveita o
resultado, como anotar a resposta num papel em vez de perguntar duas vezes.

### `import "server-only"`

Este arquivo usa `headers()`, que só existe no servidor. Se alguém
importá-lo num Client Component, o build falha com uma mensagem clara.

## Pré-requisitos

- Passo 05 concluído (a administradora existe).

## Passo a passo

### 1. Helpers de sessão

`src/lib/auth/session.ts`:

```ts
import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "./auth";

/**
 * Lê a sessão atual validando-a no banco.
 * `cache` evita consultar o banco mais de uma vez na mesma requisição
 * (ex.: layout + página pedindo a sessão).
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Para páginas e layouts: sem sessão, redireciona para /login. */
export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

/** Autorização: exige um papel específico (ex.: "ADMIN"). */
export async function requireRole(role: "ADMIN" | "USER") {
  const session = await requireSession();

  if (session.user.role !== role) {
    redirect("/dashboard");
  }

  return session;
}
```

| Helper | Use em | Sem sessão |
|---|---|---|
| `getSession()` | Route Handlers, Server Actions, páginas que se adaptam | Retorna `null` (quem chama decide: `401`, redirect…) |
| `requireSession()` | Layouts e páginas privadas | Redireciona para `/login` |
| `requireRole("ADMIN")` | Páginas exclusivas de um papel | Redireciona para `/dashboard` |

### 2. Proteger o layout privado

Substitua `src/app/(private)/layout.tsx`:

`src/app/(private)/layout.tsx`:

```tsx
import { Header } from "@/components/layout/Header/Header";
import { Sidebar } from "@/components/layout/Sidebar/Sidebar";
import { requireSession } from "@/lib/auth/session";

import styles from "./layout.module.scss";

// Layout das áreas autenticadas.
// requireSession() valida a sessão NO SERVIDOR e redireciona para /login se não houver.
// Isso protege a navegação; cada operação de dados continua verificando a sessão.
export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.content}>
        <Header userName={session.user.name} />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
```

| Mudança | Explicação |
|---|---|
| `async function` | O layout agora **espera** a validação da sessão |
| `session.user.name` | O Header mostra o nome real, e não mais “Administradora” fixo |

⚠️ A proteção no layout melhora a **navegação**, mas **não substitui** a
verificação nas operações de dados (seção 5.2). Cada Route Handler e
Server Action continua chamando `getSession()` (passo 10).

### 3. Raiz condicional

Substitua `src/app/page.tsx`:

`src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";

// Raiz: envia para o dashboard (com sessão) ou para o login (sem sessão).
export default async function HomePage() {
  const session = await getSession();

  redirect(session ? "/dashboard" : "/login");
}
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/lib/auth/session.ts` | Criado | Helpers de sessão e autorização |
| `src/app/(private)/layout.tsx` | Alterado | Exige sessão válida |
| `src/app/page.tsx` | Alterado | Redireciona conforme a sessão |

## ✅ Como testar

Com `npm run dev` rodando, numa **janela anônima** (sem cookies):

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Abrir `http://localhost:3000/` | Vai para `/login`, que mostra **404**. Esperado: a tela de login é o passo 07 |
| 2 | Abrir `http://localhost:3000/finance` | Também vai para `/login` |
| 3 | `npm run typecheck && npm run lint` | Sem erros |

**Critério de aceite:** nenhuma página privada abre sem sessão.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Erro de build mencionando `server-only` | Um Client Component importou `session.ts` (direta ou indiretamente) | No cliente, use o `authClient` (passo 04) |
| `/login` mostra 404 | A página de login ainda não existe | Esperado até o passo 07 |

## Commit sugerido

```bash
git add src/lib/auth/session.ts "src/app/(private)/layout.tsx" src/app/page.tsx
git commit -m "feat(auth): protege o layout privado com validação de sessão no servidor"
```

## Referências

- [Better Auth — Next.js (session em Server Components)](https://www.better-auth.com/docs/integrations/next)
- [React — cache](https://react.dev/reference/react/cache)
- [Next.js — server-only](https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning)
- ARCHITECTURE.md, seções 5.2, 11.7 e 11.8

---

← [Passo anterior](05-seed-administradora.md) · [Índice da fase](README.md) · [Próximo passo](07-tela-de-login.md) →
