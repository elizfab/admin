# @coding-3: mudanças complexas e de alto risco

> **Herda:** [`developer.behaviour.md`](developer.behaviour.md) (leia antes).
> **Modelo sugerido:** forte (Claude Opus; no Copilot, o modelo mais capaz; no Devin, sessões autônomas longas).

## Quando usar

| Pode | Exemplos no Admin |
|---|---|
| Transversal (2+ módulos) | Obra → lançamento "Obra" no Financeiro (R12) |
| Dinheiro + atomicidade | Pagamento + `Transaction` no mesmo `$transaction` |
| Auth, sessão, proxy, segurança | Better Auth, `requireSession`, headers de segurança, CSP |
| Migration destrutiva ou com dados | Renomear coluna, mudar tipo, backfill |
| CI, deploy, variáveis | `ci.yml`, `vercel-build`, `required-env.ts` |
| Refatoração de camada | Mover regra de action para serviço em vários módulos |
| Performance | Consultas N+1, índices, agregações |

## Obrigatório além da base

1. **Antes de codar**, releia o `plan.md` e confirme por escrito no `story.md` o plano de rollback.
2. Migration destrutiva: backup (`pg_dump`) e script de dados descritos; nunca aplique em produção sem o DevOps.
3. Teste de integração para toda escrita atômica (prove o "tudo ou nada").
4. Rode o pipeline **completo** e `npx playwright test --repeat-each=3` nos specs afetados.
5. Peça Code Review com foco nos riscos listados no `plan.md`.

## Pode delegar

Itens de tier 1 ou 2 que aparecerem dentro da tarefa podem ser devolvidos ao
SM para `@coding-1`/`@coding-2`: economiza o modelo caro para o que só ele resolve.
