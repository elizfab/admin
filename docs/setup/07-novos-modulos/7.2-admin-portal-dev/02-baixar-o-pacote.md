# Passo 02 — Baixar o pacote do portal

> **Fase:** 08 — Portal Dev protegido\
> **Tempo estimado:** 40 min\
> **Depende de:** [Passo 01](01-decisao-e-arquitetura.md) e, no `portal-dev`, a fase 04, passos 01 e 02 (release `portal-build` publicada)

## Objetivo

Criar o script que **baixa** o build do portal (release `portal-build`) e o
extrai em `.portal/`, rodando no `vercel-build` e também à mão no dev.

## 💡 Três origens possíveis para o pacote

| Situação | Variável | O que o script faz |
|---|---|---|
| Testar com o build que você gerou na sua máquina | `PORTAL_ARCHIVE=/caminho/portal-build.tar.gz` | Extrai o arquivo local |
| Deploy na Vercel (preview e produção) | `PORTAL_DEV_TOKEN` | Baixa da release do `portal-dev` |
| Dev sem portal | nenhuma | Só avisa e segue (o Admin funciona; `/documentation` mostra "não publicado") |
| **Vercel sem token** | nenhuma | **Erro**: o deploy para, em vez de subir um Admin sem portal sem ninguém perceber |

💡 **Falhar de propósito** na Vercel é uma decisão: se o download falhar, o
deploy novo não sobe e o **anterior continua no ar**, com o portal. Um deploy
"verde" sem portal só seria percebido quando você abrisse a documentação.

### Como o download funciona (e por que o token não vaza)

1. `GET /repos/elizfab/portal-dev/releases/tags/portal-build` com o token → a
   lista de arquivos da release.
2. `GET <url do asset>` com `Accept: application/octet-stream` → o GitHub
   responde **302** para um link temporário em outro domínio (armazenamento).
3. O `fetch` do Node segue o 302 e **remove o cabeçalho `Authorization`** ao
   mudar de domínio. 💡 É como entregar a chave ao porteiro do prédio, mas não
   ao entregador que ele chama: o link temporário já é a autorização.

Este comportamento foi verificado com um servidor falso: a API recebeu o
token; o "armazenamento" (outra origem) recebeu a requisição **sem** ele.

## Pré-requisitos

- Um `portal-build.tar.gz` local para testar. No `portal-dev`:

```bash
cd ../portal-dev/frontend
npm run build:admin
tar -czf /tmp/portal-build.tar.gz -C build .
```

## Passo a passo

### 1. Criar o script

`scripts/fetch-portal.mjs`:

```js
/**
 * Baixa o pacote do Portal Dev (Docusaurus) e o extrai em .portal/.
 * Roda no `vercel-build`, ANTES do `next build`, e à mão no dev (`npm run portal:fetch`).
 *
 * De onde vem o pacote (o primeiro que existir):
 *   1. PORTAL_ARCHIVE     → caminho de um .tar.gz local (ex.: build do portal na sua máquina)
 *   2. PORTAL_DEV_TOKEN   → baixa o asset da release "portal-build" do repositório privado
 *   3. nenhum dos dois    → na Vercel, ERRO (deploy sem portal); fora dela, só avisa e segue
 *
 * Por que .portal/ e não public/? Tudo em public/ é servido SEM passar pela
 * validação de sessão. Em .portal/, só o Route Handler /portal entrega os
 * arquivos, e só depois de validar a sessão no banco.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { config } from "dotenv";

// No dev, lê PORTAL_ARCHIVE/PORTAL_DEV_TOKEN do .env.local (na Vercel o arquivo não existe).
config({ path: ".env.local", quiet: true });

const TARGET = ".portal";
const REPO = process.env.PORTAL_DEV_REPO ?? "elizfab/portal-dev";
const TAG = process.env.PORTAL_RELEASE_TAG ?? "portal-build";
const ASSET = "portal-build.tar.gz";
// Só muda nos testes (servidor falso); em produção é sempre a API do GitHub.
const API = process.env.PORTAL_GITHUB_API ?? "https://api.github.com";

function fail(message) {
    console.error(`✖ [portal] ${message}`);
    process.exit(1);
}

async function download(token) {
    const headers = {
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
    };

    const release = await fetch(`${API}/repos/${REPO}/releases/tags/${TAG}`, {
        headers: { ...headers, Accept: "application/vnd.github+json" },
    });

    if (!release.ok) {
        fail(`release "${TAG}" de ${REPO} respondeu ${release.status}. Token sem acesso ou release inexistente.`);
    }

    const asset = (await release.json()).assets?.find((item) => item.name === ASSET);

    if (!asset) fail(`a release "${TAG}" não tem o arquivo ${ASSET}.`);

    // Accept octet-stream = o arquivo em si. O GitHub redireciona para um link
    // temporário; o fetch segue o redirecionamento e NÃO reenvia o token para outro domínio.
    const file = await fetch(asset.url, {
        headers: { ...headers, Accept: "application/octet-stream" },
    });

    if (!file.ok) fail(`download do pacote respondeu ${file.status}.`);

    const archive = join(tmpdir(), `${ASSET}-${Date.now()}`);
    writeFileSync(archive, Buffer.from(await file.arrayBuffer()));

    return archive;
}

async function main() {
    const token = process.env.PORTAL_DEV_TOKEN;
    let archive = process.env.PORTAL_ARCHIVE;

    if (!archive && !token) {
        if (process.env.VERCEL) {
            fail("PORTAL_DEV_TOKEN não definida na Vercel. Cadastre-a (Fase 08, passo 06).");
        }

        console.warn("⚠ [portal] sem PORTAL_ARCHIVE nem PORTAL_DEV_TOKEN: o portal não será publicado neste ambiente.");
        return;
    }

    if (!archive) archive = await download(token);
    if (!existsSync(archive)) fail(`arquivo não encontrado: ${archive}`);

    rmSync(TARGET, { recursive: true, force: true });
    mkdirSync(TARGET, { recursive: true });
    // execFile (sem shell): o caminho é passado como argumento, nunca interpretado.
    execFileSync("tar", ["-xzf", archive, "-C", TARGET], { stdio: "inherit" });

    if (!existsSync(join(TARGET, "index.html"))) {
        fail("o pacote não tem index.html na raiz. Ele foi gerado com `npm run build:admin`?");
    }

    console.log(`✔ [portal] publicado em ${TARGET}/`);
}

await main();
```

