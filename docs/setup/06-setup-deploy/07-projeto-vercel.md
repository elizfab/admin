# Passo 07 — Projeto na Vercel e variáveis por ambiente

> **Fase:** 06 — Deploy\
> **Tempo estimado:** 40 min\
> **Depende de:** [Passo 06](06-bancos-supabase.md)

## Objetivo

Criar o projeto na Vercel conectado ao GitHub e cadastrar **todas** as
variáveis, separadas por ambiente, **antes** do primeiro deploy.

## 💡 Por que as variáveis vêm antes do deploy

Graças ao passo 02, um deploy sem variáveis **falha no build**, o que é bom.
Mas é mais simples cadastrar tudo primeiro e fazer o primeiro deploy já
correto.

### Ambientes da Vercel

| Ambiente | Quando é usado | Banco |
|---|---|---|
| **Production** | Push/merge na `main` | `personal-platform` |
| **Preview** | Qualquer outro branch ou PR | `personal-platform-preview` |
| **Development** | `vercel dev` / `vercel env pull` (não usado; o local usa `.env.local`) | — |

💡 Cada variável é cadastrada **por ambiente**. É como ter **duas chaves
diferentes** para o mesmo cadeado em dois prédios: a do prédio de testes não
abre o prédio real.

## Pré-requisitos

- Passos 04 a 06 concluídos.
- Conta na Vercel (<https://vercel.com>) com acesso ao GitHub da `elizfab`.

## Passo a passo

### 1. Importar o projeto

1. <https://vercel.com/new> → **Import Git Repository**.
2. Se a `elizfab` não aparecer: **Adjust GitHub App Permissions** → conceda
   acesso ao repositório `personal-platform-admin`.
3. Selecione o repositório. Confira:
   - **Project Name:** `personal-platform-admin` (define a URL `personal-platform-admin.vercel.app`, se estiver livre)
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (raiz)
   - **Build Command:** pode deixar o padrão; o `vercel.json` define `npm run vercel-build`
4. **Ainda não clique em Deploy.** Abra **Environment Variables** e siga o item 2.

> Se a tela não permitir separar as variáveis por ambiente antes do deploy,
> clique em **Deploy** mesmo assim. O build vai falhar no passo 02 (é o
> esperado). Cadastre as variáveis em **Settings → Environment Variables**
> e use **Redeploy**.

### 2. Gerar os segredos

Um para **cada** ambiente (nunca reutilize o do `.env.local`):

```bash
openssl rand -base64 32   # → BETTER_AUTH_SECRET de Production
openssl rand -base64 32   # → BETTER_AUTH_SECRET de Preview
```

Salve os dois no gerenciador de senhas.

### 3. Cadastrar as variáveis

Em **Settings → Environment Variables**, cadastre cada linha marcando
**somente** o ambiente indicado:

| Variável | Production | Preview |
|---|---|---|
| `DATABASE_URL` | `PROD — DATABASE_URL` | `PREVIEW — DATABASE_URL` |
| `DIRECT_URL` | `PROD — DIRECT_URL` | `PREVIEW — DIRECT_URL` |
| `BETTER_AUTH_SECRET` | segredo de Production | segredo de Preview |
| `BETTER_AUTH_URL` | `https://personal-platform-admin.vercel.app` | **não cadastrar** |
| `BETTER_AUTH_ALLOWED_HOSTS` | **não cadastrar** | `personal-platform-admin-*-<slug>.vercel.app` |

Sobre o `<slug>`: é o identificador da sua conta ou do time na Vercel. Ele
aparece no final das URLs de preview (ex.: `…-elizfab.vercel.app` ou
`…-elizfabs-projects.vercel.app`). Confira no primeiro preview (passo 08) e
ajuste se necessário.

⚠️ **Não** cadastre `SEED_ADMIN_*` na Vercel: o seed roda da sua máquina
(passo 08).

Marque as variáveis com segredo (`DATABASE_URL`, `DIRECT_URL` e
`BETTER_AUTH_SECRET`) como **Sensitive**, se a opção aparecer: depois de
salvas, não podem mais ser lidas pelo painel.

### 4. Conferir proteção e região

- **Settings → Deployment Protection:** *Vercel Authentication* ligado, com
  **Standard Protection** (o padrão em projetos novos). Os previews só abrem
  para quem está logado na sua conta Vercel; a produção fica pública, o que
  aqui é correto, porque a aplicação exige o login próprio.
- **Settings → Functions → Function Region:** deve mostrar **São Paulo
  (`gru1`)**, definido pelo `vercel.json`.

### 5. Domínio próprio (opcional)

**Settings → Domains → Add**. Se adicionar `admin.seudominio.com.br`:

1. Configure o DNS conforme a tela da Vercel.
2. Troque o `BETTER_AUTH_URL` de **Production** para `https://admin.seudominio.com.br`.
3. Faça **Redeploy** da produção.

## Arquivos criados ou alterados

Nenhum no repositório; tudo fica nas configurações da Vercel.

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Settings → Environment Variables | 5 variáveis em Production e 4 em Preview, conforme a tabela |
| 2 | Nenhuma variável marcada para **Development** | Correto |
| 3 | Deployment Protection | Vercel Authentication + Standard Protection |

**Critério de aceite:** os três testes passam.

## Referências

- [Vercel — Environment variables](https://vercel.com/docs/environment-variables)
- [Vercel — Deployment Protection](https://vercel.com/docs/deployment-protection)
- [Vercel — Function regions](https://vercel.com/docs/functions/configuring-functions/region)
- [Vercel — Domains](https://vercel.com/docs/domains)

---

← [Passo anterior](06-bancos-supabase.md) · [Índice da fase](README.md) · [Próximo passo](08-primeiro-deploy.md) →
