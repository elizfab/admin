# Passo 12 — Prettier e formatação automática

> **Fase:** 06 — Repositório, CI, Deploy e Operação\
> **Tempo estimado:** 15 min\
> **Depende de:** [Passo 05 — CI no GitHub Actions](05-ci-github-actions.md)

## Objetivo

Todo arquivo de código tem **um** formato só. O commit formata sozinho o que você mexeu,
a CI recusa arquivo fora do formato e os PRs param de trazer diffs que são só indentação.

## 💡 Por que

É o **acordo de margens e fonte de um documento compartilhado**: se cada pessoa usa a sua,
toda revisão vira "mudou a margem" em vez de "mudou o texto". Com um formato combinado e
aplicado pela máquina, o diff mostra só o que mudou de verdade.

Tecnicamente:

- **Prettier** cuida do formato (espaços, quebras, aspas, vírgulas); o **ESLint** continua
  cuidando da qualidade (erros, hooks do React, imports).
- **lint-staged + simple-git-hooks**: no `git commit`, o Prettier formata **só os arquivos
  do commit**. O simple-git-hooks usa `preserveUnused` para **não apagar** os hooks do
  Graphify (`post-commit`, `post-checkout`, `post-merge`, `post-rewrite`).
- **Commit único de formatação** (`5ba40ff`), listado em `.git-blame-ignore-revs`: o
  `git blame` e o GitHub pulam esse commit e mostram a autoria real de cada linha.

## Pré-requisitos

- `npm install` rodado depois deste passo (o script `prepare` instala o hook).

## Passo a passo

### 1. Configuração

| Arquivo | Conteúdo |
|---|---|
| `.prettierrc.json` | 100 colunas; 4 espaços em TS/TSX/JS; 2 espaços em SCSS/CSS/JSON/YAML |
| `.prettierignore` | Dependências, gerados, relatórios, `prisma/migrations/` e `*.md` (docs escritas à mão) |

### 2. Scripts

```bash
npm run format        # formata tudo (raramente necessário: o hook já faz)
npm run format:check  # só confere (é o que a CI roda)
```

### 3. Blame sem o commit de formatação (uma vez por máquina)

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

### 4. Editor (recomendado)

No VS Code, instale a extensão **Prettier - Code formatter** e ative *Format On Save*:
ela lê o `.prettierrc.json` do projeto.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `.prettierrc.json`, `.prettierignore` | Criado | Formato e exceções |
| `package.json` | Alterado | Scripts `format`, `format:check`, `prepare`; config do hook e do lint-staged |
| `.git-blame-ignore-revs` | Criado | Commits só de formatação |
| `.github/workflows/ci.yml` | Alterado | Etapa "Formatação" antes do lint |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run format:check` | "All matched files use Prettier code style!" |
| 2 | Indente um `.ts` com 2 espaços, `git add` e `git commit` | O hook reformata para 4 espaços antes de gravar |
| 3 | `ls .git/hooks` | `pre-commit` **e** os 4 hooks do Graphify |
| 4 | PR com arquivo fora do formato | CI ❌ na etapa "Formatação" |

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Hook não roda | `npm install` não rodou depois deste passo | `npx simple-git-hooks` |
| Hooks do Graphify sumiram | Config sem `preserveUnused` | Confira `package.json` e rode `graphify hook install` |
| CI falha em "Formatação" | Arquivo editado sem o hook | `npm run format` e novo commit |
| Preciso comitar sem o hook (emergência) | — | `SKIP_SIMPLE_GIT_HOOKS=1 git commit …` (a CI ainda confere) |

## Referências

- [Prettier — opções](https://prettier.io/docs/options)
- [lint-staged](https://github.com/lint-staged/lint-staged)
- [simple-git-hooks](https://github.com/toplenboren/simple-git-hooks)
- [GitHub — ignorar commits no blame](https://docs.github.com/repositories/working-with-files/using-files/viewing-and-understanding-files#ignore-commits-in-the-blame-view)
