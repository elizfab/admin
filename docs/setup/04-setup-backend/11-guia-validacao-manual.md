# Guia prático — Validação manual do Passo 10 (duas usuárias)

> **Complemento do** [Passo 10 — Validação final](10-validacao-final.md).
> Este guia reúne **todos os comandos, em ordem**, para você subir o banco,
> criar as duas contas, validar o isolamento no navegador e rodar a bateria
> de segurança — sem precisar caçar cada passo nas fases anteriores.

## 🗺️ Visão geral

| # | Etapa | O que acontece |
|---|-------|----------------|
| 1 | Subir o banco | `docker compose up -d` liga o PostgreSQL local |
| 2 | Migrar + seed | Cria as tabelas e a **primeira** administradora |
| 3 | Segunda pessoa | Cria a conta `teste@example.com` (seed ou SQL) |
| 4 | Subir o app | `npm run dev` (navegador) ou `build && start` (curl) |
| 5 | Validar no navegador | Dona cria projeto; "outra" não vê nada |
| 6 | Isolamento via API | Roteiro `curl` com dois cookies de sessão |
| 7 | Bateria de segurança | `scripts/security-check.sh` |
| 8 | Limpeza | Remove cookies temporários |

---

## 1️⃣ Variáveis de ambiente (`.env.local`)

O arquivo `.env.local` na raiz precisa ter **todas** estas variáveis. Se
alguma estiver vazia, os passos abaixo falham.

```bash
# Banco de dados (Fase 02) — conexão local via Docker
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/admin_dev"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/admin_dev"

# Autenticação (Fase 03)
BETTER_AUTH_SECRET="<gere com: openssl rand -base64 32>"
BETTER_AUTH_URL="http://localhost:3000"

# Seed da PRIMEIRA administradora (só local!)
SEED_ADMIN_NAME="Administradora"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="<senha com no mínimo 12 caracteres>"
```

> 💡 O `SEED_ADMIN_PASSWORD` **precisa ter ≥ 12 caracteres** — o `seed.ts`
> valida isso e aborta se for mais curto.

Para conferir o que está configurado (sem expor valores secretos):

```bash
grep -E '^(DATABASE_URL|DIRECT_URL|BETTER_AUTH_URL|SEED_ADMIN_)' .env.local
```

---

## 2️⃣ Subir o banco (PostgreSQL no Docker)

O `docker-compose.yml` da raiz sobe um PostgreSQL 16 com os dados
persistidos num volume (sobrevive a `docker compose down`).

```bash
# Ligar (em background)
docker compose up -d

# Conferir que está saudável
docker compose ps
# Esperado: STATUS = "Up ... (healthy)" na porta 5432
```

> Se der erro de porta ocupada: `sudo systemctl stop postgresql` (se houver
> um Postgres instalado no sistema) ou ajuste a porta no compose.

---

## 3️⃣ Migrar o schema e criar a primeira administradora

```bash
# Aplica as migrations pendentes (cria as tabelas user, account, project...)
npx prisma migrate deploy

# Roda o seed: cria a conta do SEED_ADMIN_* do .env.local
npx prisma db seed
```

**Esperado:**

```text
Administradora criada: admin@example.com
```

> Se rodar de novo, o seed é idempotente e imprime
> `Administradora já existe (...). Nada foi alterado.` — sem erro.

---

## 4️⃣ Criar a SEGUNDA pessoa (a "cliente oculta")

O objetivo do Passo 10 é provar que uma usuária **não vê** os dados da
outra. Para isso precisamos de duas contas. Escolha **uma** das opções:

### Opção A — Seed com variáveis do terminal (recomendada)

O seed lê `SEED_ADMIN_*` do ambiente, e variáveis do terminal têm
prioridade sobre o `.env.local`:

```bash
SEED_ADMIN_NAME="Teste" \
SEED_ADMIN_EMAIL="teste@example.com" \
SEED_ADMIN_PASSWORD="teste-senha-forte-123" \
npx prisma db seed
```

**Esperado:** `Administradora criada: teste@example.com`

✅ Vantagem: a senha é hasheada pelo mesmo algoritmo do Better Auth
(`scrypt`) automaticamente. **É a forma segura — use esta.**

### Opção B — Direto no banco (psql / Prisma Studio)

⚠️ **Atenção:** a senha **não** pode ser texto puro — o Better Auth guarda
um hash scrypt em `account.password`. Inserir SQL na mão exige gerar esse
hash antes. O caminho manual completo:

**B.1 — Gerar o hash da senha** (rode uma vez, anote o resultado):

```bash
node --input-type=module -e "import('better-auth/crypto').then(m => m.hashPassword('teste-senha-forte-123').then(console.log))"
```

**B.2 — Inserir usuário e credencial** (troque `SEU_HASH` pelo valor
impresso acima):

```bash
# Abre o psql dentro do container
docker compose exec postgres psql -U postgres -d admin_dev
```

Dentro do `psql`:

```sql
-- 1) Usuário
INSERT INTO "user" (id, name, email, "emailVerified", role, "isActive", "createdAt", "updatedAt")
VALUES ('user-teste-001', 'Teste', 'teste@example.com', true, 'USER', true, now(), now());

-- 2) Credencial (senha hasheada)
INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
VALUES ('acc-teste-001', 'user-teste-001', 'credential', 'user-teste-001', 'SEU_HASH', now(), now());
```

**B.3 — Ou pelo Prisma Studio** (interface visual, sem SQL):

```bash
npx prisma studio
# Abre http://localhost:5555 → tabela "user" → Add record
# Depois na tabela "account" → Add record com:
#   providerId = "credential", accountId = id do user,
#   userId = id do user, password = hash do passo B.1
```

