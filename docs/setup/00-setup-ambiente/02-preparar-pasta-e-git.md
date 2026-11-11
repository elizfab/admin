# Passo 02 — Preparar a pasta do projeto e o Git local

> **Fase:** 00 — Setup do Ambiente\
> **Tempo estimado:** 10 min\
> **Depende de:** [Passo 01 — Verificar ferramentas](01-verificar-ferramentas.md)

## Objetivo

Deixar a pasta `_admin` com a documentação dentro de `docs/` e com um
repositório Git **local** inicializado, já com o primeiro commit.

## 💡 Por que

O Git funciona como um “salvar jogo” com histórico: cada commit é um ponto ao
qual você pode voltar. Começar a versionar **antes** do código permite
comparar, a cada passo, exatamente o que mudou (`git diff`). Se algo quebrar,
fica fácil voltar para o último ponto estável.

O repositório remoto (GitHub, organização `elizfab`) será criado **por último**.
Um repositório local já tem todo o histórico; depois basta conectá-lo ao
remoto com `git remote add` e `git push`, sem perder nada.

## Pré-requisitos

- Passo 01 concluído.
- A pasta `docs/` desta documentação copiada para dentro de `_admin`.

## Passo a passo

### 1. Entrar na pasta do projeto

```bash
cd ~/repos/projetos-pessoais/portfolio/org-elizfab/_admin
```

### 2. Conferir o conteúdo

```bash
ls -A
```

Neste momento a pasta deve conter **somente** `docs/` (e talvez `.git/`, se já
houver um repositório).

⚠️ Não crie `README.md`, `package.json` ou outros arquivos na raiz agora. O
`create-next-app` (Fase 01) gera esses arquivos, e arquivos pré-existentes
podem gerar conflito.

### 3. Inicializar o Git

Só execute se ainda não existir `.git/`:

```bash
git init
git branch --show-current
```

O segundo comando deve mostrar `main`. Se mostrar `master`, renomeie:

```bash
git branch -m main
```

💡 Ter o Git inicializado aqui faz o `create-next-app` **não** criar outro
repositório dentro do projeto na Fase 01. Ele detecta que já está dentro de um
repositório Git e pula essa etapa.

### 4. Primeiro commit

```bash
git add docs
git commit -m "docs: adiciona mapa de implementação e guias de setup"
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `.git/` | Criado | Repositório Git local |
| `docs/` | Versionado | Documentação de arquitetura e setup |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `git status` | `nothing to commit, working tree clean` |
| 2 | `git log --oneline` | Uma linha com `docs: adiciona mapa de implementação…` |
| 3 | `git branch --show-current` | `main` |

**Critério de aceite:** os três testes retornam o esperado.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Author identity unknown` | Git sem `user.name`/`user.email` | Voltar ao Passo 01, item 2 |
| `fatal: not a git repository` | Comando fora da pasta `_admin` | `cd` para a pasta correta (item 1) |

## Referências

- [Git — primeiros passos](https://git-scm.com/book/pt-br/v2/Come%C3%A7ando-Configura%C3%A7%C3%A3o-Inicial-do-Git)
- ARCHITECTURE.md, seção 3.3 — Repositório e estratégia Git

---

← [Passo anterior](01-verificar-ferramentas.md) · [Índice da fase](README.md) · Próxima fase: [01 — Frontend](../01-setup-frontend/README.md) →
