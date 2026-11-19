# Alterações — 2026-11-15

> Registro de operação da Fase 06 (deploy na Vercel). Ficava na raiz como
> `ALTERACOES-2026-11-15.md`; movido para cá em 2026-11-19 (T-0017).
> O resumo destas mudanças também está em [`docs/CHANGELOG.md`](../../../CHANGELOG.md) (2026-11-15).

## O que foi alterado e por quê

### 1. Ícone da tela de login

- **Arquivo:** `src/modules/auth/components/LoginForm/LoginForm.tsx`
- **O quê:** o ícone `ShieldLock` do `lucide-react` foi substituído pela
  imagem `/admin.png` (mesmo asset já usado como favicon/ícone do projeto),
  renderizada com `next/image` dentro do badge circular existente.
- **Por quê:** padronizar a identidade visual do painel com a logo oficial
  do admin em vez do ícone genérico do Lucide.
- **Estilos:** nenhuma alteração em `LoginForm.module.scss` — a classe
  `brandIcon` continua aplicando o `drop-shadow`; `color` não tem efeito em
  `<img>`, o que é inócuo.

### 2. Documentação de variáveis de ambiente para a Vercel

- **Arquivo criado:** `VERCEL-ENV.md` (raiz do projeto)
- **O quê:** passo a passo para cadastrar as variáveis do `.env.local` no
  projeto Vercel `prj_5WV70Vp9vUVb1UpeZ4KNVn0aFK2d`, separadas por ambiente
  (Production/Preview), com as strings corretas do Supabase (pooler
  Transaction para `DATABASE_URL`, Session para `DIRECT_URL`), segredos
  novos por ambiente e o que **não** cadastrar (`SEED_ADMIN_*`).
- **Por quê:** o deploy já foi feito na Vercel, mas as variáveis ainda não
  foram cadastradas — sem elas o build falha na validação de ambiente
  (`src/lib/env/required-env.ts`).

### 3. Variáveis de ambiente configuradas via Vercel CLI

- **O quê:** via `vercel env add` (projeto linkado `elizabetefabri/admin`):
  - Production: `BETTER_AUTH_SECRET` (segredo novo), `BETTER_AUTH_URL=https://admin-elizabetefabri.vercel.app`
  - Preview: `BETTER_AUTH_SECRET` (outro segredo), `BETTER_AUTH_ALLOWED_HOSTS=admin-*-elizabetefabri.vercel.app`
- **Correção de URL:** a URL real do deploy é `admin-elizabetefabri.vercel.app`
  (`admin.vercel.app` está ocupado por outro projeto). O header do portfolio
  foi ajustado para essa URL.
- **Deploy e variáveis (CLI):** projeto linkado `elizabetefabri/admin`;
  as 8 variáveis foram cadastradas via `vercel env add` — Production e
  Preview com `DATABASE_URL`/`DIRECT_URL` do Supabase
  (`hjqcntrlktdjwxrytazz`, pooler Transaction :6543 e Session :5432),
  `BETTER_AUTH_SECRET` dedicado por ambiente, `BETTER_AUTH_URL` de
  Production e `BETTER_AUTH_ALLOWED_HOSTS` de Preview.
- **Preview no banco de prod:** decisão do usuário — o Preview aponta para
  o mesmo banco de produção até existir o projeto Supabase de preview.
- **Proteção de deploy:** `ssoProtection` ajustado de
  `all_except_custom_domains` para `preview` via API da Vercel — previews
  seguem protegidos por login Vercel e produção ficou pública (a app tem
  login próprio).
- **Redeploy:** `vercel redeploy` do último deploy de produção → **Ready**;
  migrations aplicadas no Supabase; conta administradora criada via
  `prisma db seed` com `DIRECT_URL` de produção; login testado com sucesso
  em `https://admin-elizabetefabri.vercel.app`.

## Comandos de start (referência)

| Comando | O que faz | Porta |
|---|---|---|
| `npm run dev` | `next dev` — desenvolvimento com hot reload | 3000 (se ocupada, o Next usa a próxima livre, ex.: 3001 — já previsto em `trustedOrigins` do Better Auth) |
| `npm run build` + `npm start` | `next start` — serve o build de produção | 3000 |

É um único app Next.js: login, dashboard e APIs sobem juntos na mesma porta.
Para validar alterações durante o desenvolvimento, use `npm run dev`
(não precisa de porta extra).

## Sugestão de commit

```bash
git add src/modules/auth/components/LoginForm/LoginForm.tsx VERCEL-ENV.md .env.example docs/setup/06-setup-deploy/registros/2026-11-15-identidade-visual-e-vercel.md
git commit -m "feat(auth): usa logo admin.png no login e documenta envs da Vercel"
```
