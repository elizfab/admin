# Passo 07 — Deploy e fim do acesso público

> **Fase:** 08 — Portal Dev protegido\
> **Tempo estimado:** 45 min\
> **Depende de:** [Passo 06](06-token-e-variaveis.md)

## Objetivo

Publicar o Admin servindo o portal em produção e, **só depois**, tornar o
`portal-dev` privado e desligar o GitHub Pages: o conteúdo deixa de ser público
sem nunca ficar fora do ar.

## 💡 Por que esta ordem

💡 É uma mudança de endereço: primeiro a casa nova fica pronta e com a luz
ligada, depois você entrega a chave da antiga. Se o Pages fosse desligado
antes, o portal ficaria sem endereço até o deploy do Admin terminar.

| Ordem | Ação | Se algo der errado… |
|---|---|---|
| 1 | PR do Admin → preview com o portal | Nada mudou para ninguém |
| 2 | Merge na `main` → produção com o portal | O deploy anterior continua no ar (o build falha antes de publicar) |
| 3 | Testar a produção | Ainda dá para voltar atrás: o Pages continua no ar |
| 4 | `portal-dev` privado + Pages desligado | Fim do acesso público |
| 5 | Push no `portal-dev` → deploy automático do Admin | Prova de que o ciclo completo funciona |

## Pré-requisitos

- Passos 01 a 06 concluídos.
- Release `portal-build` publicada pelo CI do `portal-dev` (fase 04 de lá).

## Passo a passo

### 1. Pipeline local e PR

```bash
npm run typecheck && npm run lint && npm test && npm run test:e2e && npm run test:integration
git push -u origin feat/portal
gh pr create --base develop --title "feat(portal): Portal Dev protegido em /portal" \
  --body "Fase 08 / ADR-007: portal servido pelo Admin, só com sessão."
```

### 2. Testar o preview

1. No log do build da Vercel: `✔ [portal] publicado em .portal/` **antes** do `prisma migrate deploy`.
2. Abra o preview **sem** login, em `/portal/docs/intro`: deve ir para o `/login`.
3. Logada (conta de preview, Fase 06): `/documentation` → **Abrir o Portal Dev**.

💡 No preview, o link **← Admin** do portal aponta para a **produção** (a URL
foi definida no build do portal). É esperado; veja a ADR-007.

### 3. Produção

Merge na `develop`, PR `develop → main`, CI ✅, merge. Depois, no endereço de produção:

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Janela anônima → `/portal` | `/login` |
| 2 | `curl -sI https://admin-elizabetefabri.vercel.app/portal/docs/intro` | `307` para `/login` |
| 3 | Logada → `/documentation` → seção **Backend** | Página do portal |
| 4 | DevTools → Network → resposta de `/portal/docs/intro` | `cache-control: private, no-cache` e `x-robots-tag: noindex, nofollow` |
| 5 | Busca do portal (Ctrl + K) → "docker" | Resultados |

### 4. Fim do acesso público (no `portal-dev`)

Siga a fase 04, passo 03, do `portal-dev` (`docs/setup/04-integracao-admin/03-tornar-privado.md`). Em resumo:

1. **Settings → Pages** → *Unpublish site* (ou remova a fonte de publicação).
2. **Settings → General → Danger Zone → Change repository visibility → Private**.
3. Confira, numa janela anônima:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://elizfab.github.io/portal-dev/
curl -s -o /dev/null -w "%{http_code}\n" https://github.com/elizfab/portal-dev
```

Os dois devem responder `404`.

⚠️ Mudar a visibilidade **não apaga** cópias que já existiam: forks públicos,
clones e o cache de buscadores. Para um caderno de estudos, isso é aceitável;
se algum dia houver algo sensível no histórico, a solução é outra (reescrever o
histórico e trocar credenciais), não só esconder o repositório.

### 5. Provar o ciclo completo

No `portal-dev`, faça uma mudança pequena (por exemplo, um texto no
`intro.mdx`) e um push na `main`. Em seguida:

1. Actions do `portal-dev`: jobs **build** e **publish** ✅ e a mensagem "Deploy do Admin solicitado.".
2. Vercel: um deploy novo do Admin iniciado pelo hook `portal-dev`.
3. `/documentation`: o **commit** da versão publicada é o do seu push.
4. `/portal/docs/intro`: o texto novo aparece.

### 6. Atualizar o mapa da documentação

Em `docs/README.md`, na tabela de fases:

```markdown
| 08 | [`setup/08-portal-dev`](setup/08-portal-dev/README.md) | Portal Dev protegido, servido pelo Admin em `/portal` | ✅ |
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `docs/README.md` | Alterado | Fase 08 no mapa |

## ✅ Como testar

**Critério de aceite:** os 5 testes da produção (item 3) passam, os dois
`curl` do item 4 respondem `404` e o ciclo do item 5 publica o texto novo
**sem nenhuma ação manual** no Admin.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Build do Admin falha: `release ... respondeu 404` depois do repositório ficar privado | Token criado **antes** de existir acesso ao repositório, ou com outro dono | Passo 06, item 1 |
| Push no portal não gera deploy do Admin | `ADMIN_DEPLOY_HOOK` ausente (o CI mostra um *warning*) | Passo 06, item 4 |
| Portal atualizado no Admin, mas o navegador mostra o antigo | HTML em cache local | `Ctrl + Shift + R`; o HTML usa `no-cache`, então isso só acontece com abas abertas há tempo |
| Actions do `portal-dev` sem minutos | Repositórios privados têm cota mensal no plano gratuito | O build leva cerca de 2 minutos; acompanhe em *Settings → Billing* |
| Token expirou (deploy falha com `401`) | Prazo do passo 06 | Gere outro token e atualize na Vercel; depois, **Redeploy** |

## Commit sugerido

```bash
git add docs/README.md
git commit -m "docs: conclui fase 08 (Portal Dev protegido)"
```

## Referências

- [GitHub — Unpublishing a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/unpublishing-a-github-pages-site)
- [GitHub — Setting repository visibility](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility)
- [GitHub Actions — billing](https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions)

---

← [Passo anterior](06-token-e-variaveis.md) · [Índice da fase](README.md) · [Mapa geral](../../README.md) →
