# Passo 06 — Token, deploy hook e variáveis

> **Fase:** 08 — Portal Dev protegido\
> **Tempo estimado:** 30 min\
> **Depende de:** [Passo 05](05-testes.md)

## Objetivo

Criar e cadastrar as três "chaves" que ligam os dois repositórios, cada uma
com o **menor poder possível**.

## 💡 Quem guarda o quê

| Nome | O que é | Onde fica | Pode… | Não pode… |
|---|---|---|---|---|
| `PORTAL_DEV_TOKEN` | Token *fine-grained* do GitHub | Vercel (Admin): Production e Preview | **Ler** o conteúdo do `portal-dev` | Escrever, ler outros repositórios |
| `ADMIN_DEPLOY_HOOK` | URL de deploy hook da Vercel | GitHub (`portal-dev`): *secret* de Actions | Pedir um deploy da `main` do Admin | Mudar código, ler variáveis |
| `ADMIN_URL` | Endereço do Admin | GitHub (`portal-dev`): *variable* de Actions | Ser lido no build do portal | — (não é segredo) |

💡 **Menor privilégio**: a chave do carteiro abre só a caixa de correio, não a
casa. Se o `PORTAL_DEV_TOKEN` vazar, o estrago máximo é alguém **ler** o portal.

## Pré-requisitos

- Passos 02 a 05 concluídos.
- Você é dona da organização `elizfab` e do projeto na Vercel.

## Passo a passo

### 1. Criar o `PORTAL_DEV_TOKEN`

No GitHub: **foto de perfil → Settings → Developer settings → Personal access
tokens → Fine-grained tokens → Generate new token**.

| Campo | Valor |
|---|---|
| Token name | `admin-vercel-portal-dev-read` |
| Resource owner | **`elizfab`** (a organização, não a sua conta pessoal) |
| Expiration | 1 ano (anote a data no gerenciador de senhas) |
| Repository access | **Only select repositories** → `portal-dev` |
| Permissions → Repository → **Contents** | **Read-only** (o *Metadata: Read-only* entra sozinho) |

Copie o token (ele só aparece uma vez) e salve no gerenciador de senhas como
`ADMIN — PORTAL_DEV_TOKEN (expira em <data>)`.

⚠️ Se a organização exigir aprovação de tokens, o token fica **pendente**.
Aprove em **github.com/organizations/elizfab/settings** → *Personal access
tokens* → *Pending requests*.

💡 Por que *Contents: Read-only*? É a permissão que libera o download dos
arquivos de uma **release** de repositório privado. Nenhuma outra é necessária.

### 2. Cadastrar o token na Vercel

Projeto do Admin na Vercel → **Settings → Environment Variables → Add**:

| Campo | Valor |
|---|---|
| Key | `PORTAL_DEV_TOKEN` |
| Value | o token |
| Environments | **Production** e **Preview** (não marque Development) |
| Sensitive | ligado |

### 3. Criar o deploy hook do Admin

Vercel → projeto do Admin → **Settings → Git → Deploy Hooks**:

| Campo | Valor |
|---|---|
| Name | `portal-dev` |
| Branch | `main` |

Copie a URL gerada. ⚠️ Trate-a como **senha**: quem tem a URL dispara deploys.

### 4. Cadastrar o hook e a URL no `portal-dev`

No GitHub, repositório `portal-dev` → **Settings → Secrets and variables → Actions**:

- Aba **Secrets** → *New repository secret*: `ADMIN_DEPLOY_HOOK` = a URL do passo 3.
- Aba **Variables** → *New repository variable*: `ADMIN_URL` = `https://admin-elizabetefabri.vercel.app` (sem barra no final).

### 5. Verificar o token sem expor o valor

Na sua máquina (o valor fica só na variável do terminal):

```bash
read -s PORTAL_DEV_TOKEN && export PORTAL_DEV_TOKEN
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer $PORTAL_DEV_TOKEN" \
  https://api.github.com/repos/elizfab/portal-dev/releases/tags/portal-build
npm run portal:fetch
unset PORTAL_DEV_TOKEN
```

💡 `read -s` lê o que você cola **sem mostrar na tela** e sem gravar no
histórico do terminal, como aconteceria com `export PORTAL_DEV_TOKEN=ghp_...`.

## Arquivos criados ou alterados

Nenhum no código. Segredos **somente** na Vercel, no GitHub e no gerenciador de senhas.

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | O `curl` do item 5 | `200` |
| 2 | O `npm run portal:fetch` do item 5 | `✔ [portal] publicado em .portal/` |
| 3 | Vercel → Environment Variables | `PORTAL_DEV_TOKEN` em Production e Preview |
| 4 | `portal-dev` → Actions secrets/variables | `ADMIN_DEPLOY_HOOK` (secret) e `ADMIN_URL` (variable) |

**Critério de aceite:** os 4 testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `curl` responde `404` | Token criado com *Resource owner* = sua conta pessoal | Recrie com **Resource owner: elizfab** |
| `curl` responde `403` | Token pendente de aprovação na organização | Aprove em *Pending requests* (item 1) |
| `curl` responde `401` | Token colado com espaço ou expirado | Gere outro |
| Deploy do Admin falha com `PORTAL_DEV_TOKEN não definida` | Variável só em Production, e o deploy era Preview | Marque também **Preview** |

## Commit sugerido

Nenhum (configuração fora do código).

## Referências

- [GitHub — Fine-grained personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token)
- [GitHub — Approving fine-grained tokens in an organization](https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/managing-requests-for-personal-access-tokens-in-your-organization)
- [Vercel — Deploy Hooks](https://vercel.com/docs/deploy-hooks)
- [GitHub Actions — Variables](https://docs.github.com/en/actions/learn-github-actions/variables)

---

← [Passo anterior](05-testes.md) · [Índice da fase](README.md) · [Próximo passo](07-deploy-e-validacao.md) →
