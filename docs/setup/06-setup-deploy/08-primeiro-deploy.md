# Passo 08 — Primeiro deploy e verificação

> **Fase:** 06 — Deploy\
> **Tempo estimado:** 60 min\
> **Depende de:** [Passo 07](07-projeto-vercel.md)

## Objetivo

Publicar primeiro um **preview** e depois a **produção**, criar a conta
administradora no banco de produção e **provar** que tudo funciona e está
protegido.

## 💡 Por que nessa ordem

O preview é o **ensaio geral**: mesmo build, mesmas migrations, mesma
autenticação, mas com dados descartáveis. Se algo quebrar ali, a produção
nem foi tocada. 💡 Primeiro o ensaio com figurino; só depois a estreia.

## Pré-requisitos

- Passo 07 concluído, com as variáveis cadastradas.

## Passo a passo

### Parte A — Preview

#### 1. Abrir um PR de teste

```bash
git switch -c chore/primeiro-preview
git commit --allow-empty -m "chore: dispara o primeiro preview"
git push -u origin chore/primeiro-preview
```

Abra o PR no GitHub. Em poucos minutos aparecem **dois** checks: o **CI** e
o **Vercel** (com o link _Visit Preview_).

#### 2. Conferir o build do preview

Na Vercel: **Deployments** → o deploy do branch → **Build Logs**. Procure:

- `All migrations have been successfully applied.` (no banco **de preview**);
- `✓ Compiled successfully`.

#### 3. Criar uma conta no banco de preview

Da sua máquina, apontando **só** para o preview (as variáveis da linha de
comando têm prioridade sobre o `.env.local`):

```bash
DIRECT_URL="COLE-A-PREVIEW-DIRECT_URL" \
SEED_ADMIN_NAME="Liza (preview)" \
SEED_ADMIN_EMAIL="preview@example.com" \
SEED_ADMIN_PASSWORD="uma-senha-so-para-preview-123" \
npx prisma db seed
```

> Dica: comece o comando com um **espaço** para que ele não fique no
> histórico do terminal (bash com `HISTCONTROL=ignorespace`).

#### 4. Testar o preview no navegador

1. Clique em **Visit Preview**. A Vercel pede o login **da Vercel**
   (Deployment Protection). Entre.
2. A aplicação abre em `/login`. Entre com a conta do item 3.
3. Crie e exclua um projeto.

| Se acontecer                                                      | Causa                                                     | Solução                                                                     |
| ----------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------- |
| Login responde 403 / “Invalid origin”                             | `BETTER_AUTH_ALLOWED_HOSTS` não casa com a URL do preview | Compare o padrão com a URL real (o `<slug>` do passo 07) e use **Redeploy** |
| Erro 500 com `Host ... is not in the allowed hosts list` nos logs | Mesmo caso acima                                          | Idem                                                                        |

#### 5. Merge

Com o CI ✅ e o preview funcionando: **Squash and merge**. O merge na `main`
dispara o deploy de **produção**.

### Parte B — Produção

#### 6. Conferir o build de produção

Na Vercel, o deploy da `main` (marcado como **Production**) deve mostrar as
migrations aplicadas no banco **de produção** e terminar com **Ready**.

#### 7. Criar a conta administradora em produção

Agora sim, com os **seus** dados reais e uma senha forte e única:

```bash
DIRECT_URL="COLE-A-PROD-DIRECT_URL" \
SEED_ADMIN_NAME="Seu Nome" \
SEED_ADMIN_EMAIL="seu-email@exemplo.com" \
SEED_ADMIN_PASSWORD="SUA-SENHA-FORTE-E-UNICA" \
npx prisma db seed
```

Esperado: `Administradora criada: seu-email@exemplo.com`.

⚠️ Confira **duas vezes** que o `DIRECT_URL` é o de **produção** antes de
apertar Enter.

#### 8. Verificação de produção

```bash
PROD=https://admin.vercel.app

# Saúde (banco respondendo)
curl -s $PROD/api/v1/health

# Headers de segurança
curl -sI $PROD/login | grep -iE "x-frame|content-security|strict-transport|x-content|referrer|permissions"

# Bateria de segurança completa contra a PRODUÇÃO (16 verificações)
BASE_URL=$PROD ADMIN_EMAIL="seu-email@exemplo.com" ADMIN_PASSWORD="SUA-SENHA" bash scripts/security-check.sh
```

> A bateria termina testando o rate limit: depois dela, aguarde 1 minuto
> antes de logar pelo navegador.

#### 9. Uso real

Abra a URL de produção, faça login, crie seu primeiro projeto de verdade
(por exemplo, o próprio “Personal Platform”) e faça logout.

#### 10. Registrar a URL

No [`docs/README.md`](../../README.md) e no `README.md` do projeto, registre
a URL de produção.

## ✅ Como testar

| #   | Teste                                 | Resultado esperado                               |
| --- | ------------------------------------- | ------------------------------------------------ |
| 1   | PR de teste                           | CI ✅ + Vercel ✅ + login no preview funcionando |
| 2   | `curl $PROD/api/v1/health`            | `{"status":"ok","database":"up",...}`            |
| 3   | Headers                               | Os 6 headers presentes                           |
| 4   | `security-check.sh` contra a produção | `Resultado: 16 ok, 0 falha(s).`                  |
| 5   | Login real pelo navegador             | Dashboard com o seu nome                         |

**Critério de aceite:** os cinco testes passam. 🎉 **A aplicação está no ar.**

## ⚠️ Problemas comuns

| Sintoma                                                                | Causa provável                           | Solução                                                                                  |
| ---------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Build falha com `Build interrompido — variáveis de ambiente inválidas` | Variável faltando naquele ambiente       | Cadastrar (passo 07) e **Redeploy**                                                      |
| Build falha em `prisma migrate deploy` com timeout ou `P1001`          | `DIRECT_URL` com a conexão direta (IPv6) | Usar o **Session pooler**                                                                |
| `/api/v1/health` responde `503` em produção                            | `DATABASE_URL` errada ou banco pausado   | Conferir a variável e o status do projeto no Supabase; ver os **Runtime Logs** da Vercel |
| Supabase “Paused”                                                      | Inatividade no plano Free                | **Restore** no painel; configure o keep-alive (passo 09)                                 |

## Referências

- [Vercel — Deployments](https://vercel.com/docs/deployments)
- [Vercel — Preview deployments](https://vercel.com/docs/deployments/preview-deployments)
- [Prisma — Deploying to Vercel](https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel)

---

← [Passo anterior](07-projeto-vercel.md) · [Índice da fase](README.md) · [Próximo passo](09-backup-e-keepalive.md) →
