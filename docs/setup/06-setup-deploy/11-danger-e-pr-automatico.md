# Passo 11 — Danger e PR automático

> **Fase:** 06 — Repositório, CI, Deploy e Operação\
> **Tempo estimado:** 20 min\
> **Depende de:** [Passo 05 — CI no GitHub Actions](05-ci-github-actions.md)

## Objetivo

> Atualizado em 2026-11-19 (T-0016): o merge na `develop` também abre o PR de release para a `main`.

Ao dar `git push` numa branch `feature/*`, o GitHub valida o nome da branch,
**abre sozinho o PR para a `develop`** e roda o Danger e a CI nele. Branch de
outro tipo é recusada com uma mensagem clara.

## 💡 Por que

É a **portaria do condomínio**: quem chega com o crachá certo (`feature/*`)
entra e já é anunciado (o PR aparece pronto); quem chega com outro crachá é
barrado na entrada, com o motivo escrito. Ninguém precisa ir até a portaria
abrir o portão (clicar em "Create pull request").

Tecnicamente:

- **Danger** roda em todo PR e comenta nele: **bloqueia** (❌) branch fora do
  fluxo e **avisa** (⚠️) quando o código mudou sem `docs/CHANGELOG.md`/`WIP.md`
  ou quando há migration (R15).
- O fluxo aceito é **`feature/<slug>` → `develop` → `main`**. A regra mora em um
  lugar só, `scripts/branch-rules.ts`, usada pelo Danger **e** pelo PR automático.
- PR criado com o `GITHUB_TOKEN` **não dispara** outros workflows (regra do
  GitHub contra loops). Por isso o workflow "PR automático" roda o Danger e a CI
  ele mesmo no PR que acabou de abrir. Nos pushes seguintes, os workflows
  `Danger` e `CI` rodam normalmente pelo evento `pull_request`.

## Pré-requisitos

- CI do passo 05 funcionando.
- Em **Settings → Actions → General → Workflow permissions**, a opção
  **"Allow GitHub Actions to create and approve pull requests"** marcada
  (já está; confira com `gh api repos/elizfab/admin/actions/permissions/workflow`:
  `"can_approve_pull_request_reviews": true`).

## Passo a passo

### 1. Instalar o Danger

```bash
npm install -D danger@14.1.0
```

### 2. Regras de branch (com testes)

- `scripts/branch-rules.ts`: `checkPushBranch` (push) e `checkPullRequest` (PR).
- `tests/unit/scripts/branch-rules.test.ts`: 18 casos (aceitos e recusados).
- `scripts/check-branch.ts`: CLI usado no workflow (`npx tsx scripts/check-branch.ts <branch>`).

### 3. Dangerfile

`dangerfile.ts` (raiz) importa `checkPullRequest` e adiciona os avisos do
Definition of Done.

### 4. Workflows

| Workflow | Dispara em | Faz |
|---|---|---|
| `.github/workflows/auto-pr.yml` | `push` em qualquer branch, exceto `main`/`develop` | Valida a branch → abre o PR para a `develop` (se não existe) → roda Danger e CI no PR novo |
| `.github/workflows/release-pr.yml` | `push` na `develop` (merge de uma feature) | Abre o PR `develop → main` ("Release: develop → main (data)") se não existe; se existe, atualiza a lista do que entra. No PR novo, roda Danger e CI. **O merge na `main` continua manual** (é a decisão de publicar) |
| `.github/workflows/danger.yml` | `pull_request` (aberto, novo push, reaberto, editado) | Danger |
| `.github/workflows/ci.yml` | `push` na `main`, `pull_request` e `workflow_call` | Pipeline completo (agora também chamável pelo PR automático) |

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `scripts/branch-rules.ts` | Criado | Regra única do fluxo de branches |
| `scripts/check-branch.ts` | Criado | Valida a branch no workflow (sai com erro e anotação) |
| `tests/unit/scripts/branch-rules.test.ts` | Criado | Testes da regra |
| `dangerfile.ts` | Criado | Regras do Danger |
| `.github/workflows/auto-pr.yml` | Criado | PR automático |
| `.github/workflows/danger.yml` | Criado | Danger em todo PR |
| `.github/workflows/ci.yml` | Alterado | Gatilho `workflow_call` |
| `package.json`, `package-lock.json` | Alterado | `danger` em `devDependencies` |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npx jest tests/unit/scripts` | 18 testes verdes |
| 2 | `npx tsx scripts/check-branch.ts fix/x` | `::error title=Branch não aceita::…` e código de saída 1 |
| 3 | `GITHUB_TOKEN=$(gh auth token) npx danger pr https://github.com/elizfab/admin/pull/7` | Falha: PR de `docs/…` para a `develop` |
| 4 | `git push -u origin feature/<slug>` (com commits novos) | Em **Actions → PR automático**: 4 jobs verdes; PR aberto para a `develop` com comentário do Danger |
| 5 | Novo `git push` na mesma branch | "PR #N já está aberto"; workflows `Danger` e `CI` rodam no PR |
| 6 | `git push` de uma branch `fix/teste` | Job "Validar tipo de branch" ❌ com o motivo; nenhum PR aberto |
| 7 | Merge de um PR de feature na `develop` | Em **Actions → PR de release**: PR `develop → main` aberto (ou com a lista atualizada), com Danger e CI |
| 8 | Outro merge na `develop` com o PR de release aberto | O mesmo PR recebe os commits; a seção "O que entra na produção" ganha a linha nova |

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `GitHub Actions is not permitted to create or approve pull requests` | Opção de permissão desligada | Ligue em Settings → Actions → General (pré-requisitos) |
| PR não abre e o resumo diz "sem commits novos" | Branch igual à `develop` | Faça um commit e envie de novo |
| Danger não comenta no PR aberto à mão | O workflow `Danger` só existe na branch depois do merge desse passo | Normal até o merge na `develop` |
| Branch `feat/…` recusada | O padrão aceito é `feature/…` | `git branch -m feat/x feature/x` |

## Referências

- [Danger JS — GitHub Actions](https://danger.systems/js/usage/ci/github-actions)
- [GitHub — eventos disparados pelo `GITHUB_TOKEN`](https://docs.github.com/actions/security-for-github-actions/security-guides/automatic-token-authentication#using-the-github_token-in-a-workflow)
- [GitHub — reutilizar workflows (`workflow_call`)](https://docs.github.com/actions/using-workflows/reusing-workflows)
