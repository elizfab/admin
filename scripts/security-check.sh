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
check "06b /api/v1/projects responde 401" "401" "$(status "$BASE/api/v1/projects")"

echo "== Com sessão =="
check "07 login correto" "200" "$(login "$PASSWORD" -c "$JAR")"
check "08 cookie é HttpOnly" "1" "$(grep -c '^#HttpOnly_' "$JAR")"
check "09 /api/v1/me responde 200" "200" "$(status -b "$JAR" "$BASE/api/v1/me")"
check "10 /api/v1/me não expõe token" "0" "$(curl -s -b "$JAR" "$BASE/api/v1/me" | grep -ci 'token')"
check "11 /dashboard abre" "200" "$(status -b "$JAR" "$BASE/dashboard")"
check "11b /api/v1/projects responde 200" "200" "$(status -b "$JAR" "$BASE/api/v1/projects")"

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
