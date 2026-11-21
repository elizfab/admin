# Plano técnico: Prettier (T-0011)

| Item | Arquivo |
|---|---|
| Config e ignore | `.prettierrc.json`, `.prettierignore` |
| Scripts `format`, `format:check`, `prepare` (instala o hook) | `package.json` |
| Hook | `simple-git-hooks` (`pre-commit: npx lint-staged`, `preserveUnused: true`) |
| Commit de formatação | `style: …` + `.git-blame-ignore-revs` |
| CI | `.github/workflows/ci.yml` (etapa "Formatação") |
| Guia | `docs/setup/06-setup-deploy/12-prettier-e-formatacao.md` |

- `prepare` fora de um repositório git (build da Vercel): o simple-git-hooks só avisa e sai com 0 (testado).
- ESLint continua cuidando de qualidade; Prettier, de formato.

## Tier

**@coding-3** (CI).
