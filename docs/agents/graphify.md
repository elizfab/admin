# Graphify: grafo do código para gastar menos token

> **Objetivo:** os agentes consultam um **mapa** do projeto (quem chama quem,
> onde mora cada regra) em vez de reler arquivos a cada pergunta.\
> **Ferramenta:** [Graphify](https://github.com/safishamsi/graphify) (pacote `graphifyy` no PyPI; comando `graphify`).\
> **Verificado em:** 19/11/2026. A ferramenta evolui rápido: confira `graphify --help` antes de seguir.

## 💡 Por que um grafo economiza token

Sem grafo, para responder "onde o pagamento da obra cria o lançamento?", o
agente faz várias buscas e abre vários arquivos inteiros. Com o grafo, ele lê um
resumo (`GRAPH_REPORT.md`) e pede só o caminho entre dois nós.

💡 É a diferença entre procurar uma rua andando por todas as quadras e olhar o
mapa da cidade. O mapa é desenhado **uma vez** e atualizado quando algo muda.

| Parte do projeto | Como o Graphify lê | Custo |
|---|---|---|
| Código (`.ts`, `.tsx`, `.prisma`…) | Árvore de sintaxe (tree-sitter), **localmente** | Sem chamada a modelo |
| Docs, PDFs, imagens | Extração semântica pelo modelo da sua ferramenta | **Gasta token** na construção |

Por isso a configuração abaixo **exclui** as docs grandes de passo a passo: elas
custariam token para entrar no grafo e quase não ajudam a navegar no código.

## Pré-requisitos

- Python 3.10+ (no WSL: `python3 --version`).
- `pipx` (`sudo apt install pipx && pipx ensurepath`) ou `uv`.

## Passo a passo

### 1. Instalar

```bash
pipx install graphifyy        # ou: uv tool install graphifyy
graphify --version
```

### 2. Registrar o skill em cada ferramenta

| Ferramenta | Comando | O que faz |
|---|---|---|
| Claude Code | `graphify install` | Instala o skill `/graphify` |
| GitHub Copilot CLI | `graphify install --platform copilot` | Instala o skill no Copilot CLI |
| VS Code Copilot Chat | `graphify vscode install` | Configura o Copilot Chat do VS Code |
| Devin | — | O Devin lê o `AGENTS.md`; a instrução de usar o grafo já está lá (seção "Economia de tokens") |

### 3. Excluir o que não deve entrar no grafo

Crie `.graphifyignore` na raiz (mesma sintaxe do `.gitignore`); o arquivo já vem
neste pacote. O essencial:

```gitignore
node_modules/
.next/
src/generated/
coverage/
playwright-report/
test-results/
playwright/.auth/
.portal/
public/
package-lock.json
docs/setup/
docs/**/*.drawio
.agents/tasks/archive/
graphify-out/
```

### 4. Construir o grafo (uma vez)

No Claude Code (ou Copilot), na raiz do projeto:

```text
/graphify .
```

Saída em `graphify-out/`:

| Arquivo | Para quê |
|---|---|
| `GRAPH_REPORT.md` | Resumo: nós centrais, comunidades (módulos), conexões inesperadas. **O agente lê isto primeiro** |
| `graph.json` | O grafo completo (consultado pelos comandos `query`/`path`/`explain`) |
| `graph.html` | Visualização interativa (abra no navegador) |
| `cache/` | Cache por hash: reconstruções só processam o que mudou |

### 5. Fazer os agentes usarem o grafo sempre

```bash
graphify claude install    # Claude Code: seção no CLAUDE.md + hook antes de buscas
graphify vscode install    # VS Code Copilot Chat
graphify copilot install   # Copilot CLI
```

⚠️ O `graphify claude install` grava os hooks em `.claude/settings.json` com o **caminho absoluto**
da sua máquina. Mova para o arquivo pessoal (fora do git):
`mv .claude/settings.json .claude/settings.local.json`.

⚠️ O `graphify claude install` **acrescenta** uma seção ao `CLAUDE.md`. Revise o
diff antes do commit: o `CLAUDE.md` deste projeto só importa o `AGENTS.md`, e a
seção do Graphify deve ficar no fim.

### 6. Manter o grafo atualizado (sem gastar token)

```bash
graphify hook install      # reconstrói após cada commit e troca de branch
graphify update ./src      # manual: reextrai o código, sem modelo
graphify watch ./src       # opcional: terminal em segundo plano durante o dev
```

Docs mudaram muito (ex.: nova fase)? Rode `/graphify . --update` na ferramenta
(processa só os arquivos alterados).

### 7. Consultas que os agentes devem usar

```bash
graphify query "onde o pagamento da obra cria a transação?"
graphify path "registerServicePayment" "transactionRepository"
# (o model "Transaction" do Prisma não está no grafo: src/generated/ é ignorado)
graphify explain "getConstructionDashboard"
```

### 8. Versionar ou não

Acrescente ao `.gitignore`:

```gitignore
# Graphify (grafo local; regenerável)
graphify-out/
```

💡 O repositório é **público**: o grafo mostra a estrutura inteira do projeto
e se regenera em segundos a partir do código. Cada máquina (e cada agente
na nuvem) constrói o seu.

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `graphify --version` | Mostra a versão |
| 2 | `/graphify .` | Cria `graphify-out/GRAPH_REPORT.md` com comunidades como `finance`, `construction`, `projects`, `auth` |
| 3 | `graphify query "isolamento por ownerId"` | Aponta os repositórios dos módulos |
| 4 | Commit qualquer | O hook atualiza `graphify-out/` |
| 5 | `git status` | `graphify-out/` não aparece |

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `externally-managed-environment` no `pip install` | Python do sistema protegido | Use `pipx` ou `uv tool install` |
| `graphify: command not found` | Pasta do pipx fora do `PATH` | `pipx ensurepath` e abra um terminal novo |
| Construção cara (muitos tokens) | Docs grandes entraram no grafo | Confira o `.graphifyignore` (item 3) |
| Grafo desatualizado | Hook não instalado | `graphify hook install` |

## Referências

- [Graphify — repositório](https://github.com/safishamsi/graphify)
- [Graphify — instalação e plataformas (fork com a tabela de plataformas)](https://github.com/TOOTW/graphify)
