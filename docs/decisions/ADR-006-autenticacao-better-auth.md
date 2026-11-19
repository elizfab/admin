# ADR-006 — Autenticação com Better Auth

| Campo | Valor |
|---|---|
| **Status** | Aceita |
| **Data** | 11/11/2026 |
| **Substitui** | Proposta original da seção 11 do ARCHITECTURE.md (Auth.js Credentials + JWT) |
| **Decisora** | Liza (Elizabete Fabri) |

## Contexto

A proposta inicial usava Auth.js v5 com Credentials Provider e sessão JWT.
Na revisão de 11/11/2026 foram constatados os seguintes fatos:

- Desde setembro de 2025, o projeto Auth.js faz parte do Better Auth. A
  manutenção continua para segurança e questões urgentes, sem novas
  funcionalidades.
- O `next-auth` v5 nunca saiu do beta (`5.0.0-beta.32`); a versão estável é a 4.x.
- Os próprios mantenedores indicam o Better Auth para projetos novos.

Requisitos do projeto (ARCHITECTURE.md, seções 11.1 e 11.10): uma conta
administradora, sem cadastro público, login por e-mail e senha, hash forte,
rate limiting, logout, expiração de sessão, proteção no servidor e
possibilidade futura de revogar sessões por dispositivo.

## Decisão

Adotar o **Better Auth** com:

- `emailAndPassword` habilitado e **`disableSignUp: true`** (sem cadastro público);
- sessões **persistidas no banco** (tabela `session`), via `prismaAdapter` (Prisma 7);
- expiração de **8 horas**, renovada no máximo uma vez por hora de uso;
- **rate limiting** com armazenamento em banco (5 tentativas de login por minuto);
- campos adicionais `role` e `isActive` no usuário, **não editáveis pelo cliente**;
- bloqueio de login de contas com `isActive = false` (hook antes de criar a sessão);
- conta administradora criada por **seed** com o hash do próprio Better Auth (scrypt).

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Auth.js v5 (beta) | Sem evolução; v5 nunca estável; Credentials não traz rate limiting nem hash prontos |
| Auth.js v4 (estável) | API legada, anterior ao App Router |
| Clerk / Auth0 | Serviço externo pago por usuário; dados de identidade fora do próprio banco |
| Implementação própria | Alto risco de falhas de segurança; reinventaria o que a biblioteca já entrega testado |

## Consequências

**Positivas**

- Hash de senha, rate limiting, cookies seguros e proteção CSRF (verificação
  de `Origin`) prontos e mantidos.
- Sessão no banco: o logout **invalida de fato** a sessão (validado: o cookie
  antigo deixa de funcionar), e a revogação por dispositivo fica viável
  (seção 11.9).
- Dados de identidade no próprio PostgreSQL, sob o mesmo Prisma.

**Negativas / cuidados**

- Cada validação de sessão consulta o banco (mitigável com `cookieCache` no futuro).
- O CLI do Better Auth não carrega arquivos com `import "server-only"`; essa
  proteção fica nos módulos consumidores (`lib/auth/session.ts`).
- O adapter do Better Auth **não suporta Prisma 8**; manter o Prisma fixado em `@7`.
- As tabelas `user`, `session`, `account`, `verification` e `rateLimit`
  seguem o formato do Better Auth; mudanças de estrutura devem usar
  `npx auth generate` + migration.

## Referências

- [Auth.js is now part of Better Auth](https://github.com/nextauthjs/next-auth/discussions/13252)
- [Better Auth — Documentação](https://www.better-auth.com/docs)
- [Better Auth — Prisma adapter](https://www.better-auth.com/docs/adapters/prisma)
- [Better Auth — Next.js](https://www.better-auth.com/docs/integrations/next)
