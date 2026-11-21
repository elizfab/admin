# Passo 01 — Build para o Admin

> **Fase:** 04 — Integração com o Admin\
> **Tempo estimado:** 40 min\
> **Depende de:** Admin, Fase 08, passo 01

## Objetivo

Gerar o portal para morar em `<Admin>/portal/`, com um link de volta ao Admin
e um arquivo `portal-build.json` que descreve o pacote.

## 💡 O endereço faz parte do build

O Docusaurus escreve os endereços **dentro** do HTML: o CSS é
`/portal/assets/css/...`, o link da categoria é `/portal/docs/backend`. 💡 É
como imprimir o endereço de devolução no envelope: se o envelope é impresso
com o endereço antigo, toda a correspondência volta para lá. Por isso o
`baseUrl` deixa de ser `/portal-dev/` (GitHub Pages) e passa a ser `/portal/`.

| Variável | Valor no CI (produção) | Valor padrão (dev) | Usada em |
|---|---|---|---|
| `PORTAL_BASE_URL` | `/portal/` | `/portal/` | Todos os links e arquivos do site |
| `PORTAL_URL` | `https://admin-elizabetefabri.vercel.app` (variável `ADMIN_URL`) | `http://localhost:3000` | Link **← Admin**, URLs canônicas e sitemap |

## Pré-requisitos

- Fases 01 a 03 lidas.
- Branch nova: `git checkout -b feat/portal-no-admin`.

## Passo a passo

### 1. Endereço vindo do ambiente

Em `frontend/docusaurus.config.ts`, troque as constantes do topo e o bloco do
GitHub Pages:

```ts
const repoUrl = 'https://github.com/elizfab/portal-dev';

// O portal é servido PELO ADMIN, em <admin>/portal/, só para quem está logado.
// Os valores vêm do ambiente para o mesmo build funcionar local e em produção:
//   PORTAL_URL      → origem do Admin (ex.: https://admin-elizabetefabri.vercel.app)
//   PORTAL_BASE_URL → caminho do portal dentro do Admin (sempre com "/" no fim)
const siteUrl = process.env.PORTAL_URL ?? 'http://localhost:3000';
const baseUrl = process.env.PORTAL_BASE_URL ?? '/portal/';
```

```ts
  url: siteUrl,
  baseUrl,
  trailingSlash: false,
```

(Remova `organizationName` e `projectName`: eram só para o `docusaurus deploy` no Pages.)

### 2. Link de volta ao Admin

Em `navbar.items`, antes do item do GitHub:

```ts
        // URL absoluta: o Docusaurus não acrescenta o baseUrl, então volta ao Admin.
        { href: `${siteUrl}/dashboard`, label: '← Admin', position: 'right', target: '_self' },
```

💡 Por que URL **absoluta**? Um caminho como `/dashboard` seria tratado como
página do portal e viraria `/portal/dashboard` (testado: até o prefixo
`pathname://` recebe o `baseUrl` em itens da navbar). Com a origem completa, o
Docusaurus deixa o link como está. O `target: '_self'` abre na mesma aba.

Aproveite para remover o item **"Gestão de projetos" duplicado** no fim do
dropdown "Categorias" (ele aparecia duas vezes).

### 3. Porta do dev

Em `frontend/package.json`, o `start` passa a usar a porta 3001 (a 3000 é do Admin):

```json
    "start": "docusaurus start --port 3001",
```

### 4. O "rótulo do pacote": `portal-build.json`

`frontend/scripts/write-build-info.mjs`:

