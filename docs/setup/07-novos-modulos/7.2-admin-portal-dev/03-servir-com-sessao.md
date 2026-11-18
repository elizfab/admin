# Passo 03 — Servir o portal com sessão

> **Fase:** 08 — Portal Dev protegido\
> **Tempo estimado:** 1h\
> **Depende de:** [Passo 02](02-baixar-o-pacote.md)

## Objetivo

Entregar os arquivos de `.portal/` em `/portal/*` **somente** para quem tem
sessão válida, com o tipo certo de arquivo, cache privado e sem permitir
"escapar" da pasta.

## 💡 As três camadas de segurança do `/portal`

| Camada | Onde | O que barra |
|---|---|---|
| 1. Proxy (otimista) | `src/proxy.ts` | Quem nem tem cookie: redireciona cedo, sem gastar a função |
| 2. Sessão no banco | `route.ts` → `getSession()` | Cookie falso, expirado, de conta desativada |
| 3. Caminho seguro | `portal-files.ts` | `/portal/../../.env` e parecidos: só arquivos **dentro** de `.portal/` |

💡 **Path traversal** é o truque de pedir `../../` no endereço para "subir"
pastas e ler um arquivo fora do lugar permitido (por exemplo, o `.env`). É
como pedir à bibliotecária o livro "da estante ao lado da sala restrita".
Barramos em **duas** linhas: segmentos com `..` são recusados, e o caminho
final precisa começar com a pasta do portal.

### Como a URL vira arquivo

O Docusaurus (com `trailingSlash: false`) gera `docs/intro.html`. A URL é
`/portal/docs/intro`. O resolvedor tenta, nesta ordem:

| URL | 1ª tentativa | 2ª | 3ª |
|---|---|---|---|
| `/portal` | `index.html` | — | — |
| `/portal/docs/intro` | `docs/intro` | `docs/intro.html` ✅ | `docs/intro/index.html` |
| `/portal/assets/js/main.123.js` | `assets/js/main.123.js` ✅ | — | — |

### Cache: por que `private` em tudo

| Arquivo | `Cache-Control` | 💡 Por quê |
|---|---|---|
| `assets/**` (nome com hash) | `private, max-age=31536000, immutable` | O nome muda quando o conteúdo muda: o navegador guarda por 1 ano |
| `*.html`, `*.json` | `private, no-cache` | Mudam a cada publicação: o navegador sempre confere |
| Imagens e demais | `private, max-age=3600` | Meio-termo de 1 hora |

`private` = **só o navegador da pessoa** pode guardar. Sem isso, a CDN da
Vercel poderia guardar uma cópia e entregá-la a qualquer um, **sem** passar
pela verificação de sessão.

## Pré-requisitos

- Passo 02 concluído, com `.portal/` preenchida (`PORTAL_ARCHIVE=... npm run portal:fetch`).

## Passo a passo

### 1. Regras de arquivo, tipo e cache

`src/lib/portal/portal-files.ts`:

