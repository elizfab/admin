# Fase 02 — Banco de Dados e Prisma

> **Objetivo da fase:** a aplicação consulta o banco de desenvolvimento **pelo
> servidor**, com o schema versionado em migrations.\
> **Tempo estimado:** 3 a 4 horas\
> **Depende de:** [Fase 01 — Frontend](../01-setup-frontend/README.md) concluída\
> **Arquitetura:** ARCHITECTURE.md, seções 12, 13 e 14\
> **Mapa geral:** [`docs/README.md`](../../README.md)

## Por que esta fase vem antes da autenticação

💡 O login precisa de uma tabela de usuários para consultar. Primeiro se
constrói o **arquivo de fichas** (banco), depois a **portaria**
(autenticação), que confere as fichas.

## Dois bancos, dois papéis

| Banco | Onde roda | Para quê | Passo |
|---|---|---|---|
| **PostgreSQL local** (Docker) | Sua máquina | Desenvolvimento diário e testes; funciona offline e pode ser apagado à vontade | 01 |
| **Supabase** (PostgreSQL gerenciado) | Nuvem | Preview e produção (Fase 06); criado agora para validar a conexão com antecedência | 02 |

💡 É como ter uma **cozinha de testes** em casa e o **restaurante** aberto
ao público. As receitas novas são testadas em casa, e só vão para o
restaurante as que deram certo. Isso cumpre o princípio 9 da arquitetura: o
projeto funciona localmente, sem depender do deploy.

## Ordem dos passos

| # | Passo | O que entrega | Status |
|---|---|---|---|
| 01 | [PostgreSQL local com Docker Compose](01-postgres-local-docker.md) | Banco rodando em `localhost:5432` | ⬜ |
| 02 | [Projeto no Supabase](02-projeto-supabase.md) | Projeto criado, Data API desativada, strings de conexão guardadas | ⬜ |
| 03 | [Modelagem de dados e ERD](03-modelagem-e-erd.md) | Entidades, regras e diagrama ER | ⬜ |
| 04 | [Instalar o Prisma 7](04-instalar-prisma.md) | Pacotes na versão 7 (fixada) | ⬜ |
| 05 | [Configurar o Prisma](05-configurar-prisma.md) | `prisma7.config.ts`, `schema.prisma`, variáveis e scripts | ⬜ |
| 06 | [Primeira migration](06-primeira-migration.md) | Tabela `user` criada; Prisma Client gerado | ⬜ |
| 07 | [Cliente Prisma reutilizável](07-cliente-prisma.md) | `src/lib/db/prisma.ts` | ⬜ |
| 08 | [Health check com banco](08-health-check.md) | `/api/v1/health` responde 200 ou 503 | ⬜ |

> **Mudança em relação ao plano original:** o seed da conta administradora
> passou para a Fase 03, porque a senha precisa ser criptografada com o
> mesmo algoritmo do Better Auth (decisão registrada no ADR-006).

## Checklist da fase

- [ ] PostgreSQL local rodando via Docker Compose
- [ ] Projeto Supabase criado, **com a Data API desativada**
- [ ] Strings de conexão do Supabase guardadas em local seguro (fora do Git)
- [ ] ERD da primeira versão desenhado
- [ ] Prisma 7 instalado (sem a versão 8 RC)
- [ ] `prisma7.config.ts` e `schema.prisma` configurados
- [ ] `.env.local` com `DATABASE_URL` e `DIRECT_URL`; `.env.example` atualizado
- [ ] Migration `init` criada e aplicada
- [ ] Client gerado em `src/generated/prisma` (ignorado pelo Git)
- [ ] `src/lib/db/prisma.ts` criado
- [ ] `/api/v1/health` respondendo `200` com o banco no ar e `503` sem ele

## ✅ Critério de conclusão da fase

```bash
npm run db:status   # "Database schema is up to date!"
npm run typecheck && npm run lint && npm test && npm run build
curl http://localhost:3000/api/v1/health   # {"status":"ok","database":"up",...}
```

## Versões validadas (11/11/2026)

| Ferramenta | Versão |
|---|---|
| PostgreSQL | 16 |
| prisma / @prisma/client / @prisma/adapter-pg | 7.10.1 |
| pg | 8.x |
| dotenv | 18.x |
| tsx | 4.x |

---

← Fase anterior: [01 — Frontend](../01-setup-frontend/README.md) · [Mapa geral](../../README.md) · Próxima fase: [03 — Autenticação](../03-setup-autenticacao/README.md) →
