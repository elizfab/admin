# Admin — Personal Platform

Portal administrativo pessoal, privado e extensível: ponto central de acesso
aos módulos Estudos, Financeiro, PDI e Projetos.

> **Status:** Fase 01 (frontend) concluída. Banco, autenticação e backend nas
> próximas fases.

## Stack

Next.js (App Router) · TypeScript strict · SCSS Modules · Radix UI · Lucide React · Jest + React Testing Library

Planejado: PostgreSQL + Prisma · Zod · autenticação · Playwright · Vercel

## Pré-requisitos

- Node.js ≥ 20.19
- npm

## Como rodar

```bash
npm install
cp .env.example .env.local   # quando houver variáveis
npm run dev
```

Abrir <http://localhost:3000>.

## Scripts

| Script                                      | O que faz                          |
| ------------------------------------------- | ---------------------------------- |
| `npm run dev`                               | Servidor de desenvolvimento        |
| `npm run build`                             | Build de produção                  |
| `npm run start`                             | Executa o build de produção        |
| `npm run lint` / `lint:fix`                 | ESLint (verificar / corrigir)      |
| `npm run typecheck`                         | Verificação de tipos do TypeScript |
| `npm test` / `test:watch` / `test:coverage` | Testes unitários (Jest)            |

## Documentação

- [Mapa de implementação](docs/README.md): ordem das fases, status e guias passo a passo
- [Arquitetura](docs/architecture/ARCHITECTURE.md): decisões técnicas e padrões

## Estrutura

```text
src/
├── app/          # rotas (App Router)
├── components/   # componentes visuais (ui, layout, shared)
├── modules/      # domínios (dashboard, ...)
├── lib/          # infraestrutura e utilitários
└── styles/       # tokens, tema e estilos base
tests/
└── unit/         # testes Jest
```
