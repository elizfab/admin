# Passo 13 — Validação final e deploy

> **Fase:** 07 — Novos Módulos\
> **Tempo estimado:** 45 min\
> **Depende de:** [Passo 12](12-testes-e2e.md)

## Objetivo

Rodar o pipeline completo, publicar o Financeiro em **preview** e depois em
**produção** com a migration aplicada, e deixar o roteiro pronto para o
próximo módulo (PDI ou Release Control).

## 💡 Por que esta migration é segura em produção

A migration do Financeiro é **aditiva**: só **cria** dois `enum`, uma tabela
e um índice. Ela não altera nem apaga nada que já existe. 💡 É como construir
um cômodo novo sem mexer nas paredes da casa: se algo der errado depois, a
casa continua de pé.

Na Vercel, o `vercel-build` (Fase 06) roda `prisma migrate deploy` **antes**
do `next build`. Ou seja: o preview aplica a migration no **banco de preview**,
e o merge na `main` aplica no **banco de produção**. Você não roda nada à mão
em produção.

| Ambiente | Banco | Quando a migration roda |
|---|---|---|
| Local | `admin_dev` (Docker) | Passo 02 (`migrate dev`) |
| CI | `admin_test` (serviço do GitHub Actions) | `globalSetup` do E2E |
| Preview | Supabase de preview | Build do preview (`vercel-build`) |
| Produção | Supabase de produção | Build após o merge na `main` |

## Pré-requisitos

- Passos 01 a 12 concluídos e commitados na branch `feat/finance`.

## Passo a passo

### 1. Rodar o pipeline local, na ordem do CI

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run test:integration
```

### 2. Abrir o PR para a `develop`

```bash
git push -u origin feat/finance
gh pr create --base develop --title "feat(finance): módulo Painel Financeiro" \
  --body "Fase 07: roteiro de módulos + Financeiro (transações, resumo do mês, API, testes)."
```

Aguarde o **CI ✅** e o comentário da Vercel com o link do **preview**.

### 3. Testar no preview

1. No log do build da Vercel, confirme: `Applying migration ..._add_finance_transactions`.
2. Abra o preview e entre com a conta de preview (Fase 06, passo 08).
3. Repita os testes 1, 3, 4 e 9 do [passo 10](10-telas.md#-como-testar).

### 4. Publicar em produção

1. **Squash and merge** do PR na `develop`.
2. PR `develop → main`, CI ✅, **merge**.
3. No log do deploy de produção: `All migrations have been successfully applied.`
4. Em <https://admin-elizabetefabri.vercel.app/finance>: lance uma transação real.
5. No Supabase de **produção** → *Table Editor*: a tabela `transaction` existe.

### 5. Atualizar o mapa da documentação

Em `docs/README.md`, acrescente a linha da fase na tabela da seção 2:

```markdown
| 07 | [`setup/07-novos-modulos`](setup/07-novos-modulos/README.md) | Roteiro de módulos novos + Painel Financeiro | ✅ |
```

E marque os passos como ✅ no `README.md` desta fase.

### 6. O próximo módulo (PDI ou Release Control)

Tudo o que você fez aqui vira **cópia com troca de nomes**:

| Parte | No próximo módulo |
|---|---|
| `lib/money`, `lib/dates` | **Reutiliza** (não cria de novo) |
| Pastas `types`, `schemas`, `repositories`, `services`, `actions`, `components` | Copia a estrutura de `modules/finance` e troca os nomes |
| Rotas `/api/v1/<m>/<recursos>` | Copia o `route.ts` e o `[id]/route.ts`, troca schema e serviço |
| Telas `new` e `[id]/edit` | Copia e troca o formulário |
| Registro | Checklist do passo 11 |
| Testes | Copia `finance.spec.ts` (com `clearMonth` adaptado) e o bloco de isolamento |

O que **não** se copia, e precisa ser pensado de novo, é a **ficha** do
passo 01: campos, regras e telas. É ela que decide o resto.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `docs/README.md` | Alterado | Fase 07 no mapa |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Pipeline local (passo 1) | `79` unitários, `30` E2E e `8` de integração passando |
| 2 | PR | CI ✅ e preview ✅ |
| 3 | Preview | Login, lançamentos e resumo funcionando |
| 4 | Produção | `/finance` no ar, com a tabela no Supabase de produção |

**Critério de aceite:** o Financeiro está em produção e o CI da `main` está
verde.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Preview com erro 500 em `/finance` | Migration não aplicada no banco de preview | Veja o log do build; confirme o `DIRECT_URL` do preview (Session pooler, porta 5432) |
| `P3009 migrate found failed migrations` | Uma migration falhou no meio, numa tentativa anterior | `npx prisma migrate resolve --rolled-back <nome>` apontando para aquele banco, e faça o redeploy |
| CI falha só no `test:integration` | E2E pulado ou falhou antes (é ele que migra o `admin_test`) | Corrija o E2E primeiro |

## Commit sugerido

```bash
git add docs/README.md docs/setup/07-novos-modulos/README.md
git commit -m "docs: conclui fase 07 (novos módulos + Financeiro)"
```

## Referências

- [Prisma — `migrate deploy` em produção](https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate)
- [Prisma — Resolving migration issues (`migrate resolve`)](https://www.prisma.io/docs/orm/prisma-migrate/workflows/patching-and-hotfixing)
- Fase 06, passos 03 e 08

---

← [Passo anterior](12-testes-e2e.md) · [Índice da fase](README.md) · [Mapa geral](../../README.md) →
