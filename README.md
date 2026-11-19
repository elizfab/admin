# Admin — Personal Platform

> **Produção:** <https://admin-elizabetefabri.vercel.app/>

Portal administrativo pessoal, privado e extensível: ponto central de acesso
aos módulos Estudos, Financeiro, PDI e Projetos.

Admin é um painel administrativo completo, com autenticação segura, gestão de
projetos e controle financeiro em um só lugar. Construído com Next.js 16,
React 19 e TypeScript, banco PostgreSQL no Supabase via Prisma, autenticação
Better Auth e cobertura de testes com Jest e Playwright — tudo em arquitetura
modular com temas claro e escuro.

## Status

| Marco | Status |
|---|---|
| Fase 01 (frontend) concluída — banco, autenticação e backend vieram nas fases seguintes | ✅ histórica |
| Fases 00 a 05 concluídas (ambiente, frontend, banco/Prisma, autenticação, backend, testes E2E e integração) | ✅ |
| Fase 06 concluída — repositório, CI, deploy na Vercel e variáveis por ambiente | ✅ |
| **Deploy em produção** | ✅ <https://admin-elizabetefabri.vercel.app/> |

## Stack

- **Framework:** Next.js 16 (App Router) · React 19 · TypeScript strict
- **Estilo:** SCSS Modules · design system com tokens de tema (paleta Dracula, claro/escuro)
- **UI:** Radix UI · Lucide React
- **Banco:** PostgreSQL (Supabase em produção, Docker local) · Prisma 7
- **Validação:** Zod 4
- **Auth:** Better Auth (e-mail/senha, sessões, rate limit, proxy de rotas)
- **Testes:** Jest + React Testing Library (unitários) · Jest + banco real (integração) · Playwright (E2E e acessibilidade)
- **Qualidade:** ESLint · typecheck (`next typegen` + `tsc --noEmit`)
- **Deploy:** Vercel (`main` → produção, demais branches → preview) · GitHub Actions (CI)
- **Node.js:** ≥ 20.19

## Pré-requisitos

- Node.js ≥ 20.19
- npm
- Docker (PostgreSQL local via `docker compose`)

## Como rodar

```bash
npm install
cp .env.example .env.local   # preencher DATABASE_URL, BETTER_AUTH_SECRET etc.
npm run db:up                # sobe o PostgreSQL local (Docker)
npm run db:migrate           # aplica as migrations
npx tsx prisma/seed.ts       # cria a conta administradora (SEED_ADMIN_*)
npm run dev
```

Abrir <http://localhost:3000> — em dev, a porta pode cair para 3001 se a 3000
estiver ocupada.

## Scripts

| Script                                      | O que faz                                        |
| ------------------------------------------- | ------------------------------------------------ |
| `npm run dev`                               | Servidor de desenvolvimento                     |
| `npm run build`                             | Build de produção                               |
| `npm run start`                             | Executa o build de produção                     |
| `npm run lint` / `lint:fix`                 | ESLint (verificar / corrigir)                   |
| `npm run typecheck`                         | `next typegen` + verificação de tipos           |
| `npm test` / `test:watch` / `test:coverage` | Testes unitários (Jest, 37 testes)              |
| `npm run test:integration`                  | Integração Prisma + PostgreSQL real (`admin_test`) |
| `npm run test:e2e`                          | E2E Playwright (auth, navegação, CRUD, isolamento, acessibilidade) |
| `npm run test:e2e:ui`                       | E2E com interface interativa do Playwright      |
| `npm run test:e2e:report`                   | Abre o relatório HTML do Playwright             |
| `npm run db:up` / `db:down`                 | Sobe/derruba o PostgreSQL local (Docker)        |
| `npm run db:migrate` / `db:deploy`          | Migrations (dev / produção)                     |
| `npx tsx prisma/seed.ts`                    | Seed da conta administradora                    |
| `npm run vercel-build`                      | Build da Vercel (`prisma migrate deploy` + `next build`) |

> O E2E sobe o próprio servidor na porta 3100, cria o banco `admin_test` e
> roda build + migrate + seed automaticamente (`prepare-database.ts` +
> `global-setup.ts`). Não é preciso subir nada manualmente.

## Variáveis de ambiente

Ver `.env.example` e o guia completo de produção em
[`VERCEL-ENV.md`](VERCEL-ENV.md) (Supabase pooler Transaction/Session,
segredos por ambiente, proteção de previews).

## Documentação

- [Mapa de implementação](docs/README.md): ordem das fases, status e guias passo a passo
- [Arquitetura](docs/architecture/ARCHITECTURE.md): decisões técnicas e padrões
- [Guia de arquitetura e setup](docs/Personal-Platform-Guia-Arquitetura-Setup.md)
- [Alterações de 2026-11-15](docs/setup/06-setup-deploy/registros/2026-11-15-identidade-visual-e-vercel.md): identidade visual e deploy Vercel

## Estrutura

```text
src/
├── app/          # rotas (App Router), ícones e metadata
├── components/   # componentes visuais (ui, layout, shared)
├── modules/      # domínios (auth, dashboard, projects, ...)
├── lib/          # infraestrutura (auth, db, env, utils)
└── styles/       # tokens, temas claro/escuro e estilos base
tests/
├── unit/         # testes Jest unitários
├── integration/  # testes Jest com banco real (admin_test)
└── e2e/          # specs Playwright + setup/sessões
```

[![CI](https://github.com/elizfab/admin/actions/workflows/ci.yml/badge.svg)](https://github.com/elizfab/admin/actions/workflows/ci.yml)