```js
/**
 * Gera build/portal-build.json: o "rótulo" do pacote que o Admin baixa.
 * O Admin usa este arquivo na página /documentation para mostrar a versão
 * publicada e os atalhos das seções, sem precisar ler o Docusaurus.
 *
 * Uso (depois do build): node scripts/write-build-info.mjs
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const docsDir = "docs";
const buildDir = "build";
const baseUrl = process.env.PORTAL_BASE_URL ?? "/portal/";

if (!existsSync(buildDir)) {
  console.error("Pasta build/ não encontrada. Rode `npm run build` antes.");
  process.exit(1);
}

// Uma seção por pasta de docs/ que tenha _category_.json (rótulo e posição).
const sections = readdirSync(docsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(docsDir, entry.name, "_category_.json")))
  .map((entry) => {
    const category = JSON.parse(readFileSync(join(docsDir, entry.name, "_category_.json"), "utf8"));
    return {
      label: category.label ?? entry.name,
      position: category.position ?? 99,
      href: `${baseUrl}docs/${entry.name}`,
    };
  })
  .sort((a, b) => a.position - b.position)
  .map(({ label, href }) => ({ label, href }));

const commit =
  process.env.GITHUB_SHA ?? execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();

const info = {
  commit: commit.slice(0, 7),
  builtAt: new Date().toISOString(),
  sections,
};

writeFileSync(join(buildDir, "portal-build.json"), `${JSON.stringify(info, null, 2)}\n`);
console.log(`portal-build.json: ${sections.length} seções, commit ${info.commit}`);
```

E o script novo no `package.json`, logo depois do `build`:

```json
    "build:admin": "docusaurus build && node scripts/write-build-info.mjs",
```

💡 O Admin lê este JSON na página `/documentation`: commit, data e uma seção
por categoria. Categoria nova no portal = card novo no Admin, sem mexer no Admin.

### 5. Atualizar os READMEs

- `README.md` (raiz): troque o badge do GitHub Pages por um aviso de que o
  portal é privado e servido pelo Admin, e a URL do `npm start` por
  `http://localhost:3001/portal/`.
- `frontend/README.md`: tabela de comandos com a porta 3001 e o `build:admin`.
- `frontend/docs/gestao-projetos/mapeamento-de-projetos.mdx`: o link `[site](https://elizfab.github.io/portal-dev/)` vira `` Admin → `/portal` ``.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `frontend/docusaurus.config.ts` | Alterado | `siteUrl`/`baseUrl` do ambiente, ← Admin, item duplicado removido |
| `frontend/package.json` | Alterado | `start` na 3001, `build:admin` |
| `frontend/scripts/write-build-info.mjs` | Criado | Gera `build/portal-build.json` |
| `README.md`, `frontend/README.md`, `mapeamento-de-projetos.mdx` | Alterado | Sem GitHub Pages |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `cd frontend && npm start` | Portal em `http://localhost:3001/portal/` |
| 2 | `npm run typecheck && PORTAL_URL=http://localhost:3000 npm run build:admin` | `portal-build.json: 10 seções, commit …` |
| 3 | `grep -o 'href=/portal/img/favicon.ico' build/index.html` | Encontra (o build usa `/portal/`) |
| 4 | `tar -czf /tmp/portal-build.tar.gz -C build .` | Arquivo de ~2,5 MB, usado no Admin (Fase 08, passo 02) |

**Critério de aceite:** os 4 testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Pasta build/ não encontrada` | `write-build-info.mjs` rodou sozinho | Use `npm run build:admin` |
| `← Admin` vai para `/portal/dashboard` | `href` relativo | Use `` `${siteUrl}/dashboard` `` |
| `baseUrl` sem barra final dá aviso | `PORTAL_BASE_URL=/portal` | Sempre com `/` no fim: `/portal/` |

## Commit sugerido

```bash
git add frontend/docusaurus.config.ts frontend/package.json frontend/scripts frontend/README.md
git commit -m "feat(portal): build servido pelo Admin em /portal (baseUrl por ambiente, build:admin)"
```

## Referências

- [Docusaurus — `url` e `baseUrl`](https://docusaurus.io/docs/api/docusaurus-config#url)
- [Docusaurus — Navbar link](https://docusaurus.io/docs/api/themes/configuration#navbar-link)

---

← [Índice da fase](README.md) · [Próximo passo](02-ci-e-release.md) →