```ts
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Arquivos do Portal Dev (build do Docusaurus) guardados em .portal/.
 * Este arquivo só decide QUAL arquivo entregar e COMO (tipo e cache);
 * QUEM pode receber é decidido no Route Handler (sessão).
 */

/** Pasta do build. PORTAL_DIR existe para os testes E2E usarem um portal falso. */
export function portalRoot() {
    return path.resolve(process.cwd(), process.env.PORTAL_DIR ?? ".portal");
}

const CONTENT_TYPES: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".map": "application/json; charset=utf-8",
};

export function contentTypeFor(filePath: string) {
    return CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

/**
 * "private" em TODOS os casos: a CDN da Vercel nunca guarda uma cópia
 * (senão ela entregaria o conteúdo protegido sem perguntar pela sessão).
 * - assets/ do Docusaurus têm hash no nome → o navegador guarda por 1 ano.
 * - HTML e JSON mudam a cada publicação → o navegador sempre revalida.
 */
export function cacheControlFor(relativePath: string) {
    if (relativePath.startsWith("assets/")) return "private, max-age=31536000, immutable";
    if (/\.(html|json)$/.test(relativePath)) return "private, no-cache";
    return "private, max-age=3600";
}

/** Segmentos da URL seguros: nada de "..", "." , vazio, barra invertida ou byte nulo. */
export function isSafeSegments(segments: string[]) {
    return segments.every(
        (segment) =>
            segment !== "" &&
            segment !== "." &&
            segment !== ".." &&
            !segment.includes("\\") &&
            !segment.includes("/") &&
            !segment.includes("\0"),
    );
}

async function isFile(filePath: string) {
    try {
        return (await stat(filePath)).isFile();
    } catch {
        return false;
    }
}

export type PortalFile = { relativePath: string; absolutePath: string };

/**
 * /portal/docs/intro → docs/intro, docs/intro.html ou docs/intro/index.html
 * (o Docusaurus gera "docs/intro.html" com trailingSlash: false).
 */
export async function resolvePortalFile(segments: string[]): Promise<PortalFile | null> {
    if (!isSafeSegments(segments)) return null;

    const root = portalRoot();
    const requested = segments.join("/");
    const candidates = requested
        ? [requested, `${requested}.html`, `${requested}/index.html`]
        : ["index.html"];

    for (const relativePath of candidates) {
        const absolutePath = path.resolve(root, relativePath);

        // Segunda trava: o caminho final PRECISA estar dentro da pasta do portal.
        if (!absolutePath.startsWith(root + path.sep)) return null;

        if (await isFile(absolutePath)) return { relativePath, absolutePath };
    }

    return null;
}

export type PortalBuildInfo = {
    commit: string;
    builtAt: string;
    sections: { label: string; href: string }[];
};

/** Lê o portal-build.json gerado pelo CI do portal-dev; null se não houver portal. */
export async function readPortalBuildInfo(): Promise<PortalBuildInfo | null> {
    try {
        const raw = await readFile(path.join(portalRoot(), "portal-build.json"), "utf8");
        return JSON.parse(raw) as PortalBuildInfo;
    } catch {
        return null;
    }
}
```

💡 `PORTAL_DIR` existe só para os testes E2E apontarem para um portal falso
(passo 05). Em produção, a pasta é sempre `.portal/`.

### 2. O Route Handler

