# Passo 09 — Proxy (Next.js 16)

> **Fase:** 03 — Autenticação\
> **Tempo estimado:** 20 min\
> **Depende de:** [Passo 08](08-logout.md)

## Objetivo

Criar o `src/proxy.ts`, que redireciona para `/login` **antes** de
renderizar qualquer página privada quando não há cookie de sessão.

## 💡 Por que, se o layout já protege

O proxy é o **porteiro na calçada**: barra quem chega sem crachá antes de
entrar no prédio, economizando trabalho do servidor. Mas ele **só olha se o
crachá existe; não confere se é válido**. Quem confere é o
`requireSession()` (passo 06). A documentação do Better Auth deixa isso
explícito: o check do proxy é **otimista** e não é seguro sozinho.

### ⚠️ Mudança do Next.js 16

`middleware.ts` virou **`proxy.ts`**, e a função exportada passou a se chamar
**`proxy`**. Tutoriais anteriores ao Next.js 16 usam o nome antigo.

| Antes (Next.js ≤ 15) | Agora (Next.js 16) |
|---|---|
| `middleware.ts` | `proxy.ts` |
| `export function middleware()` | `export function proxy()` |

Como o projeto usa `src/`, o arquivo fica em **`src/proxy.ts`**, no mesmo
nível de `src/app`.

## Pré-requisitos

- Passo 08 concluído.

## Passo a passo

### 1. Criar `src/proxy.ts`

`src/proxy.ts`:

```ts
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Redirecionamento OTIMISTA: só verifica se o cookie de sessão EXISTE.
 * Não valida o cookie — isso é feito no servidor (requireSession / getSession).
 * Serve para evitar renderizar páginas privadas para quem claramente não logou.
 */
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/studies/:path*", "/finance/:path*", "/pdi/:path*", "/projects/:path*"],
};
```

| Trecho | Explicação |
|---|---|
| `getSessionCookie` | Lê o cookie de sessão do Better Auth, sem consultar o banco |
| `matcher` | Só as rotas privadas passam pelo proxy. `/login`, `/api/*` e arquivos estáticos ficam de fora |

💡 Por que as APIs ficam fora do `matcher`? Uma API não deve **redirecionar**
para uma página de login; ela responde `401` (passo 10). Cada endpoint se
protege com `getSession()`.

> Ao criar uma rota privada nova (ex.: `/settings`), **adicione-a ao
> `matcher`**. Se esquecer, a rota continua protegida pelo layout; só perde
> o redirecionamento antecipado.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/proxy.ts` | Criado | Redirecionamento otimista |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run build` | No final aparece `ƒ Proxy (Middleware)` |
| 2 | `curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/dashboard` (com `npm run start`) | `307 http://localhost:3000/login` |
| 3 | Cookie **falso**: `curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" -b "better-auth.session_token=falso" http://localhost:3000/dashboard` | `307 .../login`. O proxy deixa passar (existe um cookie), mas o `requireSession()` barra |

**Critério de aceite:** os três testes passam. O teste 3 é a prova de que a
segurança **não depende** do proxy.

## Commit sugerido

```bash
git add src/proxy.ts
git commit -m "feat(auth): adiciona proxy com redirecionamento otimista"
```

## Referências

- [Next.js — Proxy](https://nextjs.org/docs/app/getting-started/proxy)
- [Better Auth — Next.js (proxy)](https://www.better-auth.com/docs/integrations/next)

---

← [Passo anterior](08-logout.md) · [Índice da fase](README.md) · [Próximo passo](10-testes-de-seguranca.md) →
