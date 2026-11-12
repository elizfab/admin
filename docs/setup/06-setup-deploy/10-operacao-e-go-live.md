# Passo 10 — Operação e checklist de go-live

> **Fase:** 06 — Deploy\
> **Tempo estimado:** 30 min\
> **Depende de:** [Passo 09](09-backup-e-keepalive.md)

## Objetivo

Saber **o que fazer quando algo der errado** (um roteiro de incidentes, o
*runbook*) e fechar o projeto com o checklist final de go-live.

## 💡 Por que escrever o roteiro antes do problema

No meio de um incidente, com a aplicação fora do ar, ninguém raciocina bem.
O runbook é o **manual de emergência do avião**: escrito com calma, para
ser seguido sob pressão.

## Roteiro de incidentes (runbook)

### 1. Deploy novo quebrou a produção

1. **Voltar primeiro, investigar depois.** Vercel → projeto → *Production
   Deployment* → **Instant Rollback**. No plano Hobby, só é possível voltar
   para o deploy de produção **imediatamente anterior**.
2. O rollback **não desfaz migrations**. Se o deploy quebrado aplicou uma
   migration, confira se a versão anterior funciona com o schema novo (o
   padrão “expandir e depois contrair”, abaixo, evita esse problema).
3. Corrija num branch, faça PR (CI + preview) e o merge. Depois de um
   rollback, a Vercel pode suspender a promoção automática de novos deploys
   para a produção: confira e, se preciso, use **Promote to Production** no
   deploy corrigido.

### 2. Migration falhou no build

O build para e a versão anterior **continua no ar** (nada a reverter).
Corrija a migration num branch e valide no preview.

> **Expandir e depois contrair** (*expand and contract*): para renomear ou
> remover uma coluna, faça em **dois deploys**. No 1º, crie a coluna nova e
> faça o código usar as duas. No 2º, remova a antiga. Assim, um rollback
> nunca encontra o banco sem a coluna que o código antigo espera.

### 3. Suspeita de vazamento de segredo

| Segredo vazado | Ação imediata |
|---|---|
| `BETTER_AUTH_SECRET` | Gerar outro (`openssl rand -base64 32`), trocar na Vercel e fazer **Redeploy**. Todas as sessões são invalidadas: o login é exigido de novo |
| Senha do banco | Supabase → **Database → Reset database password**; atualizar `DATABASE_URL` e `DIRECT_URL` na Vercel; **Redeploy** |
| Sua senha de login | Trocar a senha (por um novo seed numa conta nova, ou por uma tela de troca de senha futura) e apagar as linhas da tabela `session` da sua conta |

### 4. Supabase pausado

Supabase → projeto → **Restore**. Depois, confira na aba **Actions** do
GitHub se o *Keep-alive* está rodando diariamente.

### 5. “Esqueci minha senha”

Não existe tela de recuperação nesta versão (decisão da seção 11.1: uma
única conta e nenhum e-mail transacional). Procedimento: rodar o seed com
**outro e-mail** (cria uma nova conta administradora), entrar e, pelo
Prisma Studio apontado para a produção, desativar a conta antiga
(`isActive = false`).

### 6. Login bloqueado (“Muitas tentativas”)

É o rate limit funcionando: aguarde 1 minuto.

## Melhorias registradas para o futuro

| Melhoria | Por quê | Fase |
|---|---|---|
| CSP completa com *nonce* (`script-src`) | Bloqueia scripts injetados (XSS) | Expansão |
| Tela de troca de senha | Hoje só por seed | Expansão |
| Monitoramento de erros (ex.: Sentry) | Saber do erro antes da usuária | Expansão |
| Proteger o Docusaurus | Hoje é público (seção 19.2) | Expansão |
| Alinhar o PostgreSQL local e do CI à versão do Supabase | Paridade total entre ambientes | Manutenção |

## ✅ Checklist final de go-live

**Código e repositório**

- [ ] `elizfab/personal-platform-admin` privado, sem segredos no histórico
- [ ] CI ✅ na `main`
- [ ] Headers de segurança presentes em produção
- [ ] Build falha se faltar variável obrigatória

**Infraestrutura**

- [ ] 2 projetos Supabase (produção e preview), mesma região, Data API desligada
- [ ] Vercel: variáveis separadas por ambiente; região `gru1`; Deployment Protection ligada
- [ ] Previews com login funcionando (`BETTER_AUTH_ALLOWED_HOSTS`)

**Segurança e dados**

- [ ] `security-check.sh` contra a produção: **16 ok**
- [ ] Conta administradora criada com senha forte e única
- [ ] Backup de produção feito, **restaurado com sucesso**, criptografado e guardado fora da máquina
- [ ] Keep-alive rodando diariamente

**Documentação**

- [ ] URL de produção registrada no `README.md` e no `docs/README.md`
- [ ] Status de todas as fases atualizado no mapa

**Critério de aceite:** todos os itens marcados. **O projeto está em produção.** 🎉

## Commit sugerido

```bash
git switch -c docs/go-live
git add docs README.md
git commit -m "docs: conclui fase 06 (deploy em produção)"
git push -u origin docs/go-live
# PR → CI ✅ → merge
git switch main && git pull
git tag fase-06-deploy && git push --tags
```

## Referências

- [Vercel — Instant Rollback](https://vercel.com/docs/instant-rollback)
- [Prisma — Expand and contract pattern](https://www.prisma.io/dataguide/types/relational/expand-and-contract-pattern)
- [Supabase — Postgres roles e senhas](https://supabase.com/docs/guides/database/postgres/roles)
- ARCHITECTURE.md, seções 11.9, 18 e 19

---

← [Passo anterior](09-backup-e-keepalive.md) · [Índice da fase](README.md) · [Mapa geral](../../README.md)
