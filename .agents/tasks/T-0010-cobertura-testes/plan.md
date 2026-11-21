# Plano técnico: cobertura de testes na CI (T-0010)

| Item | Arquivo |
|---|---|
| Config que junta unitários + integração (`projects`) e define o escopo da cobertura | `jest.coverage.config.ts` |
| Regras puras (arquivos alterados, comparação com 95% e com a linha de base) | `scripts/coverage-rules.ts` |
| CLI (lê `coverage/coverage-summary.json`, `git diff`, imprime a tabela, sai 1 se falhar) | `scripts/coverage-check.ts` |
| Linha de base do total | `coverage-baseline.json` |
| Testes das regras | `tests/unit/scripts/coverage-rules.test.ts` |
| CI | `.github/workflows/ci.yml` (`fetch-depth: 0`, cobertura depois do E2E, artefato) |
| Regras dos agentes | `AGENTS.md`, `.agents/{workflow,project-context,pm,tester,qa,developer}.md` |

- Base do diff: `origin/$GITHUB_BASE_REF` no PR; `origin/develop` no push/`workflow_call`; local: `origin/develop`.
- Arquivo apagado não conta; arquivo fora do escopo é ignorado.

## Riscos e testes que protegem

| Risco | Teste |
|---|---|
| Arquivo alterado escapa da checagem | `coverage-rules.test.ts` (escopo e filtros) |
| Total cai sem ninguém ver | `coverage-rules.test.ts` (linha de base) |

## Tier

**@coding-3** (CI).
