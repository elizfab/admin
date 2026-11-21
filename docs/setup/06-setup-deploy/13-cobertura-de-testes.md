# Passo 13 — Cobertura de testes (≥ 95% no código novo)

> **Fase:** 06 — Repositório, CI, Deploy e Operação\
> **Tempo estimado:** 15 min\
> **Depende de:** [Passo 05 — CI no GitHub Actions](05-ci-github-actions.md)

## Objetivo

A CI mede quanto do código os testes executam e **recusa o PR** quando um arquivo novo ou
alterado tem menos de 95% de cobertura, ou quando a cobertura total cai.

## 💡 Por que

É a **lista de conferência do piloto**: não prova que o voo será perfeito, mas garante que
nenhum item foi pulado. Linha de código que nenhum teste executa é linha que pode quebrar
sem ninguém perceber.

Tecnicamente:

- **Unitários + integração numa execução só** (`jest.coverage.config.ts`, com `projects`):
  o relatório soma os dois níveis.
- **Duas regras (R16):**
  1. cada arquivo **novo ou alterado** em `src/lib`, `src/modules` e `src/components` tem
     ≥ 95% de **linhas, comandos, ramos e funções**;
  2. o **total** não cai abaixo de `coverage-baseline.json` (tolerância de 0,1 ponto).
- **Por que "código novo" e não "tudo" de uma vez:** em 19/11/2026 o total era ~34% (escopo
  acima). Exigir 95% em tudo travaria a CI até escrevermos dezenas de testes. As tarefas
  T-0012 a T-0015 levam cada módulo a 95%; a cada uma, a linha de base sobe.
- **Fora da porcentagem:** `src/app/**` (páginas e route handlers, provados pelo E2E),
  `index.ts`/`server.ts` (só reexportam), `types/**` e `*.types.ts` (só tipos, sem código), `*.test.ts` e código gerado.
- Commits listados em `.git-blame-ignore-revs` (só formatação) **não** contam como alteração.

## Pré-requisitos

- Banco de teste no ar (`npm run db:up`) e migrado (o `npm run test:e2e` migra; ou
  `DATABASE_URL=…/admin_test npx prisma migrate deploy`).

## Passo a passo

### 0. No dia a dia: `npm test`

`npm test` já imprime a tabela de cobertura arquivo por arquivo **dos unitários** (mesmo escopo,
`jest.coverage-scope.mjs`). O número é menor que o da meta porque não inclui a integração
(repositórios contra o banco). Para a meta (R16), use os passos 1 e 2.

### 1. Gerar o relatório

```bash
npm run test:coverage
```

Abra `coverage/lcov-report/index.html` no navegador: linhas em vermelho não têm teste.

### 2. Conferir a meta

```bash
npm run coverage:check
```

Compara com `origin/develop` (na CI do PR, com a base do PR). Saída: tabela do total × linha
de base e a lista de arquivos abaixo de 95%.

### 3. Subiu a cobertura de propósito? Grave a nova linha de base

```bash
npm run coverage:baseline   # e comite o coverage-baseline.json
```

⚠️ Nunca grave a linha de base para **esconder** uma queda: o Code Review e o QA conferem.

### 4. Cobertura de um arquivo só (enquanto escreve o teste)

```bash
npx jest tests/unit/modules/x/x.service.test.ts --coverage --collectCoverageFrom=src/modules/x/services/x.service.ts
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `jest.coverage-scope.mjs` | Criado (T-0018) | Escopo único da cobertura (usado por `npm test` e `test:coverage`) |
| `jest.coverage.config.ts` | Criado | Unitários + integração; escopo e formatos do relatório |
| `scripts/coverage-rules.ts` | Criado | Regras puras (escopo, 95% por arquivo, linha de base) |
| `scripts/coverage-check.ts` | Criado | Lê o relatório e o `git diff`, imprime a tabela, sai 1 se falhar |
| `coverage-baseline.json` | Criado | Total mínimo aceito |
| `tests/unit/scripts/coverage-rules.test.ts` | Criado | Testes das regras |
| `package.json` | Alterado | `test:coverage`, `coverage:check`, `coverage:baseline` |
| `.github/workflows/ci.yml` | Alterado | `fetch-depth: 0`; cobertura depois do E2E; artefato `coverage-report` |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run test:coverage` | Testes verdes e resumo "Statements/Branches/Functions/Lines" |
| 2 | `npm run coverage:check` (sem mudanças) | ✅ arquivos e ✅ total |
| 3 | Crie `src/lib/x.ts` com uma função sem teste e rode 1 e 2 | ❌ `src/lib/x.ts: linhas 0%…`, código de saída 1 |
| 4 | PR no GitHub | Etapa "Conferir cobertura" com a tabela no resumo da execução; artefato `coverage-report` |

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `coverage-summary.json não existe` | `test:coverage` não rodou | Rode o passo 1 |
| Testes de integração falham com conexão recusada | Banco de teste fora do ar | `npm run db:up` |
| Arquivo "sem dados de cobertura" | Nenhum teste importa o arquivo | Escreva o teste do arquivo |
| Arquivo antigo cobrado só porque mudou 1 linha | É a regra: mexeu, testa | Escreva os testes (ou combine WAIVED por escrito com a Liza) |

## Referências

- [Jest — opções de cobertura](https://jestjs.io/docs/configuration#collectcoverage-boolean)
- [Jest — `projects`](https://jestjs.io/docs/configuration#projects-arraystring--projectconfig)
