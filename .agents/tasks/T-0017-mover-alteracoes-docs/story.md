# T-0017 — Mover ALTERACOES-2026-11-15.md para docs

| Campo | Valor |
|---|---|
| Tipo | doc |
| Módulos | plataforma |
| Tamanho | P |
| Tier | @coding-1 |
| Estado (Kanban) | Pronto p/ deploy (na develop; produção pelo PR #11) |
| Criada em | 2026-11-19 |
| Branch / PR | `feature/t-0007-dashboard-financeiro-cobertura` · PR automático no push |

## Pedido (palavras da Liza)

> Tem esse arquivo na raiz ALTERACOES-2026-11-15.md, mova ele para o lugar correto dele em docs.

## Atalho registrado

`doc` P sem regra R1–R17: direto para `@coding-1`.

## Decisão

É um **registro de operação** da Fase 06 (deploy na Vercel), não um passo reproduzível nem uma
decisão: foi para `docs/setup/06-setup-deploy/registros/2026-11-15-identidade-visual-e-vercel.md`
(com `git mv`, mantendo o histórico), com a seção "Registros de operação" no README da fase e o
link do `README.md` da raiz atualizado.

## Gates

| Gate | Estado | Evidência |
|---|---|---|
| G1 | ➖ | Atalho doc |
| G3 | ✅ | `format:check`, links conferidos |
| G6 | ✅ | CHANGELOG |

## Handoffs

### Handoff: Orchestrator → @coding → QA → Documentation (2026-11-19)
- Feito: ver acima. Pipeline completo verde localmente.
- Próximo passo: `git push`; conferir no GitHub.
