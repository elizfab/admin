# Passo 01 — PostgreSQL local com Docker Compose

> **Fase:** 02 — Banco e Prisma\
> **Tempo estimado:** 20 min\
> **Depende de:** [Fase 01 concluída](../01-setup-frontend/README.md)

## Objetivo

Ter um PostgreSQL 16 rodando na sua máquina em `localhost:5432`, criado e
destruído com um comando.

## 💡 Por que

### Por que Docker

O Docker é uma **caixa lacrada** que já vem com o PostgreSQL instalado e
configurado. Você não instala nada no sistema operacional: liga a caixa,
usa, desliga. Se algo der errado, joga a caixa fora e pega outra igual.
Todo mundo que clonar o projeto terá **exatamente** o mesmo banco.

### Por que Docker *Compose*

O `docker-compose.yml` é a **receita** da caixa, versionada no Git: imagem,
usuário, senha, porta e onde guardar os dados. Em vez de decorar um
`docker run` cheio de opções, basta `docker compose up -d`.

### O que é um volume

Sem volume, os dados morrem quando o container é removido. O volume
`admin-postgres-data` é uma **gaveta fora da caixa**: o container pode ser
recriado sem perder as tabelas.

## Pré-requisitos

- Docker instalado com o plugin Compose:

```bash
docker --version
docker compose version
```

> Se não tiver: siga <https://docs.docker.com/engine/install/> e depois
> <https://docs.docker.com/engine/install/linux-postinstall/> para usar o
> Docker sem `sudo`.

- A porta 5432 livre. Se já existir um PostgreSQL instalado e rodando no
  sistema, pare-o (`sudo systemctl stop postgresql`) ou troque a porta do
  compose para `"5433:5432"` e ajuste as URLs dos próximos passos.

## Passo a passo

### 1. Criar o `docker-compose.yml` na raiz

`docker-compose.yml`:

```text
# PostgreSQL local para desenvolvimento e testes.
# Subir: docker compose up -d   |   Parar: docker compose down
services:
  postgres:
    image: postgres:16-alpine
    container_name: admin-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres # somente local; nunca use em produção
      POSTGRES_DB: admin_dev
    ports:
      - "5432:5432"
    volumes:
      - admin-postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d admin_dev"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  admin-postgres-data:
```

| Trecho | Explicação |
|---|---|
| `postgres:16-alpine` | PostgreSQL 16 sobre Alpine Linux (imagem pequena). Use a mesma versão *major* do Supabase |
| `POSTGRES_PASSWORD: postgres` | Senha **somente local**. O banco só aceita conexões da sua máquina |
| `ports: "5432:5432"` | `porta-na-sua-máquina:porta-no-container` |
| `healthcheck` | O Docker testa a cada 5s se o banco aceita conexões |

⚠️ Esta senha simples só é aceitável porque o banco é local e descartável.
Ela **nunca** deve ser usada no Supabase ou em produção.

### 2. Adicionar os scripts no `package.json`

```json
"db:up": "docker compose up -d",
"db:down": "docker compose down",
```

### 3. Subir o banco

```bash
npm run db:up
```

O `-d` (*detached*) roda em segundo plano e devolve o terminal.

### 4. Conferir

```bash
docker compose ps
```

A coluna `STATUS` deve mostrar `healthy` (pode levar alguns segundos).

## Comandos do dia a dia

| Comando | O que faz |
|---|---|
| `npm run db:up` | Sobe o banco |
| `npm run db:down` | Para e remove o container (**os dados ficam no volume**) |
| `docker compose logs -f postgres` | Mostra os logs do banco (`Ctrl+C` para sair) |
| `docker compose exec postgres psql -U postgres -d admin_dev` | Abre o terminal SQL dentro do container (`\q` para sair) |
| `docker compose down -v` | ⚠️ Remove container **e volume**: apaga todos os dados locais |

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `docker-compose.yml` | Criado | Receita do PostgreSQL local |
| `package.json` | Alterado | Scripts `db:up` e `db:down` |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `docker compose ps` | Serviço `postgres` com status `healthy` |
| 2 | `docker compose exec postgres psql -U postgres -d admin_dev -c "select version();"` | Uma linha com `PostgreSQL 16...` |
| 3 | `npm run db:down` e depois `npm run db:up` | O banco volta a ficar `healthy` |

**Critério de aceite:** os três testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `permission denied while trying to connect to the Docker daemon socket` | Usuário fora do grupo `docker` | Seguir o pós-instalação do Docker e fazer logout/login |
| `Bind for 0.0.0.0:5432 failed: port is already allocated` | Outro PostgreSQL usando a porta | Parar o outro serviço ou mapear `"5433:5432"` |
| Status `unhealthy` | O banco não inicializou | `docker compose logs postgres` para ver o erro |
| `docker-compose: command not found` | Sintaxe antiga (v1) | Usar `docker compose` (com espaço, v2) |

## Commit sugerido

```bash
git add docker-compose.yml package.json
git commit -m "chore(db): adiciona PostgreSQL local com Docker Compose"
```

## Referências

- [Docker — Compose](https://docs.docker.com/compose/)
- [Imagem oficial do PostgreSQL](https://hub.docker.com/_/postgres)
- ARCHITECTURE.md, seções 2 (Banco local opcional) e 12.3

---

[Índice da fase](README.md) · [Próximo passo](02-projeto-supabase.md) →
