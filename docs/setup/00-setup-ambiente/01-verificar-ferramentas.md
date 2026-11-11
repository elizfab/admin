# Passo 01 — Verificar ferramentas

> **Fase:** 00 — Setup do Ambiente\
> **Tempo estimado:** 10 min\
> **Depende de:** nada (primeiro passo)

## Objetivo

Confirmar que Node.js, npm, Git e o editor estão instalados nas versões que
o projeto exige.

## 💡 Por que

- **Node.js** é o “motor” que executa o Next.js, os testes e as ferramentas de
  linha de comando. Cada biblioteca exige uma versão mínima: o Next.js 16 pede
  20.9+, e o Prisma 7 (Fase 02) pede **20.19+**. Adotar a versão mais exigente
  desde já evita trocar de motor no meio da viagem.
- **npm** é o gerenciador de pacotes: instala as dependências listadas no
  `package.json` e grava as versões exatas no `package-lock.json`.
- **Git** registra o histórico do projeto. A identidade (`user.name` e
  `user.email`) aparece em cada commit.

## Pré-requisitos

- Acesso a um terminal (bash ou zsh).

## Passo a passo

### 1. Verificar as versões

```bash
node --version
npm --version
git --version
```

O Node.js deve mostrar **v20.19.0 ou superior** (recomendado: a LTS mais
recente, por exemplo v22 ou v24).

> Se a versão for menor, atualize o Node.js. Com o `nvm`:
>
> ```bash
> nvm install --lts
> nvm use --lts
> nvm alias default 'lts/*'
> ```

### 2. Conferir a identidade do Git

```bash
git config --global user.name
git config --global user.email
```

Se algum comando não retornar nada, configure:

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

Defina também `main` como nome padrão de branch:

```bash
git config --global init.defaultBranch main
```

### 3. Extensões do VS Code

| Extensão | Uso | Quando |
|---|---|---|
| ESLint (`dbaeumer.vscode-eslint`) | Mostra erros de lint no editor | Agora |
| SCSS IntelliSense (`mrmlnc.vscode-scss`) | Autocompletar variáveis e mixins SCSS | Agora (opcional) |
| EditorConfig (`EditorConfig.EditorConfig`) | Padroniza indentação | Opcional |
| GitLens (`eamodio.gitlens`) | Histórico do Git no editor | Opcional |
| Prisma (`Prisma.prisma`) | Sintaxe do `schema.prisma` | Fase 02 |

> O projeto **não adota Prettier** nesta fase (ver ARCHITECTURE.md, seção 4.1).
> Se for adotado depois, será um passo próprio.

## Arquivos criados ou alterados

Nenhum arquivo do projeto. Apenas configurações globais do Git, se necessário.

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `node --version` | `v20.19.0` ou superior |
| 2 | `npm --version` | Uma versão é exibida (ex.: `10.x`) |
| 3 | `git config --global user.email` | Seu e-mail |
| 4 | `git config --global init.defaultBranch` | `main` |

**Critério de aceite:** os quatro testes acima retornam o esperado.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `node: command not found` | Node.js não instalado ou fora do `PATH` | Instalar via `nvm` e abrir um novo terminal |
| Versão antiga mesmo após instalar | O terminal usa outra instalação | `nvm use --lts` e `nvm alias default 'lts/*'` |

## Referências

- [Next.js — requisitos de sistema](https://nextjs.org/docs/app/getting-started/installation)
- [Node.js — downloads e LTS](https://nodejs.org/)

---

[Índice da fase](README.md) · [Próximo passo](02-preparar-pasta-e-git.md) →