Crie a pasta com colchetes **duplos** (`[[...path]]` = "zero ou mais
segmentos", para atender também o `/portal` sozinho):

`src/app/portal/[[...path]]/route.ts`:

```ts
import { readFile } from "node:fs/promises";

import { getSession } from "@/lib/auth/session";
import {
    cacheControlFor,
    contentTypeFor,
    resolvePortalFile,
    type PortalFile,
} from "@/lib/portal/portal-files";

/**
 * Portal Dev protegido: entrega os arquivos do build do Docusaurus
 * SOMENTE depois de validar a sessão no banco (o proxy só olha se o
 * cookie existe). Sem sessão → /login. Arquivo inexistente → 404 do portal.
 */
export async function GET(request: Request, ctx: RouteContext<"/portal/[[...path]]">) {
    const session = await getSession();

    if (!session) {
        return Response.redirect(new URL("/login", request.url), 307);
    }

    const { path = [] } = await ctx.params;
    const file = await resolvePortalFile(path);

    if (file) return serve(file, 200);

    const notFound = await resolvePortalFile(["404.html"]);

    if (notFound) return serve(notFound, 404);

    return new Response("Portal não publicado neste ambiente.", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store" },
    });
}

async function serve(file: PortalFile, status: number) {
    const body = await readFile(file.absolutePath);

    return new Response(body, {
        status,
        headers: {
            "Content-Type": contentTypeFor(file.relativePath),
            "Cache-Control": cacheControlFor(file.relativePath),
            // Conteúdo privado: buscadores não devem indexar.
            "X-Robots-Tag": "noindex, nofollow",
        },
    });
}
```

💡 Por que `getSession()` e não `requireSession()`? O `requireSession` usa o
`redirect()` do Next.js, feito para páginas. Num Route Handler, devolvemos a
resposta nós mesmos (`Response.redirect`), com o código **307** (redireciona
mantendo o método).

### 3. Copiar `.portal/` para dentro da função (Vercel)

Na Vercel, cada Route Handler vira uma função que leva **só** os arquivos que
o Next.js detecta como usados. Arquivos lidos com `fs` a partir de um caminho
montado em tempo de execução não são detectados. Em `next.config.ts`, dentro
de `nextConfig`, logo depois de `poweredByHeader`:

```ts
  // Os arquivos do portal são lidos com fs em tempo de execução; sem isto,
  // a Vercel não os copia para dentro da função e o /portal responde 404.
  outputFileTracingIncludes: {
    "/portal/[[...path]]": ["./.portal/**/*"],
    "/documentation": ["./.portal/portal-build.json"],
  },
```

💡 É a "lista de bagagem" da função: sem ela, a mala chega à Vercel sem os
livros. A segunda linha leva só o `portal-build.json` para a página do passo 04.

### 4. Proxy

Em `src/proxy.ts`, acrescente ao `matcher`:

```ts
        "/projects/:path*",
        "/portal/:path*",
    ],
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/lib/portal/portal-files.ts` | Criado | Resolve o arquivo, tipo e cache; lê o `portal-build.json` |
| `src/app/portal/[[...path]]/route.ts` | Criado | Entrega com sessão |
| `next.config.ts` | Alterado | `outputFileTracingIncludes` |
| `src/proxy.ts` | Alterado | `/portal/:path*` |

## ✅ Como testar

Com `.portal/` preenchida e o banco no ar:

```bash
npm run build && npm run start
```

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Janela anônima → `http://localhost:3000/portal/docs/intro` | Vai para `/login` |
| 2 | `curl -sI -H "Cookie: better-auth.session_token=falso" http://localhost:3000/portal/docs/intro` | `307` com `location: .../login` (o proxy deixa passar, a função barra) |
| 3 | Logada → `/portal/` | Home do Portal Dev com tema, busca e ícones |
| 4 | Logada → `/portal/docs/backend` → clicar num tópico | Navega sem recarregar a página |
| 5 | Logada → `/portal/search?q=docker` | Resultados da busca |
| 6 | DevTools → Network → um `.js` de `/portal/assets/` | `cache-control: private, max-age=31536000, immutable` |
| 7 | Logada → `/portal/nao-existe` | Página 404 do portal, status 404 |
| 8 | `grep -c ".portal" ".next/server/app/portal/[[...path]]/route.js.nft.json"` | Número maior que zero (os arquivos entraram na função) |

**Critério de aceite:** os 8 testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `/portal/` vira `/portal` (308) | O Next.js remove a barra final das URLs | Esperado: o Route Handler entrega o `index.html` e o Docusaurus abre a home normalmente |
| Página em branco; `.js` com 404 | Portal gerado sem `baseUrl: /portal/` | Gere de novo com `npm run build:admin` no `portal-dev` |
| Em produção, `/portal` responde "Portal não publicado neste ambiente." | `.portal/` não entrou na função | Confira o `outputFileTracingIncludes` e a ordem do `vercel-build` |
| Logada, mas `/portal` volta para o login | Cookie de outra porta/domínio | Acesse pelo mesmo endereço do `BETTER_AUTH_URL` |

## Commit sugerido

```bash
git add src/lib/portal "src/app/portal" next.config.ts src/proxy.ts
git commit -m "feat(portal): serve o Portal Dev em /portal somente com sessão"
```

## Referências

- [Next.js — Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Next.js — `outputFileTracingIncludes`](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [OWASP — Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
- [MDN — `Cache-Control`](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Headers/Cache-Control)

---

← [Passo anterior](02-baixar-o-pacote.md) · [Índice da fase](README.md) · [Próximo passo](04-pagina-documentacao.md) →
