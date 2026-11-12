# Passo 09 — Backup, restauração e keep-alive

> **Fase:** 06 — Deploy\
> **Tempo estimado:** 60 min\
> **Depende de:** [Passo 08](08-primeiro-deploy.md)

## Objetivo

Ter uma **cópia de segurança** dos dados de produção, provar que ela
**restaura**, e impedir que o Supabase Free pause o projeto por inatividade.

## 💡 Por que

### O plano Free não faz backup por você

O Supabase só oferece backups diários nos planos pagos. No Free, se você
apagar algo por engano, não há como voltar. **O backup é responsabilidade
sua.**

### “Backup que nunca foi restaurado não é backup”

Muitas equipes descobrem, no pior dia, que o arquivo de backup estava
corrompido ou incompleto. Por isso este passo tem **dois** scripts: um que
faz o backup e outro que o **restaura num banco descartável** e mostra o
conteúdo. 💡 O extintor só vale se você já testou que ele funciona.

### O backup contém dados sensíveis

O arquivo tem os **hashes de senha** (`account`) e os **tokens de sessão**
(`session`). Por isso ele:

- é gravado com permissão `600` (só o seu usuário lê), numa pasta `700`;
- fica em `backups/`, ignorado pelo Git;
- deve ser **criptografado** com GPG antes de sair da sua máquina (nuvem, pen drive).

### Keep-alive

Um projeto Free sem atividade no banco por cerca de 7 dias é **pausado**. O
workflow `keepalive.yml` chama o `/api/v1/health` (que faz um `SELECT 1` no
banco) **uma vez por dia**. 💡 É como dar partida no carro de vez em
quando, para a bateria não arriar.

## Pré-requisitos

- Passo 08 concluído; Docker instalado (Fase 02); `gpg` instalado (`gpg --version`).

## Passo a passo

### 1. Script de backup

`scripts/db-backup.sh`:

```text
#!/usr/bin/env bash
# Backup do banco (schema public) em formato custom do pg_dump.
#
# Uso:
#   BACKUP_DATABASE_URL="postgresql://..." bash scripts/db-backup.sh
#
# - Para o Supabase, use a string do SESSION POOLER (IPv4, porta 5432).
# - O pg_dump roda via Docker, na mesma versão major do servidor
#   (ajuste PG_IMAGE se o Supabase usar outra versão).
# - O arquivo contém hashes de senha e sessões: guarde-o criptografado e fora do Git.

set -euo pipefail

URL="${BACKUP_DATABASE_URL:?Defina BACKUP_DATABASE_URL}"
PG_IMAGE="${PG_IMAGE:-postgres:17-alpine}"
PG_DUMP="${PG_DUMP:-docker run --rm -i --network host $PG_IMAGE pg_dump}"
OUT_DIR="${BACKUP_DIR:-backups}"
FILE="$OUT_DIR/admin-$(date +%Y-%m-%d_%H%M%S).dump"

mkdir -p "$OUT_DIR"
chmod 700 "$OUT_DIR"

echo "Gerando backup em $FILE ..."
# --schema=public: só os dados da aplicação (sem schemas internos do Supabase)
# --no-owner/--no-privileges: restaura em qualquer servidor, com qualquer usuário
$PG_DUMP --format=custom --schema=public --no-owner --no-privileges "$URL" > "$FILE"
chmod 600 "$FILE"

echo "Backup concluído: $FILE ($(du -h "$FILE" | cut -f1))"
echo "Próximo passo: criptografe com  gpg --symmetric --cipher-algo AES256 \"$FILE\"  e apague o arquivo aberto."
```

| Opção | 💡 Por quê |
|---|---|
| `postgres:17-alpine` via Docker | O `pg_dump` precisa ser da **mesma versão do servidor ou mais nova**. Use a versão anotada no passo 06 (`PG_IMAGE=postgres:<versão>-alpine`) |
| `--format=custom` | Arquivo compactado, que permite restaurar tabelas específicas |
| `--schema=public` | Só os dados da aplicação, sem os schemas internos do Supabase, que não existem num PostgreSQL comum |
| `--no-owner --no-privileges` | O backup restaura em qualquer servidor, com qualquer usuário |