> 💡 Prefira a **Opção A**: menos passos, zero chance de esquecer o hash.

---

## 5️⃣ Subir a aplicação

Escolha conforme o que vai validar:

```bash
# Para validar NO NAVEGADOR (login, telas de projetos)
npm run dev
# → http://localhost:3000

# Para o roteiro curl do Passo 10 (precisa do build de produção)
npm run build && npm run start
# → http://localhost:3000
```

---

## 6️⃣ Validação no navegador (a parte visual)

Com o app rodando, faça **duas sessões**:

| Sessão | Como | Conta |
|--------|------|-------|
| Aba normal | `http://localhost:3000/login` | `admin@example.com` (dona) |
| Aba anônima | `Ctrl+Shift+N` → mesmo `/login` | `teste@example.com` |

**Roteiro:**

1. **Na aba da dona:** crie um projeto em `/projects/new` (ex.:
   "Projeto da dona"). Anote o nome.
2. **Na aba anônima:** abra `/projects` → a lista deve estar **vazia** (ou
   mostrar só projetos dela).
3. **Na aba anônima:** tente acessar a URL de edição do projeto da dona:
   `http://localhost:3000/projects/<id-do-projeto>/edit` → deve aparecer
   **"Página não encontrada"** (o isolamento devolve 404, como se o
   projeto não existisse).
4. **De volta à aba da dona:** o projeto continua intacto, com o nome
   original.

---

## 7️⃣ Roteiro de isolamento via API (curl)

Terminal (com `npm run build && npm run start` rodando — ajuste
`SEU-EMAIL`/`SUA-SENHA` para os seus valores do `.env.local`):

```bash
B=http://localhost:3000
H=(-H "Origin: $B" -H "Content-Type: application/json")

# Login das duas contas → salva o cookie de sessão de cada uma
curl -s -c /tmp/dona.txt -o /dev/null "${H[@]}" \
  -d '{"email":"SEU-EMAIL","password":"SUA-SENHA"}' $B/api/auth/sign-in/email

curl -s -c /tmp/outra.txt -o /dev/null "${H[@]}" \
  -d '{"email":"teste@example.com","password":"teste-senha-forte-123"}' $B/api/auth/sign-in/email

# A dona cria um projeto → guarde o "id" impresso na resposta
curl -s -b /tmp/dona.txt "${H[@]}" -d '{"name":"Projeto da dona"}' $B/api/v1/projects
ID="cole-aqui-o-id"

# Tabela do Passo 10, item 3 — "outra" tentando mexer no projeto alheio:
curl -s -w " %{http_code}\n" -b /tmp/outra.txt $B/api/v1/projects/$ID        # espera 404
curl -s -w " %{http_code}\n" -b /tmp/outra.txt -X PATCH "${H[@]}" \
  -d '{"name":"invadido"}' $B/api/v1/projects/$ID                            # espera 404
curl -s -w " %{http_code}\n" -b /tmp/outra.txt -X DELETE -H "Origin: $B" \
  $B/api/v1/projects/$ID                                                      # espera 404
curl -s -b /tmp/outra.txt $B/api/v1/projects                                  # espera {"data":[]}
curl -s -b /tmp/dona.txt $B/api/v1/projects/$ID                               # espera 200 intacto
curl -s -b /tmp/dona.txt "${H[@]}" \
  -d '{"name":"Tentativa","ownerId":"outra-pessoa"}' $B/api/v1/projects      # 201, ownerId ignorado
```

---

## 8️⃣ Bateria de segurança automatizada

```bash
# Se acabou de testar logins, aguarde ~1 min (rate limit do Better Auth)
ADMIN_EMAIL="SEU-EMAIL" ADMIN_PASSWORD="SUA-SENHA" bash scripts/security-check.sh
```

**Esperado:** `Resultado: 16 ok, 0 falha(s).`

---

## 9️⃣ Limpeza

```bash
rm -f /tmp/dona.txt /tmp/outra.txt
```

A conta `teste@example.com` pode ficar — ela será reaproveitada na Fase 05
(E2E). Para removê-la depois: `npx prisma studio` → apague os projetos dela
**antes** (a relação `owner → projects` é `Restrict`) e então o usuário.

---

## 🧯 Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Can't reach database server` | Docker parado | `docker compose up -d` |
| `Variável de ambiente ausente: SEED_ADMIN_*` | `.env.local` incompleto | Preencher o bloco do item 1 |
| `SEED_ADMIN_PASSWORD precisa ter pelo menos 12 caracteres` | Senha curta | Usar senha mais longa |
| Login na tela não funciona | `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL` vazios | Gerar secret: `openssl rand -base64 32` |
| `Too many requests` no curl | Rate limit do login | Esperar ~60 s entre tentativas |
| `404` em tudo na API | Sessão expirada | Refazer o login (passo 7) e pegar o cookie de novo |
| Projeto da "outra" aparece | Bug real de isolamento! | Parar e revisar `findByIdForOwner`/serviço |

## ✅ Checklist final

- [ ] `docker compose ps` → healthy
- [ ] `npx prisma migrate deploy` + `npx prisma db seed` → administradora criada
- [ ] Segunda conta criada (`teste@example.com`)
- [ ] Navegador: dona cria projeto; outra não vê / recebe "não encontrada"
- [ ] Curl: roteiro de isolamento com 404s e lista vazia
- [ ] `security-check.sh` → 16 ok
- [ ] Cookies temporários removidos

> Com tudo marcado, o **Passo 10 está concluído** e a Fase 04 fechada —
> marque o checklist do [10-validacao-final.md](10-validacao-final.md) e
> siga para a Fase 05 (Testes E2E).