💡 Por que `execFileSync("tar", [...])` e não `execSync("tar -xzf " + caminho)`?
Com `execFile`, o caminho vai como **argumento**, sem passar por um shell: um
nome de arquivo com `;` ou `$(...)` não vira comando.

### 2. Scripts do `package.json`

Acrescente o `portal:fetch` e coloque o download **antes** de tudo no `vercel-build`:

```json
    "portal:fetch": "node scripts/fetch-portal.mjs",
```

```json
    "vercel-build": "node scripts/fetch-portal.mjs && prisma migrate deploy && next build"
```

💡 A ordem importa: o `next build` (passo 03) copia os arquivos de `.portal/`
para dentro da função. Se o download viesse depois, a função subiria vazia.

### 3. Ignorar a pasta no Git

No final do `.gitignore`:

```text
# portal-dev (build do Docusaurus baixado no deploy; conteúdo privado)
/.portal/
```

⚠️ Este é o item de segurança mais importante do passo: o repositório do
Admin é **público**. Um `git add .` sem esta linha publicaria o portal inteiro.

### 4. Ignorar a pasta no ESLint

O `.portal/` tem centenas de arquivos `.js` gerados pelo Docusaurus. Sem esta
linha, o `npm run lint` passa a analisá-los e acusa **milhares** de problemas
que não são seus. Em `eslint.config.mjs`, dentro de `globalIgnores`:

```js
    // Build do Portal Dev baixado no deploy (código gerado pelo Docusaurus):
    ".portal/**",
```

### 5. Variáveis no `.env.example`

O script lê o `.env.local` (no dev). Documente as variáveis no final do `.env.example`:

```bash
# ─── Portal Dev (Fase 08) ───────────────────────────────────
# Opcionais no dev (`npm run portal:fetch`). Na Vercel, só PORTAL_DEV_TOKEN.
# PORTAL_ARCHIVE="/tmp/portal-build.tar.gz"
# PORTAL_DEV_TOKEN=""
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `scripts/fetch-portal.mjs` | Criado | Baixa/extrai o pacote em `.portal/` |
| `package.json` | Alterado | `portal:fetch` e `vercel-build` |
| `.gitignore` | Alterado | `/.portal/` |
| `eslint.config.mjs` | Alterado | Ignora `.portal/**` |
| `.env.example` | Alterado | `PORTAL_ARCHIVE` e `PORTAL_DEV_TOKEN` (comentadas) |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `PORTAL_ARCHIVE=/tmp/portal-build.tar.gz npm run portal:fetch` | `✔ [portal] publicado em .portal/`; existe `.portal/index.html` e `.portal/portal-build.json` |
| 2 | `npm run portal:fetch` (sem variáveis) | `⚠ ... o portal não será publicado neste ambiente.` e saída 0 |
| 3 | `VERCEL=1 npm run portal:fetch` | `✖ ... PORTAL_DEV_TOKEN não definida na Vercel` e saída 1 |
| 4 | `git status` | `.portal/` **não** aparece |
| 5 | `npm run lint` (com `.portal/` preenchida) | Sem erros |

**Critério de aceite:** os 5 testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `release "portal-build" ... respondeu 404` | Release ainda não criada, ou token sem acesso ao repositório | Confira o CI do `portal-dev` e o escopo do token (passo 06) |
| `respondeu 401` | Token expirado ou revogado | Gere outro (passo 06) |
| `o pacote não tem index.html na raiz` | `tar` feito da pasta errada (`tar -C frontend ...`) | O pacote é o **conteúdo** de `build/`: `tar -czf ... -C build .` |
| `.portal/` aparece no `git status` | Linha do `.gitignore` faltando ou com erro | Corrija **antes** de qualquer commit |
| `npm run lint` com milhares de erros | `.portal/**` fora do `globalIgnores` | Item 4 |

## Commit sugerido

```bash
git add scripts/fetch-portal.mjs package.json .gitignore eslint.config.mjs .env.example
git commit -m "build(portal): baixa o pacote do Portal Dev no deploy"
```

## Referências

- [GitHub REST — Get a release by tag name](https://docs.github.com/en/rest/releases/releases#get-a-release-by-tag-name)
- [GitHub REST — Get a release asset](https://docs.github.com/en/rest/releases/assets#get-a-release-asset)
- [Node.js — `child_process.execFileSync`](https://nodejs.org/api/child_process.html#child_processexecfilesyncfile-args-options)

---

← [Passo anterior](01-decisao-e-arquitetura.md) · [Índice da fase](README.md) · [Próximo passo](03-servir-com-sessao.md) →