### 2. Script de teste de restauração

`scripts/db-restore-check.sh`:

```text
#!/usr/bin/env bash
# Teste de restauração: restaura um backup num banco LOCAL descartável
# (admin_restore_test) e mostra a contagem de registros por tabela.
# "Backup que nunca foi restaurado não é backup."
#
# Uso:
#   bash scripts/db-restore-check.sh backups/admin-AAAA-MM-DD_HHMMSS.dump

set -euo pipefail

FILE="${1:?Informe o arquivo .dump}"
TARGET_URL="${RESTORE_TARGET_URL:-postgresql://postgres:postgres@localhost:5432/admin_restore_test}"
DB_NAME="$(basename "${TARGET_URL%%\?*}")"
ADMIN_URL="${TARGET_URL%/*}/postgres"

case "$DB_NAME" in
  *_restore_test) ;;
  *) echo "Recusado: o banco de destino precisa terminar em _restore_test (recebido: $DB_NAME)"; exit 1 ;;
esac

PG_IMAGE="${PG_IMAGE:-postgres:17-alpine}"
DOCKER="docker run --rm -i --network host $PG_IMAGE"
PSQL="${PSQL:-$DOCKER psql}"
PG_RESTORE="${PG_RESTORE:-$DOCKER pg_restore}"

echo "Recriando o banco $DB_NAME ..."
$PSQL "$ADMIN_URL" -v ON_ERROR_STOP=1 -q -c "DROP DATABASE IF EXISTS \"$DB_NAME\";" -c "CREATE DATABASE \"$DB_NAME\";"

echo "Restaurando $FILE ..."
# --clean --if-exists: o dump recria o schema public, que já existe em todo banco novo.
$PG_RESTORE --clean --if-exists --no-owner --no-privileges --exit-on-error -d "$TARGET_URL" < "$FILE"

echo "Registros por tabela:"
$PSQL "$TARGET_URL" -c "SELECT 'user' AS tabela, count(*) FROM \"user\"
  UNION ALL SELECT 'account', count(*) FROM account
  UNION ALL SELECT 'project', count(*) FROM project
  UNION ALL SELECT '_prisma_migrations', count(*) FROM _prisma_migrations;"
```

💡 A **trava** `_restore_test` impede restaurar por cima de um banco de
verdade. O `--clean --if-exists` existe porque o backup recria o schema
`public`, que já existe em qualquer banco novo. Sem ele, a restauração falha
com `schema "public" already exists` (encontrado na validação).

### 3. Ignorar a pasta de backups

No `.gitignore`:

```gitignore
# backups do banco (dados sensíveis)
/backups/
```

### 4. Fazer o primeiro backup de produção

```bash
chmod +x scripts/db-backup.sh scripts/db-restore-check.sh
npm run db:up   # o teste de restauração usa o PostgreSQL local

BACKUP_DATABASE_URL="COLE-A-PROD-DIRECT_URL" PG_IMAGE=postgres:17-alpine bash scripts/db-backup.sh
```

### 5. Testar a restauração

```bash
bash scripts/db-restore-check.sh backups/admin-AAAA-MM-DD_HHMMSS.dump
```

Esperado: a tabela de contagem, com `user` ≥ 1, `account` ≥ 1, os seus
projetos e as migrations aplicadas.

### 6. Criptografar e guardar

```bash
gpg --symmetric --cipher-algo AES256 backups/admin-AAAA-MM-DD_HHMMSS.dump
# digite uma frase-senha forte (guarde-a no gerenciador de senhas)
rm backups/admin-AAAA-MM-DD_HHMMSS.dump   # apaga a versão aberta
```

O arquivo `.dump.gpg` pode ir para um armazenamento externo (ex.: seu
Google Drive). Para abrir de novo:

```bash
gpg --output backups/restaurado.dump --decrypt backups/admin-AAAA-MM-DD_HHMMSS.dump.gpg
```

