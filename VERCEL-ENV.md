# Variáveis de ambiente na Vercel — Painel Admin

> **Projeto Vercel:** `prj_5WV70Vp9vUVb1UpeZ4KNVn0aFK2d` (`elizabetefabri/admin`)
> **Deploy:** `main` → Production · demais branches/PRs → Preview
> **Status (2026-11-15):** ✅ todas as 8 variáveis cadastradas via `vercel env add`
>
> | Variável | Production | Preview |
> |---|---|---|
> | `DATABASE_URL` | ✅ Supabase prod (pooler Transaction :6543) | ⚠️ **aponta para o banco de prod** (decisão temporária — ver abaixo) |
> | `DIRECT_URL` | ✅ Supabase prod (pooler Session :5432) | ⚠️ idem |
> | `BETTER_AUTH_SECRET` | ✅ segredo dedicado | ✅ segredo dedicado |
> | `BETTER_AUTH_URL` | ✅ `https://admin-elizabetefabri.vercel.app` | — (correto não ter) |
> | `BETTER_AUTH_ALLOWED_HOSTS` | — (correto não ter) | ✅ `admin-*-elizabetefabri.vercel.app` |
>
> ⚠️ **Preview usando o banco de produção:** decisão consciente e temporária.
> O `vercel-build` roda `prisma migrate deploy` em previews — migrations de
> branches de teste **alteram o banco real**. Quando criar o projeto Supabase
> de preview (`personal-platform-preview`, ver
> `docs/setup/06-setup-deploy/06-bancos-supabase.md`), basta trocar
> `DATABASE_URL`/`DIRECT_URL` do Preview pelas strings dele.
>
> **Proteção de deploy:** ajustada para `preview` via API — ou seja,
> previews exigem login Vercel e **produção é pública** (a aplicação tem
> login próprio). URL real: `https://admin-elizabetefabri.vercel.app`
> (`admin.vercel.app` está ocupado por outro projeto).

Este guia lista **exatamente** o que cadastrar em
**Settings → Environment Variables** do projeto, usando os valores do
`.env.local` como base. Nenhum valor secreto deve ser commitado.

---

## 1. Variáveis obrigatórias (build falha sem elas)

O `next.config.ts` valida no build de produção (`src/lib/env/required-env.ts`):

| Variável | Regra |
|---|---|
| `DATABASE_URL` | Obrigatória — pooler **Transaction** do Supabase (porta 6543, `?pgbouncer=true`) |
| `BETTER_AUTH_SECRET` | Obrigatória, **mínimo 32 caracteres** |
| `BETTER_AUTH_URL` **ou** `BETTER_AUTH_ALLOWED_HOSTS` | Uma das duas: URL fixa em Production, hosts de preview em Preview |

## 2. O que cadastrar — por ambiente

### Production (só `main`)

| Variável | Valor | Origem |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.<ref>:<senha>@<host-pooler>:6543/postgres?pgbouncer=true` | Supabase → projeto de **produção** → **Connect → Transaction pooler** |
| `DIRECT_URL` | `postgresql://postgres.<ref>:<senha>@<host-pooler>:5432/postgres` | Supabase → **Connect → Session pooler** (a conexão direta é IPv6, a Vercel não suporta) |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` | Gerar um **novo** (não reutilizar o do `.env.local`) |
| `BETTER_AUTH_URL` | `https://admin-elizabetefabri.vercel.app` | URL pública real do deploy (o nome `admin.vercel.app` está ocupado por outro projeto) |

### Preview (branches e PRs)

| Variável | Valor | Origem |
|---|---|---|
| `DATABASE_URL` | Idem, mas do projeto Supabase **`personal-platform-preview`** | Banco descartável de testes |
| `DIRECT_URL` | Idem, Session pooler do projeto preview | — |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` | Outro segredo, diferente do de Production |
| `BETTER_AUTH_ALLOWED_HOSTS` | `admin-*-elizabetefabri.vercel.app` | Sufixo da conta (`elizabetefabri`) — previews ficam `admin-git-<branch>-elizabetefabri.vercel.app` |

### ❌ Não cadastrar na Vercel

- `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` — o seed roda
  **só local**, da sua máquina (`npx prisma db seed`).
- Nada para o ambiente **Development** da Vercel — o local usa `.env.local`.

## 3. Passo a passo no painel

1. Acesse <https://vercel.com> → projeto do admin (ou
   `https://vercel.com/<seu-time>/admin/settings/environment-variables`).
2. Para cada variável da tabela:
   - **Key:** nome exato (ex.: `DATABASE_URL`).
   - **Value:** cole o valor completo.
   - **Environments:** marque **Production** ou **Preview** conforme a tabela
     (cada variável é cadastrada separadamente por ambiente — são 4 entradas
     em Production e 4 em Preview, total 8).
   - Marque como **Sensitive**: `DATABASE_URL`, `DIRECT_URL` e
     `BETTER_AUTH_SECRET` (depois de salvas, não podem ser lidas de volta).
3. **Settings → Deployment Protection:** manter *Vercel Authentication* +
   *Standard Protection* (previews só abrem logado na sua conta; produção é
   pública e protegida pelo login da aplicação).
4. **Settings → Functions → Function Region:** deve estar **São Paulo
   (`gru1`)**, definido pelo `vercel.json`.

## 4. Depois de cadastrar

1. **Deployments → ⋯ → Redeploy** no último deploy (ou push na `main`) —
   variáveis novas só valem para builds novos.
2. Se o build falhar com `Build interrompido — variáveis de ambiente
   inválidas`, confira a mensagem: ela lista exatamente o que falta.
3. Smoke test em produção: abrir a URL, confirmar que a tela de login
   carrega (sem erro de autenticação) e que o login funciona.
4. Smoke test em preview: abrir um PR/branch, confirmar que o login do
   preview aceita o host `admin-*-<slug>.vercel.app`.

## 5. Valores do `.env.local` — o que muda na nuvem

| `.env.local` (local) | Vercel (nuvem) |
|---|---|
| `DATABASE_URL` → `localhost:5432` (Docker) | Pooler Transaction do Supabase, porta 6543 |
| `DIRECT_URL` → `localhost:5432` | Session pooler do Supabase, porta 5432 |
| `BETTER_AUTH_URL=http://localhost:3000` | `https://admin.vercel.app` (só Production) |
| `BETTER_AUTH_SECRET` local | Segredo novo por ambiente |
| `SEED_ADMIN_*` | **Não vai** para a Vercel |

## Referências

- [Supabase — Connecting to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Vercel — Environment variables](https://vercel.com/docs/environment-variables)
- `docs/setup/06-setup-deploy/06-bancos-supabase.md` (como obter as strings do Supabase)
- `docs/setup/06-setup-deploy/07-projeto-vercel.md` (passo oficial da fase)
