# Passo 10 — Endpoint protegido e testes de segurança

> **Fase:** 03 — Autenticação\
> **Tempo estimado:** 45 min\
> **Depende de:** [Passo 09](09-proxy.md)

## Objetivo

Criar o primeiro endpoint de dados protegido (`GET /api/v1/me`) e
**comprovar** a segurança da fase com uma bateria de 14 testes automatizados
e mais um teste manual de conta desativada.

## 💡 Por que testar a segurança assim

A regra 11 da arquitetura (seção 26) diz: **não afirmar que algo está
protegido sem testar o acesso direto**. O navegador esconde detalhes; o
`curl` age como um atacante faria: sem tela, sem botões, chamando URLs
diretamente, com cookies falsos ou de outra origem.

💡 É o **teste de arrombamento** da fechadura nova: você tenta abrir a
porta de todas as formas erradas e confirma que nenhuma funciona.

### Padrão de proteção de endpoints

Todo Route Handler e toda Server Action de dados seguem o mesmo molde:

```ts
const session = await getSession();
if (!session) {
  return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
}
// autorização: o registro pertence a session.user.id? o papel permite?
```

| Situação | Página | API |
|---|---|---|
| Sem sessão | Redireciona para `/login` | `401 Unauthorized` |
| Com sessão, sem permissão | Redireciona para `/dashboard` | `403 Forbidden` |

## Pré-requisitos

- Passo 09 concluído.

## Passo a passo

### 1. Endpoint `/api/v1/me`

```bash
mkdir -p src/app/api/v1/me
```

`src/app/api/v1/me/route.ts`:

```ts
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();

  // Em APIs não se redireciona: responde 401 (não autenticado).
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const { id, name, email, role } = session.user;

  // Retorna somente o necessário — nunca tokens ou dados da sessão.
  return NextResponse.json({ id, name, email, role });
}
```

💡 A resposta é montada **campo a campo**. Devolver `session` inteiro
exporia o token da sessão, o IP e outros dados que o cliente não precisa.

### 2. Script da bateria de testes

```bash
mkdir -p scripts
```

`scripts/security-check.sh`:

```text
#!/usr/bin/env bash
# Bateria de testes de segurança da autenticação (Fase 03).
# Uso: com `npm run build && npm run start` rodando em outro terminal:
#   ADMIN_EMAIL="..." ADMIN_PASSWORD="..." bash scripts/security-check.sh
# Nunca coloque a senha real neste arquivo.

set -u
BASE="${BASE_URL:-http://localhost:3000}"
EMAIL="${ADMIN_EMAIL:?Defina ADMIN_EMAIL}"
PASSWORD="${ADMIN_PASSWORD:?Defina ADMIN_PASSWORD}"
JAR="$(mktemp)"; OLD_JAR="$(mktemp)"
trap 'rm -f "$JAR" "$OLD_JAR"' EXIT
PASS=0; FAIL=0

check() { # check "<descrição>" "<esperado>" "<obtido>"
  if [[ "$3" == "$2" ]]; then echo "✅ $1 → $3"; PASS=$((PASS + 1));
  else echo "❌ $1 → esperado $2, obtido $3"; FAIL=$((FAIL + 1)); fi
}
status() { curl -s -o /dev/null -w "%{http_code}" "$@"; }
login() { # login <senha> [opções extras do curl]
  local pwd="$1"; shift
  status -H "Origin: $BASE" -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$pwd\"}" "$@" "$BASE/api/auth/sign-in/email"
}

echo "== Sem sessão =="
check "01 /dashboard redireciona" "307" "$(status "$BASE/dashboard")"
check "02 cookie falso é barrado no servidor" "307" "$(status -b 'better-auth.session_token=falso' "$BASE/dashboard")"
check "03 /api/v1/me responde 401" "401" "$(status "$BASE/api/v1/me")"
check "04 cadastro público desabilitado" "400" "$(status -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"name":"x","email":"x@x.com","password":"123456789012"}' "$BASE/api/auth/sign-up/email")"
check "05 login de outra origem (CSRF) é recusado" "403" "$(status -H 'Origin: https://site-malicioso.example' -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" "$BASE/api/auth/sign-in/email")"
check "06 senha errada responde 401" "401" "$(login 'senha-errada-123')"

echo "== Com sessão =="
check "07 login correto" "200" "$(login "$PASSWORD" -c "$JAR")"
check "08 cookie é HttpOnly" "1" "$(grep -c '^#HttpOnly_' "$JAR")"
check "09 /api/v1/me responde 200" "200" "$(status -b "$JAR" "$BASE/api/v1/me")"
check "10 /api/v1/me não expõe token" "0" "$(curl -s -b "$JAR" "$BASE/api/v1/me" | grep -ci 'token')"
check "11 /dashboard abre" "200" "$(status -b "$JAR" "$BASE/dashboard")"

echo "== Logout =="
cp "$JAR" "$OLD_JAR"
check "12 logout" "200" "$(status -b "$JAR" -c "$JAR" -X POST -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{}' "$BASE/api/auth/sign-out")"
check "13 cookie antigo não vale mais" "401" "$(status -b "$OLD_JAR" "$BASE/api/v1/me")"

echo "== Rate limiting (5 tentativas/minuto) =="
LAST=""; for _ in 1 2 3 4 5 6; do LAST="$(login 'senha-errada-123')"; done
check "14 bloqueio após excesso de tentativas" "429" "$LAST"

echo; echo "Resultado: $PASS ok, $FAIL falha(s)."
echo "Aguarde 1 minuto antes de logar de novo (rate limit)."
[[ $FAIL -eq 0 ]]
```

