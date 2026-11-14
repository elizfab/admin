# Passo 03 — Preparar o projeto para a Vercel

> **Fase:** 06 — Deploy\
> **Tempo estimado:** 40 min\
> **Depende de:** [Passo 02](02-validacao-de-variaveis.md)

## Objetivo

Fixar a versão do Node.js, configurar o build da Vercel (migrations +
região) e permitir login nos **previews**, cujas URLs mudam a cada deploy.

## 💡 Por que

### 1. A mesma versão do Node em todo lugar

`.nvmrc` diz “use o Node 22” para o `nvm`, para o CI (`setup-node`) e para
a Vercel; `engines` no `package.json` registra o mínimo aceito. 💡 Mesma
receita, mesmo forno, em todas as cozinhas.

### 2. Migrations no build da Vercel

```text
npm install  →  postinstall: prisma generate
vercel-build →  prisma migrate deploy  →  next build
```

Cada ambiente da Vercel tem o **próprio** `DIRECT_URL` (passo 07): o build
de um preview migra o banco de **preview**; o de produção, o de
**produção**. Se a migration falhar, o build falha e a versão anterior
continua no ar.

### 3. Região `gru1` (São Paulo)

As funções da Vercel rodam em Washington (`iad1`) por padrão. Com o banco
em São Paulo, **cada consulta** atravessaria o continente, ida e volta. O
Hobby permite escolher uma região; a escolha é `gru1`, a mesma do Supabase.

### 4. Login em previews: URL base dinâmica

O Better Auth confere se cada requisição vem da **URL oficial** da aplicação
(proteção CSRF). Na produção, a URL é fixa (`BETTER_AUTH_URL`). Mas cada
preview tem uma URL diferente, como:

```text
admin-a1b2c3d4-elizfab.vercel.app        (por deploy)
admin-git-minha-branch-elizfab.vercel.app (por branch)
```

Com `BETTER_AUTH_ALLOWED_HOSTS`, o Better Auth aceita **só os hosts que
batem com o padrão** e recusa o resto. Validado aqui:

| Situação simulada                                                               | Resultado                        |
| ------------------------------------------------------------------------------- | -------------------------------- |
| Login vindo de `admin-git-feature-x-elizfab.vercel.app`                         | `200` ✅                         |
| Origem `golpe-elizfab.vercel.app`                                               | `403` (origem inválida) ✅       |
| Host `golpe.vercel.app`                                                         | Recusado (host fora da lista) ✅ |
| Cookie `__Secure-better-auth.session_token` (HTTPS) no `proxy.ts` e no servidor | Sessão reconhecida ✅            |

⚠️ **Não use `*.vercel.app`**: qualquer pessoa pode publicar algo em
`*.vercel.app`, e esse padrão confiaria em todos. Use o prefixo do **seu**
projeto.

## Pré-requisitos

- Passo 02 concluído.

## Passo a passo

### 1. Versão do Node

```bash
echo "22" > .nvmrc
```

No `package.json`, no primeiro nível (ao lado de `"scripts"`):

```json
"engines": {
  "node": ">=20.19"
},
```

### 2. Script de build da Vercel

Em `"scripts"`:

```json
"vercel-build": "prisma migrate deploy && next build"
```

### 3. `vercel.json` (na raiz)

`vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run vercel-build",
  "regions": ["gru1"]
}
```

> Se o seu projeto Supabase ficou em outra região, troque `gru1` pela
> região Vercel mais próxima (lista em <https://vercel.com/docs/regions>).

### 4. URL base dinâmica no Better Auth

Em `src/lib/auth/auth.ts`, logo após `const EIGHT_HOURS = ...`, adicione a
função e passe o resultado para o `betterAuth`:

```ts
/**
 * URL base da autenticação.
 * - Local, testes e produção: BETTER_AUTH_URL (uma URL fixa).
 * - Previews da Vercel: cada deploy tem uma URL diferente. Nesse caso, defina
 *   BETTER_AUTH_ALLOWED_HOSTS com os padrões de host permitidos (separados por
 *   vírgula). Hosts fora da lista são recusados.
 */
function resolveBaseURL() {
  const allowedHosts = process.env.BETTER_AUTH_ALLOWED_HOSTS?.split(",")
    .map((host) => host.trim())
    .filter(Boolean);

  if (allowedHosts && allowedHosts.length > 0) {
    return { allowedHosts, protocol: "https" as const };
  }

  return process.env.BETTER_AUTH_URL;
}

export const auth = betterAuth({
  baseURL: resolveBaseURL(),

  database: prismaAdapter(prisma, { provider: "postgresql" }),
  // ... resto da configuração, sem mudanças
```

### 5. Atualizar o `.env.example`

No bloco de autenticação, acrescente:

```bash
# Somente nos PREVIEWS da Vercel (no lugar de BETTER_AUTH_URL):
# BETTER_AUTH_ALLOWED_HOSTS="admin-*-elizfab.vercel.app"
```

## Arquivos criados ou alterados

| Arquivo                | Ação     | Descrição                             |
| ---------------------- | -------- | ------------------------------------- |
| `.nvmrc`               | Criado   | Versão do Node                        |
| `package.json`         | Alterado | `engines` e `vercel-build`            |
| `vercel.json`          | Criado   | Comando de build e região             |
| `src/lib/auth/auth.ts` | Alterado | `resolveBaseURL()`                    |
| `.env.example`         | Alterado | Documenta `BETTER_AUTH_ALLOWED_HOSTS` |

## ✅ Como testar

| #   | Teste                                              | Resultado esperado                                          |
| --- | -------------------------------------------------- | ----------------------------------------------------------- |
| 1   | `npm run typecheck && npm run lint && npm test`    | Tudo passa                                                  |
| 2   | `npm run vercel-build` (com o banco local rodando) | `No pending migrations to apply.` e build concluído         |
| 3   | `npm run test:e2e`                                 | `20 passed` (o `BETTER_AUTH_URL` fixo continua funcionando) |

A URL dinâmica será testada de verdade no primeiro preview (passo 08).

**Critério de aceite:** os três testes passam.

## Commit sugerido

```bash
git add .nvmrc package.json vercel.json src/lib/auth/auth.ts .env.example
git commit -m "chore(deploy): prepara build, região e URL dinâmica para a Vercel"
```

## Referências

- [Vercel — vercel.json (buildCommand, regions)](https://vercel.com/docs/project-configuration/vercel-json)
- [Vercel — Configuring regions for Functions](https://vercel.com/docs/functions/configuring-functions/region)
- [Better Auth — Dynamic Base URL](https://www.better-auth.com/docs/guides/dynamic-base-url)
- [Prisma — Deploy migrations](https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate)

---

← [Passo anterior](02-validacao-de-variaveis.md) · [Índice da fase](README.md) · [Próximo passo](04-repositorio-github.md) →
