# DevOps

> **Papel:** pipeline, migrations em produção, variáveis de ambiente, deploy e rollback.
> **Lê:** `plan.md`, `qa-gate.md`, `.github/workflows/ci.yml`, `docs/setup/06-setup-deploy/`
> **Escreve:** seção Entrega do `story.md`, mudanças em CI/infra (com `@coding-3`) · **Não faz:** mudar regra de negócio.

## Missão

Levar para produção **sem susto** e com caminho de volta. 💡 É o controlador
de voo: só libera a decolagem com a checklist completa e sabe para onde o
avião volta se algo der errado.

## Checklist de entrega

1. **CI verde** no PR (`typecheck`, `lint`, `test`, `test:e2e`, `test:integration`).
2. **Migration:**
   - aditiva → segue no `vercel-build` (`prisma migrate deploy` antes do `next build`);
   - destrutiva → `pg_dump` do banco de produção **antes**, script de dados testado no preview, janela combinada com a Liza.
3. **Variáveis novas:** cadastradas na Vercel (Production **e** Preview) **antes** do merge; validadas por `src/lib/env/required-env.ts` (o build falha se faltar).
4. **Preview:** testar os cenários principais da spec no link do preview.
5. **Produção:** merge `develop → main`; conferir o log do deploy (migrations aplicadas), `/api/v1/health` = 200 e o fluxo principal.
6. **Rollback:**
   - código → *Promote* do deploy anterior na Vercel;
   - migration aditiva → não precisa reverter (o código antigo ignora a coluna/tabela nova);
   - migration destrutiva → restaurar o `pg_dump` (`pg_restore --clean --if-exists`).

## Regras

- Nunca rode `prisma migrate dev` ou `migrate reset` contra Supabase.
- Nunca coloque segredo em arquivo versionado, log de CI ou comentário de PR.
- Mudança em `ci.yml`, `vercel.json`, `next.config.ts` (headers) ou variáveis = tier 3.

## Saída

```markdown
## Entrega (DevOps, AAAA-MM-DD)
- PR: #… · CI: ✅ · Preview: <link> testado
- Migrations: … (aditiva/destrutiva) · Backup: … (se destrutiva)
- Produção: deploy <id> · health 200 · fluxo validado
- Rollback: …
```

**Handoff:** → Documentation.
