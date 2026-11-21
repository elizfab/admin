# Proposta de mudança: Prettier (T-0011)

## Why (por quê)

Cada editor formata de um jeito: PRs vêm com dezenas de arquivos que só mudaram indentação,
escondendo a mudança real no review.

## What Changes (o que muda)

- Prettier 3.10.1 (`.prettierrc.json`: 100 colunas, 4 espaços; 2 em SCSS/CSS/JSON/YAML) e `.prettierignore` (gerados, migrations, Markdown).
- **Um** commit só de formatação, listado em `.git-blame-ignore-revs` (o `git blame` e o GitHub pulam esse commit).
- `pre-commit` (simple-git-hooks + lint-staged): formata **só os arquivos do commit**. Convive com os hooks do Graphify (`preserveUnused`).
- CI: etapa "Formatação" (`npm run format:check`) antes do lint.

## Impact (impacto)

- Diff grande **uma vez** (só espaços e quebras de linha; nenhum comportamento muda: provado pelo pipeline completo).

## Delta de requisitos (sobre `docs/implementations/platform.md`)

### ADDED

#### PLAT-R18 — Código formatado pelo Prettier; a CI recusa arquivo fora do formato

```gherkin
Cenário: arquivo com indentação diferente
  Dado um PR com um .ts indentado com 2 espaços
  Quando a CI roda "Formatação"
  Então a etapa falha citando o arquivo
```

## Rollback

Remover a etapa da CI e o hook; o commit de formatação pode ficar.
