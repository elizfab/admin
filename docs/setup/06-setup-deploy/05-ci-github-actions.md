# Passo 05 — CI no GitHub Actions e fluxo de trabalho

> **Fase:** 06 — Deploy\
> **Tempo estimado:** 45 min\
> **Depende de:** [Passo 04](04-repositorio-github.md)

## Objetivo

Rodar **automaticamente**, a cada push na `main` e em todo pull request,
tudo o que você roda à mão: typecheck, lint, testes unitários, E2E e de
integração. E combinar um fluxo de trabalho com branches e PRs.

## 💡 Por que

O CI (*Continuous Integration*) é um **colega incansável** que, a cada
mudança, roda a bateria inteira numa máquina limpa e coloca ✅ ou ❌ no
commit. Ele pega o “funciona na minha máquina” e o “esqueci de rodar o
E2E”.

### O que o workflow faz

| Etapa | Por quê |
|---|---|
| `services: postgres` | Sobe um PostgreSQL só para o job, com o banco `admin_test` |
| `setup-node` com `node-version-file: .nvmrc` | A mesma versão do Node do projeto e da Vercel |
| `cache: npm` | Reaproveita downloads entre execuções (mais rápido) |
| `npm ci` | Instala **exatamente** o `package-lock.json` e gera o Prisma Client |
| E2E **antes** da integração | O global setup do E2E cria e migra o `admin_test`, que a integração reutiliza |
| `upload-artifact` se falhar | O relatório do Playwright fica disponível para download por 7 dias |
| `concurrency` | Um push novo cancela a execução antiga do mesmo branch |
| `permissions: contents: read` | Princípio do menor privilégio: o job só **lê** o código |

💡 No CI, a variável `CI=true` é definida automaticamente. O
`playwright.config.ts` já reage a ela: 2 tentativas por teste, sem
reaproveitar servidor e erro se alguém esquecer um `test.only`.

### ⚠️ Branch protection não está disponível no seu cenário

O GitHub só permite **branch protection** e **rulesets** em repositório
**privado** nos planos pagos (Pro, Team, Enterprise). Em uma organização no
GitHub Free, com repositório privado, **não dá para bloquear** o merge com o
CI vermelho. O fluxo abaixo compensa isso com disciplina.

## Pré-requisitos

- Passo 04 concluído.

## Passo a passo

### 1. Workflow de CI

```bash
mkdir -p .github/workflows
```

`.github/workflows/ci.yml`:

```text
# Integração contínua: roda a cada push na main e em todo pull request.
# Se qualquer etapa falhar, o commit/PR fica marcado com ❌ no GitHub.
name: CI

on:
  push:
    branches: [main]
  pull_request:

# Cancela execuções antigas do mesmo branch quando chega um push novo.
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  quality:
    name: Qualidade e testes
    runs-on: ubuntu-latest
    timeout-minutes: 20

    # PostgreSQL só para os testes (mesma versão do docker-compose local).
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: admin_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10

    steps:
      - name: Baixar o código
        uses: actions/checkout@v4

      - name: Instalar Node.js (versão do .nvmrc)
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Instalar dependências (gera o Prisma Client no postinstall)
        run: npm ci

      - name: Verificar tipos
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Testes unitários
        run: npm test

      - name: Instalar o Chromium do Playwright
        run: npx playwright install --with-deps chromium

      # O global setup do E2E cria/migra o banco admin_test e as contas de teste.
      - name: Testes E2E
        run: npm run test:e2e

      - name: Testes de integração
        run: npm run test:integration

      - name: Guardar o relatório do Playwright (se algo falhar)
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### 2. Enviar e acompanhar

```bash
git add .github/workflows/ci.yml
git commit -m "ci: adiciona workflow de integração contínua"
git push
```

No GitHub: aba **Actions** → **CI** → acompanhe as etapas. A primeira
execução leva alguns minutos (download do Chromium e build).

### 3. Selo de status no README (opcional)

No `README.md` do projeto, abaixo do título:

```markdown
[![CI](https://github.com/elizfab/personal-platform-admin/actions/workflows/ci.yml/badge.svg)](https://github.com/elizfab/personal-platform-admin/actions/workflows/ci.yml)
```

### 4. Fluxo de trabalho recomendado

```text
main ─────●──────────────●────────── (sempre publicável)
           \            /
            ●──●──●────●  feature/nome  → PR → CI ✅ + preview OK → merge
```

1. Para cada mudança: `git switch -c feature/nome-curto` (ou `fix/…`, `docs/…`).
2. Commits pequenos, com mensagens no padrão já usado (`feat:`, `fix:`, `test:`…).
3. `git push -u origin feature/nome-curto` e abra o **Pull Request**.
4. Espere o **CI ✅** e teste o **preview** da Vercel (passo 08).
5. **Merge** (prefira *Squash and merge* para um histórico limpo).
6. Nunca faça push direto na `main`, mesmo podendo (regra combinada consigo mesma).

> Se um dia o repositório for para um plano pago, ative em **Settings →
> Rules → Rulesets** a regra *Require status checks to pass* com o check
> **Qualidade e testes**.

### 5. Consumo de minutos

Repositórios privados no GitHub Free têm uma cota mensal de minutos de
Actions (confira em **Settings → Billing**). Uma execução completa deste CI
leva poucos minutos; para um projeto individual, a cota costuma sobrar.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `.github/workflows/ci.yml` | Criado | Integração contínua |
| `README.md` | Alterado (opcional) | Selo de status |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Aba **Actions** após o push | Job **Qualidade e testes** com ✅ |
| 2 | **Prova do alarme:** num branch `test/ci-alarme`, quebre um teste (ex.: troque `"Financeiro"` em `navigation.ts`), faça push e abra um PR | O PR mostra **❌**, e o relatório do Playwright fica em *Artifacts*. Feche o PR sem merge e apague o branch |

**Critério de aceite:** os dois testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `npm ci` falha com `package-lock.json` desatualizado | Instalou um pacote sem commitar o lock | `npm install`, commit do `package-lock.json` |
| E2E falha só no CI, com timeout | Máquina do CI mais lenta | Baixar o relatório em *Artifacts* e ver o trace; o config já tem 2 retries |
| `database "admin_test" does not exist` na integração | A ordem das etapas mudou | O E2E precisa rodar **antes** da integração |

## Referências

- [GitHub Actions — Workflow syntax](https://docs.github.com/pt/actions/writing-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions — Service containers (PostgreSQL)](https://docs.github.com/pt/actions/use-cases-and-examples/using-containerized-services/creating-postgresql-service-containers)
- [Playwright — Continuous Integration](https://playwright.dev/docs/ci)
- [GitHub — About protected branches (disponibilidade por plano)](https://docs.github.com/pt/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

---

← [Passo anterior](04-repositorio-github.md) · [Índice da fase](README.md) · [Próximo passo](06-bancos-supabase.md) →
