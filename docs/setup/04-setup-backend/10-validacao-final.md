# Passo 10 — Validação final e testes de isolamento

> **Fase:** 04 — Backend\
> **Tempo estimado:** 40 min\
> **Depende de:** [Passo 09](09-telas-projetos.md)

## Objetivo

Provar, com duas usuárias reais, que **uma não consegue ver, alterar nem
excluir os projetos da outra**, e fechar a fase com todas as verificações.

## 💡 Por que testar com duas usuárias

Com uma conta só, “ver apenas os meus projetos” e “ver todos os projetos”
dão **o mesmo resultado**, e o bug fica invisível. Uma segunda conta é como
um **cliente oculto**: ela tenta acessar o que não é dela, e o sistema
precisa responder como se aquilo não existisse.

Este é o teste da vulnerabilidade nº 1 do OWASP API Top 10 (*Broken Object
Level Authorization*): trocar o `id` na URL e acessar dados de outra pessoa.

## Pré-requisitos

- Passo 09 concluído.

## Passo a passo

### 1. Criar uma segunda conta, só no banco local

O seed aceita variáveis vindas do terminal, que têm prioridade sobre o
`.env.local`:

```bash
SEED_ADMIN_NAME="Teste" SEED_ADMIN_EMAIL="teste@example.com" SEED_ADMIN_PASSWORD="teste-senha-forte-123" npx prisma db seed
```

Esperado: `Administradora criada: teste@example.com`.

⚠️ Essa conta existe **só** no banco local, para testes. Nunca rode isso
contra o banco de produção.

### 2. Abrir as duas sessões

Com `npm run build && npm run start` rodando:

```bash
B=http://localhost:3000
H=(-H "Origin: $B" -H "Content-Type: application/json")

curl -s -c /tmp/dona.txt -o /dev/null "${H[@]}" -d '{"email":"SEU-EMAIL","password":"SUA-SENHA"}' $B/api/auth/sign-in/email
curl -s -c /tmp/outra.txt -o /dev/null "${H[@]}" -d '{"email":"teste@example.com","password":"teste-senha-forte-123"}' $B/api/auth/sign-in/email
```

### 3. Roteiro de isolamento

Crie um projeto com a **dona** e guarde o `id`:

```bash
curl -s -b /tmp/dona.txt "${H[@]}" -d '{"name":"Projeto da dona"}' $B/api/v1/projects
ID="cole-aqui-o-id"
```

| # | Quem | Comando | Esperado |
|---|---|---|---|
| 1 | Outra | `curl -s -w " %{http_code}\n" -b /tmp/outra.txt $B/api/v1/projects/$ID` | `404` “Projeto não encontrado.” |
| 2 | Outra | `curl -s -w " %{http_code}\n" -b /tmp/outra.txt -X PATCH "${H[@]}" -d '{"name":"invadido"}' $B/api/v1/projects/$ID` | `404` |
| 3 | Outra | `curl -s -w " %{http_code}\n" -b /tmp/outra.txt -X DELETE -H "Origin: $B" $B/api/v1/projects/$ID` | `404` |
| 4 | Outra | `curl -s -b /tmp/outra.txt $B/api/v1/projects` | `{"data":[]}`: a lista dela não mostra o projeto da dona |
| 5 | Dona | `curl -s -b /tmp/dona.txt $B/api/v1/projects/$ID` | `200`: o projeto continua **intacto** (nome original) |
| 6 | Dona | `curl -s -b /tmp/dona.txt "${H[@]}" -d '{"name":"Tentativa","ownerId":"outra-pessoa"}' $B/api/v1/projects` | `201` com `ownerId` = **o da dona**: o campo enviado foi ignorado |
| 7 | Outra (navegador) | Logar como `teste@example.com` e abrir `/projects/$ID/edit` | “Página não encontrada” |

### 4. Bateria de segurança atualizada

Acrescente ao `scripts/security-check.sh` duas verificações para a nova API.

Logo após o teste `06`:

```bash
check "06b /api/v1/projects responde 401" "401" "$(status "$BASE/api/v1/projects")"
```

Logo após o teste `11`:

```bash
check "11b /api/v1/projects responde 200" "200" "$(status -b "$JAR" "$BASE/api/v1/projects")"
```

Rode (aguarde 1 minuto se acabou de testar logins):

```bash
ADMIN_EMAIL="SEU-EMAIL" ADMIN_PASSWORD="SUA-SENHA" bash scripts/security-check.sh
```

Esperado: `Resultado: 16 ok, 0 falha(s).`

### 5. Limpeza

```bash
rm -f /tmp/dona.txt /tmp/outra.txt
```

A conta de teste pode continuar no banco local; ela será reaproveitada na
Fase 05 (E2E). Para removê-la, use o Prisma Studio (exclua os projetos dela
antes: a relação é `Restrict`).

## ✅ Checklist final da fase

**Automático**

- [ ] `npm run typecheck`: sem erros
- [ ] `npm run lint`: sem erros e sem avisos
- [ ] `npm test`: **29 testes** passando
- [ ] `npm run build`: rotas de `/projects` e de `/api/v1/projects`
- [ ] `security-check.sh`: **16 ok**

**Isolamento**

- [ ] Os 7 itens do roteiro do item 3 conferem

**Interface** (passo 09)

- [ ] Criar, editar e excluir pela tela, inclusive só com teclado
- [ ] Erro de validação mantém o texto digitado

**Critério de aceite:** todos os itens marcados. **A Fase 04 está concluída.**

## Commit sugerido

```bash
git add scripts/security-check.sh
git commit -m "test: amplia bateria de segurança para a API de projetos"
git tag fase-04-backend
```

Atualize o status no [README da fase](README.md) e no [mapa geral](../../README.md).

## Referências

- [OWASP API Security Top 10 — API1:2023 BOLA](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)
- [OWASP API Security Top 10 — API3:2023 Mass Assignment](https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/)
- ARCHITECTURE.md, seções 1.1, 11.8 e 22.5

---

← [Passo anterior](09-telas-projetos.md) · [Índice da fase](README.md) · Próxima fase: [05 — Testes E2E](../05-setup-testes-e2e/README.md) →
