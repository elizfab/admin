# Fase 02 — Banco de Dados e Prisma

> **Status:** 📋 Planejada — o passo a passo será escrito quando a fase começar.\
> **Depende de:** [Fase 01 — Frontend](../01-setup-frontend/README.md) concluída\
> **Arquitetura:** ARCHITECTURE.md, seções 12, 13 e 14

## Objetivo da fase

A aplicação consegue **consultar o banco de desenvolvimento pelo servidor**,
com schema versionado em migrations e um usuário administrador criado por
seed controlado.

## 💡 Por que esta fase vem antes da autenticação

O login precisa de uma tabela de usuários para consultar. Primeiro se
constrói o “arquivo de fichas” (banco), depois a “portaria” (autenticação),
que confere as fichas.

## Antes de começar (decisões e informações necessárias)

- [ ] Confirmar o Supabase Free como banco de desenvolvimento (ADR-008)
- [ ] Região do projeto Supabase
- [ ] Entidades da primeira versão (mínimo: `User`; candidatas na seção 13.1)
- [ ] Padrão de datas e fuso horário (ex.: armazenar em UTC, exibir em `America/Sao_Paulo`)
- [ ] Usar ou não PostgreSQL local com Docker Compose

## Passos previstos

| # | Passo | Status |
|---|---|---|
| 01 | Criar o projeto no Supabase e obter as strings de conexão | 📋 |
| 02 | Modelar as entidades iniciais e o ERD no Draw.io | 📋 |
| 03 | Instalar o Prisma 7 e o driver adapter `pg` | 📋 |
| 04 | `prisma.config.ts`, `schema.prisma` e variáveis `.env.local` / `.env.example` | 📋 |
| 05 | Primeira migration e `prisma generate` | 📋 |
| 06 | Cliente Prisma reutilizável (`src/lib/db/prisma.ts`) | 📋 |
| 07 | Seed idempotente do usuário administrador | 📋 |
| 08 | Health check sem dados sensíveis (`/api/v1/health`) | 📋 |
| 09 | (Opcional) PostgreSQL local com Docker Compose | 📋 |

## Pontos de atenção já conhecidos

- Prisma 7: Node.js ≥ 20.19; `migrate dev` **não** roda `generate` nem `seed`
  automaticamente; o `.env` não é carregado sozinho (usar `dotenv`).
- Supabase: pooler *transaction* (porta 6543) para a aplicação e conexão
  direta ou *session* para migrations. A conexão direta pode exigir IPv6.
- Nunca versionar `.env.local` nem colar strings de conexão em prints ou issues.

## ✅ Critério de conclusão da fase

Uma rota de servidor consulta o banco com sucesso, `npx prisma migrate status`
não mostra pendências e o seed pode ser executado duas vezes sem duplicar dados.

---

← [Fase anterior](../01-setup-frontend/README.md) · [Mapa geral](../../README.md) · [Próxima fase](../03-setup-autenticacao/README.md) →