### 7. Keep-alive

`.github/workflows/keepalive.yml`:

```text
# Mantém o banco Supabase (plano Free) ativo: projetos sem atividade por
# 7 dias são pausados. O health check faz uma consulta real ao banco.
name: Keep-alive

on:
  schedule:
    - cron: "17 11 * * *" # todos os dias às 11:17 UTC (08:17 em São Paulo)
  workflow_dispatch: # permite rodar manualmente pela aba Actions

permissions: {}

jobs:
  ping:
    name: Consultar o health check de produção
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Chamar /api/v1/health
        env:
          PRODUCTION_URL: ${{ vars.PRODUCTION_URL }}
        run: |
          if [ -z "$PRODUCTION_URL" ]; then
            echo "Defina a variável PRODUCTION_URL em Settings → Secrets and variables → Actions → Variables."
            exit 1
          fi
          curl --fail --silent --show-error --max-time 30 "$PRODUCTION_URL/api/v1/health"
```

1. Commit e push do arquivo.
2. No GitHub: **Settings → Secrets and variables → Actions → aba
   Variables → New repository variable**:
   - **Name:** `PRODUCTION_URL`
   - **Value:** `https://personal-platform-admin.vercel.app` (sem barra no final)
3. **Actions → Keep-alive → Run workflow** para testar na hora.

💡 É uma **variable** (não um *secret*) porque a URL de produção não é
segredo. O workflow não precisa de nenhuma permissão (`permissions: {}`).

### 8. Rotina recomendada

| Quando | O quê |
|---|---|
| **Mensalmente** (lembrete no calendário) | Backup → teste de restauração → criptografar → guardar |
| **Antes de toda migration destrutiva** (`DROP`, renomear coluna) | Backup extra |
| **A cada 3 meses** | Abrir um backup antigo e restaurar, para provar que ainda funciona |

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `scripts/db-backup.sh` | Criado | Backup do schema `public` |
| `scripts/db-restore-check.sh` | Criado | Restauração de teste com trava |
| `.github/workflows/keepalive.yml` | Criado | Ping diário |
| `.gitignore` | Alterado | Ignora `/backups/` |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Backup de produção | `Backup concluído: backups/admin-….dump` |
| 2 | `ls -l backups/` | Arquivo com permissão `-rw-------` |
| 3 | Restauração | Contagens coerentes com a produção |
| 4 | **Prova da trava:** `RESTORE_TARGET_URL=postgresql://postgres:postgres@localhost:5432/admin_dev bash scripts/db-restore-check.sh backups/<arquivo>` | `Recusado: o banco de destino precisa terminar em _restore_test` |
| 5 | GPG ida e volta (`--symmetric` e depois `--decrypt`) | Arquivo restaurado idêntico |
| 6 | Actions → Keep-alive → Run workflow | ✅ e `{"status":"ok","database":"up",...}` no log |
| 7 | `git status` | `backups/` não aparece |

**Critério de aceite:** os sete testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `server version mismatch` | `pg_dump` mais antigo que o servidor | `PG_IMAGE=postgres:<versão-do-supabase>-alpine` |
| `Network is unreachable` no backup | Usou a conexão direta (IPv6) | Use o **Session pooler** |
| Keep-alive falha com `Defina a variável PRODUCTION_URL` | Variável não criada, ou criada como *secret* | Criar em **Variables** (não em Secrets) |

## Referências

- [PostgreSQL — pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [PostgreSQL — pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html)
- [Supabase — Project pausing](https://supabase.com/docs/guides/platform/project-pausing)
- [GitHub Actions — Variables](https://docs.github.com/pt/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables)
- [GnuPG — Encrypting with a passphrase](https://www.gnupg.org/gph/en/manual/r656.html)
- ARCHITECTURE.md, seção 12.4

---

← [Passo anterior](08-primeiro-deploy.md) · [Índice da fase](README.md) · [Próximo passo](10-operacao-e-go-live.md) →
