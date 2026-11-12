# Passo 06 — Bancos Supabase de produção e preview

> **Fase:** 06 — Deploy\
> **Tempo estimado:** 30 min\
> **Depende de:** [Passo 05](05-ci-github-actions.md)

## Objetivo

Ter **dois** bancos na nuvem, um para **produção** e outro para os
**previews**, ambos com a Data API desligada e com as strings de conexão
certas para a Vercel.

## 💡 Por que dois bancos

O build de um preview roda `prisma migrate deploy` (passo 03). Se previews e
produção usassem o mesmo banco, uma migration ainda **em teste** num branch
alteraria os dados reais. 💡 Ensaio geral num palco separado: se o cenário
cair, a estreia não é afetada.

| Projeto Supabase | Usado por | Contém |
|---|---|---|
| `personal-platform` (criado na Fase 02) | Produção | Seus dados reais |
| `personal-platform-preview` | Todos os previews | Dados de teste, descartáveis |

O plano Free permite **dois projetos ativos**, exatamente esses dois.

### Qual string de conexão vai em cada variável (na Vercel)

| Variável | Tipo de conexão no painel “Connect” | Porta | 💡 Por quê |
|---|---|---|---|
| `DATABASE_URL` | **Transaction pooler** + `?pgbouncer=true` | 6543 | Muitas funções curtas compartilham poucas conexões |
| `DIRECT_URL` | **Session pooler** | 5432 | Migrations precisam de sessão; a conexão direta é **IPv6**, que a Vercel não suporta |

## Pré-requisitos

- Projeto `personal-platform` criado na Fase 02 (passo 02), **com a Data API desligada**.

## Passo a passo

### 1. Criar o projeto de preview

Repita a Fase 02, passo 02, com:

- **Name:** `personal-platform-preview`
- **Region:** a **mesma** do projeto de produção
- **Data API:** desligada
- Senha **diferente** da de produção (gerada e salva no gerenciador de senhas)

### 2. Copiar as strings de conexão dos dois projetos

Para cada projeto, em **Connect**, copie e salve no gerenciador de senhas:

| Nome no gerenciador | Conteúdo |
|---|---|
| `PROD — DATABASE_URL` | Transaction pooler de `personal-platform` + `?pgbouncer=true` no final |
| `PROD — DIRECT_URL` | Session pooler de `personal-platform` |
| `PREVIEW — DATABASE_URL` | Transaction pooler de `personal-platform-preview` + `?pgbouncer=true` |
| `PREVIEW — DIRECT_URL` | Session pooler de `personal-platform-preview` |

### 3. Conferir a versão do PostgreSQL

No **SQL Editor** de cada projeto:

```sql
select version();
```

Anote a versão *major* (ex.: `17`). Ela será usada nos scripts de backup
(passo 09), que precisam de um `pg_dump` da **mesma** versão ou mais nova.

> O banco local e o CI usam PostgreSQL 16. As migrations deste projeto usam
> SQL padrão e funcionam em ambos. Se quiser alinhar, troque a imagem do
> `docker-compose.yml` e do `ci.yml` para a versão do Supabase **e recrie o
> volume local** (`docker compose down -v`: apaga os dados locais).

### 4. Conferir a Data API

Em **cada** projeto: **Project Settings → Data API** → *Enable Data API*
**desligado**.

## Arquivos criados ou alterados

Nenhum no projeto. Credenciais **somente** no gerenciador de senhas.

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Painel do Supabase | 2 projetos ativos, mesma região |
| 2 | Data API nos dois | Desligada |
| 3 | Gerenciador de senhas | 4 strings + 2 senhas, cada uma identificada |
| 4 | Opcional: `psql "PROD — DIRECT_URL"` → `\dt` | Conecta; ainda **sem tabelas** (a migration roda no primeiro deploy) |

**Critério de aceite:** os testes 1 a 3 passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Não deixa criar o segundo projeto | Já existem 2 projetos ativos na conta | Pause ou apague um projeto antigo que não usa |
| `Tenant or user not found` | Usuário errado no pooler | No pooler o usuário é `postgres.<ref>`, e não `postgres` |

## Referências

- [Supabase — Connecting to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase — IPv4 and IPv6 compatibility](https://supabase.com/docs/guides/troubleshooting/supabase--your-network-ipv4-and-ipv6-compatibility-cHe3BP)
- [Supabase — Hardening the Data API](https://supabase.com/docs/guides/api/hardening-data-api)
- Fase 02, passo 02

---

← [Passo anterior](05-ci-github-actions.md) · [Índice da fase](README.md) · [Próximo passo](07-projeto-vercel.md) →
