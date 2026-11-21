# Passo 03 — Tornar privado e desligar o GitHub Pages

> **Fase:** 04 — Integração com o Admin\
> **Tempo estimado:** 20 min\
> **Depende de:** Admin, Fase 08, passo 07 até o item 3 (produção servindo o portal)

## Objetivo

Encerrar o acesso público: site do GitHub Pages fora do ar, repositório
privado e nenhum link apontando para o endereço antigo.

## 💡 O que "privado" protege, e o que não protege

| Protege | Não protege |
|---|---|
| O código e o conteúdo **a partir de agora** | Forks públicos que já existiam |
| O site (o Pages deixa de existir) | Clones que alguém já fez |
| A release `portal-build` (só com token) | Cópias em cache de buscadores |

💡 É trancar a porta depois que a casa já ficou aberta: protege daqui para a
frente. Para um caderno de estudos isso basta. Se algum dia um **segredo**
(senha, token) tiver sido commitado, trancar não resolve: é preciso trocar a
credencial.

## Pré-requisitos

- O Admin em produção já serve o portal em `/portal` (testado).

## Passo a passo

### 1. Desligar o GitHub Pages

Repositório `portal-dev` → **Settings → Pages** → **Unpublish site**.

### 2. Tornar o repositório privado

**Settings → General → Danger Zone → Change repository visibility → Make private**.

### 3. Remover links antigos da pasta `documentation/`

As anotações antigas têm um badge apontando para o GitHub Pages. Na raiz do repositório:

```bash
grep -rl "elizfab.github.io/portal-dev" documentation \
  | xargs sed -i '/Confira meu caderno de estudos/d; /elizfab.github.io\/portal-dev/d'
grep -rn "github.io" documentation README.md frontend/docs   # deve não mostrar nada
```

💡 No macOS, o `sed -i` exige um argumento vazio: `sed -i ''`.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `documentation/**/README.md` | Alterado | Badge do GitHub Pages removido (58 arquivos) |

## ✅ Como testar

Numa janela anônima (ou num terminal sem login no GitHub):

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `curl -s -o /dev/null -w "%{http_code}\n" https://elizfab.github.io/portal-dev/` | `404` |
| 2 | `curl -s -o /dev/null -w "%{http_code}\n" https://github.com/elizfab/portal-dev` | `404` |
| 3 | O deploy seguinte do Admin (Vercel) | `✔ [portal] publicado em .portal/` (o token continua com acesso) |

**Critério de aceite:** os 3 testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Pages ainda responde 200 | Cache da CDN do GitHub | Aguarde alguns minutos e teste de novo |
| Deploy do Admin falha com `404` depois de privar | Token com *Resource owner* errado | Admin, Fase 08, passo 06, item 1 |
| Workflow para por falta de minutos | Repositórios privados têm cota mensal de Actions no plano gratuito | Acompanhe em *Settings → Billing*; cada publicação leva cerca de 2 minutos |

## Commit sugerido

```bash
git add documentation
git commit -m "docs: remove links do GitHub Pages"
```

## Referências

- [GitHub — Unpublishing a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/unpublishing-a-github-pages-site)
- [GitHub — Setting repository visibility](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility)

---

← [Passo anterior](02-ci-e-release.md) · [Índice da fase](README.md) · [Mapa geral](../../README.md) →
