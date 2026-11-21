# T-0006 — Danger e PR automático para a develop

| Campo | Valor |
|---|---|
| Tipo | infra |
| Módulos | plataforma (CI) |
| Tamanho | M |
| Tier | @coding-3 (CI) |
| Estado (Kanban) | Pronto p/ deploy (na develop pelo PR #9; produção pelo #11) |
| Criada em | 2026-11-19 |
| Branch / PR | `feature/bmad-agents` · PR automático no push |

## Pedido (palavras da Liza)

> "Instala o Danger, para validar o tipo de branch aceito, que é somente a feature, e após
> validar o tipo de branch cria o PR automaticamente na esteira do GitHub, sem que eu precise
> ir lá clicar e abrir o PR. Quando identificar a branch do tipo feature, o mesmo dispara e
> abre o PR para develop."

## Gate pulado (registro)

Pedido direto e detalhado da Liza na sessão de 2026-11-19: vale como escopo aprovado
(G1). Sem `proposal.md`/`plan.md` separados; o desenho está abaixo e no guia
`docs/setup/06-setup-deploy/11-danger-e-pr-automatico.md`. A validação no GitHub
(teste 4 do guia) fica com a Liza.

## Desenho

- Fluxo aceito: `feature/<slug>` → `develop` → `main`. Regra única: `scripts/branch-rules.ts`.
- `auto-pr.yml` (push fora de `main`/`develop`): valida a branch → abre o PR (se não existe
  e há commits) → roda Danger e CI no PR novo.
- Motivo do Danger/CI dentro do `auto-pr.yml`: PR criado pelo `GITHUB_TOKEN` não dispara
  workflows. O Danger recebe um evento `pull_request` montado com `gh api`.
- `danger.yml`: Danger em todo `pull_request` (pushes seguintes).
- `ci.yml`: + `workflow_call`.
- Sem segredo novo: a permissão "Allow GitHub Actions to create and approve pull requests" já está ligada.

## Testes (Tester)

| Cenário | Teste | Nível | Estado |
|---|---|---|---|
| Aceita `feature/<slug>`; recusa `fix/`, `feat/`, `docs/`, maiúsculas, vazio, subpasta | `tests/unit/scripts/branch-rules.test.ts › checkPushBranch` | Unitário | 🔴 → ✅ |
| PR: `feature/*`→`develop` e `develop`→`main` aceitos; o resto recusado | `… › checkPullRequest` | Unitário | 🔴 → ✅ |
| Danger num PR real aceito (#8) e num recusado (#7) | `npx danger pr <url>` | Manual local | ✅ |
| Sintaxe dos workflows | `actionlint` | Estático | ✅ |

## Gates

| Gate | Estado | Evidência |
|---|---|---|
| G1 Spec | ✅ | Pedido da Liza (acima) |
| G2 Testes vermelhos | ✅ | 18 testes falharam antes do módulo existir |
| G3 Pipeline verde | ✅ | `typecheck`, `lint`, `test`, `test:e2e`, `test:integration` locais em 2026-11-19 |
| G4 Review | ⬜ | PR |
| G5 QA | ⬜ | Teste 4 do guia no GitHub (Liza) |
| G6 Registro | ✅ | `docs/CHANGELOG.md`, guia do passo 11, `project-context.md` §9 |

## Handoffs

### Handoff: @coding-3 → Code Review (2026-11-19)
- Feito: Danger 14.1.0, regra de branches com testes, 2 workflows novos, `workflow_call` na CI, docs.
- Decidido: `main` só aceita PR da `develop`; base diferente de `develop`/`main` é recusada.
- Pendente / riscos: o primeiro push valida o fluxo de verdade; branches antigas (`docs/*`) passam a ser recusadas pelo Danger.
- Arquivos tocados: `dangerfile.ts`, `scripts/branch-rules.ts`, `scripts/check-branch.ts`, `tests/unit/scripts/branch-rules.test.ts`, `.github/workflows/{auto-pr,danger,ci}.yml`, `package.json`, `package-lock.json`, docs.
- Próximo passo: `git push`; conferir Actions → "PR automático".
