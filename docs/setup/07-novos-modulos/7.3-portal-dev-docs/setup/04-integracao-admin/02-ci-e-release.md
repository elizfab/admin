# Passo 02 — CI e release

> **Fase:** 04 — Integração com o Admin\
> **Tempo estimado:** 40 min\
> **Depende de:** [Passo 01](01-build-para-o-admin.md)

## Objetivo

Trocar o deploy no GitHub Pages por um workflow que publica o pacote do portal
numa **release** e pede um novo deploy do Admin.

## 💡 Por que uma release, e não um artefato do Actions

| Opção | Problema |
|---|---|
| Artefato do Actions | Expira (no máximo 90 dias) e exige permissões de Actions para baixar |
| Commitar o build no Admin | O Admin é **público**: o conteúdo vazaria |
| **Asset de uma release fixa** (`portal-build`) | Não expira; um token com **Contents: read** baixa; `--clobber` substitui o arquivo a cada publicação |

💡 A release `portal-build` é a **caixa de correio** do Admin: sempre no mesmo
endereço, e a carta é trocada a cada envio.

### Os dois jobs

| Job | Quando | Faz |
|---|---|---|
| `build` | PR e push na `main` | `npm ci` → `typecheck` → `build:admin` → `tar`; em PR, só valida |
| `publish` | Push na `main` (e manual) | Cria a release se faltar, envia o `.tar.gz`, chama o deploy hook |

💡 O `publish` é o **único** job com `contents: write` (necessário para mexer
na release). O `build`, que roda código de dependências do npm, fica só com
leitura: menor privilégio também dentro do CI.

## Pré-requisitos

- Passo 01 concluído.
- Variável `ADMIN_URL` e segredo `ADMIN_DEPLOY_HOOK` cadastrados (Admin, Fase 08,
  passo 06). Sem o segredo, o workflow **funciona** e só avisa que não pediu o deploy.

## Passo a passo

### 1. Substituir o workflow

`.github/workflows/deploy.yml` (substitua o conteúdo inteiro):

`.github/workflows/deploy.yml`:

```yaml
# Portal Dev → Admin
# - Em PR: só valida (typecheck + build).
# - Na main: gera o pacote do portal, publica como asset da release
#   "portal-build" e pede um novo deploy do Admin (deploy hook da Vercel).
# O portal NÃO é mais publicado no GitHub Pages: quem o serve é o Admin,
# só para quem está logado.
name: Portal Dev

on:
  push:
    branches: [main]
    paths:
      - "frontend/**"
      - ".github/workflows/deploy.yml"
  pull_request:
    paths:
      - "frontend/**"
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: portal-${{ github.ref }}
  cancel-in-progress: true

defaults:
  run:
    working-directory: frontend

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # necessário para "última atualização" das páginas
      - uses: actions/setup-node@v4
        with:
          node-version-file: frontend/.nvmrc
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm run typecheck
      - name: Build para o Admin
        run: npm run build:admin
        env:
          # Origem do Admin (variável do repositório, não é segredo).
          PORTAL_URL: ${{ vars.ADMIN_URL }}
          PORTAL_BASE_URL: /portal/
      - name: Empacotar
        run: tar -czf portal-build.tar.gz -C build .
      - uses: actions/upload-artifact@v4
        if: github.event_name != 'pull_request'
        with:
          name: portal-build
          path: frontend/portal-build.tar.gz
          retention-days: 1

  publish:
    if: github.event_name != 'pull_request'
    needs: build
    runs-on: ubuntu-latest
    permissions:
      contents: write # criar/atualizar a release
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: portal-build
          path: frontend
      - name: Publicar na release "portal-build"
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          gh release view portal-build >/dev/null 2>&1 || \
            gh release create portal-build --title "Pacote do Portal Dev para o Admin" \
              --notes "Atualizado automaticamente a cada push na main. Não apague." --latest=false
          gh release upload portal-build portal-build.tar.gz --clobber
      - name: Pedir novo deploy do Admin
        env:
          ADMIN_DEPLOY_HOOK: ${{ secrets.ADMIN_DEPLOY_HOOK }}
        run: |
          if [ -z "$ADMIN_DEPLOY_HOOK" ]; then
            echo "::warning::Segredo ADMIN_DEPLOY_HOOK ausente: o Admin só verá o portal novo no próximo deploy."
            exit 0
          fi
          curl -fsS -X POST "$ADMIN_DEPLOY_HOOK" > /dev/null
          echo "Deploy do Admin solicitado."
```

💡 `--latest=false` impede que a `portal-build` apareça como "Latest release"
do repositório: ela é um depósito técnico, não uma versão do produto.

### 2. Publicar

```bash
git add .github/workflows/deploy.yml
git commit -m "ci(portal): publica o pacote na release portal-build e aciona o deploy do Admin"
git push -u origin feat/portal-no-admin
gh pr create --base main --title "feat(portal): servido pelo Admin" --body "Fase 04 (portal-dev) / ADR-007 do Admin."
```

Com o CI ✅ no PR (só o job `build`), faça o merge. O push na `main` roda o `publish`.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `.github/workflows/deploy.yml` | Substituído | Build, release e deploy hook (sem Pages) |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Actions do PR | Só o job `build` roda, ✅ |
| 2 | Actions do merge na `main` | `build` ✅ e `publish` ✅ |
| 3 | `gh release view portal-build` | Asset `portal-build.tar.gz` |
| 4 | Log do `publish` | `Deploy do Admin solicitado.` (ou o *warning* se o segredo ainda não existir) |

**Critério de aceite:** a release `portal-build` tem o `.tar.gz` do último push.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `publish` falha com `HTTP 403: Resource not accessible by integration` | Job sem `contents: write` | Confira o bloco `permissions` do job `publish` |
| Links do pacote com `http://localhost:3000` | Variável `ADMIN_URL` não cadastrada | Cadastre em *Settings → Secrets and variables → Actions → Variables* |
| `Deploy do Admin solicitado`, mas nada na Vercel | URL do hook errada ou hook apagado | Gere outro hook e atualize o segredo |

## Commit sugerido

Incluído no item 2.

## Referências

- [GitHub CLI — `gh release upload`](https://cli.github.com/manual/gh_release_upload)
- [GitHub Actions — `permissions`](https://docs.github.com/en/actions/using-jobs/assigning-permissions-to-jobs)
- [Vercel — Deploy Hooks](https://vercel.com/docs/deploy-hooks)

---

← [Passo anterior](01-build-para-o-admin.md) · [Índice da fase](README.md) · [Próximo passo](03-tornar-privado.md) →