```bash
chmod +x scripts/security-check.sh
```

| Teste | O que prova |
|---|---|
| 01–03 | Sem sessão não há acesso a páginas nem a dados |
| 02 | Um cookie falso passa pelo proxy, mas é barrado no servidor |
| 04 | Não existe cadastro público |
| 05 | Proteção CSRF: requisições de outra origem são recusadas |
| 06 | Senha errada não entra |
| 08 | O cookie é `HttpOnly`: JavaScript da página não consegue lê-lo |
| 10 | A API não vaza o token |
| 12–13 | O logout invalida a sessão **no banco**; a cópia do cookie não funciona |
| 14 | Força bruta é bloqueada (rate limiting) |

### 3. Rodar a bateria em modo produção

Terminal 1:

```bash
npm run build && npm run start
```

Terminal 2 (com os dados do **seu** seed):

```bash
ADMIN_EMAIL="seu-email@exemplo.com" ADMIN_PASSWORD="sua-senha" bash scripts/security-check.sh
```

⚠️ Para não deixar a senha no histórico do terminal, comece o comando com
um **espaço** (no bash, com `HISTCONTROL=ignorespace`, que costuma ser o
padrão), ou leia a senha sem exibi-la:

```bash
read -rs ADMIN_PASSWORD && export ADMIN_PASSWORD
ADMIN_EMAIL="seu-email@exemplo.com" bash scripts/security-check.sh
```

### 4. Teste manual: conta desativada

```bash
docker compose exec postgres psql -U postgres -d admin_dev -c "update \"user\" set \"isActive\" = false;"
```

Aguarde 1 minuto (rate limit) e tente logar pela tela `/login`: deve
aparecer “E-mail ou senha inválidos.”, sem criar sessão. Depois, **reative**:

```bash
docker compose exec postgres psql -U postgres -d admin_dev -c "update \"user\" set \"isActive\" = true;"
```

💡 Na API, a resposta para conta desativada é
`401 FAILED_TO_CREATE_SESSION` (validado). A tela mostra a mesma mensagem
genérica de senha errada, sem revelar que a conta existe.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/app/api/v1/me/route.ts` | Criado | Endpoint protegido |
| `scripts/security-check.sh` | Criado | Bateria de testes de segurança |

## ✅ Como testar (critério de conclusão da Fase 03)

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `bash scripts/security-check.sh` | `Resultado: 14 ok, 0 falha(s).` |
| 2 | Teste manual da conta desativada | Login recusado; depois de reativar, volta a funcionar |
| 3 | `npm run typecheck && npm run lint && npm test && npm run build` | Tudo passa; `Tests: 10 passed` |

**Critério de aceite:** os três testes passam. **A Fase 03 está concluída.**

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Teste 07 falha com `429` | Rate limit de execuções anteriores | Aguardar 1 minuto e rodar de novo |
| Teste 05 retorna `200` | Proteção de origem desativada na configuração | Não desativar as verificações de origem do Better Auth |
| Teste 08 retorna `0` | Cookie sem `HttpOnly` (configuração alterada) | Remover alterações de `advanced.cookies` |
| `Connection refused` | Servidor não está rodando | Terminal 1: `npm run start` |

## Commit sugerido

```bash
git add src/app/api/v1/me scripts
git commit -m "feat(auth): adiciona endpoint /api/v1/me e bateria de testes de segurança"
git tag fase-03-autenticacao
```

Atualize o status da fase no [README da fase](README.md) e no
[mapa geral](../../README.md).

## Referências

- [OWASP — Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP — CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN — HttpOnly](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Cookies#restringir_o_acesso_aos_cookies)
- [Better Auth — Security](https://www.better-auth.com/docs/reference/security)
- ARCHITECTURE.md, seções 10.2, 11.9, 11.10 e 26

---

← [Passo anterior](09-proxy.md) · [Índice da fase](README.md) · Próxima fase: [04 — Backend](../04-setup-backend/README.md) →
