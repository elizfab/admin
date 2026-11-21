# Agentes de IA no Admin

> Como o projeto usa agentes (Claude Code, GitHub Copilot, Devin) sem perder
> regras já validadas nem gastar token à toa.

| Arquivo | Conteúdo |
|---|---|
| [`AGENTS.md`](../../AGENTS.md) | Entrada universal (lida por todas as ferramentas; < 16 KB) |
| [`CLAUDE.md`](../../CLAUDE.md) | Importa o `AGENTS.md` + detalhes do Claude Code |
| [`.github/copilot-instructions.md`](../../.github/copilot-instructions.md) | Aponta o Copilot para o `AGENTS.md` |
| [`.claude/agents/`](../../.claude/agents/) | Subagentes (Claude Code e VS Code); cada um carrega o seu `.behaviour.md` |
| [`.agents/`](../../.agents/README.md) | Conteúdo real: contexto, fluxo, comportamentos, templates, tarefas |
| [`WIP.md`](../../WIP.md) | Quadro Kanban |
| [`docs/implementations/`](../implementations/README.md) | Regras já validadas por módulo |
| [`docs/CHANGELOG.md`](../CHANGELOG.md) | Histórico |
| [`graphify.md`](graphify.md) | Grafo do código para economizar token |

## 💡 Uma fonte, várias ferramentas

O conteúdo fica **uma vez** em `.agents/`. As ferramentas só recebem arquivos
curtos que apontam para lá. 💡 É como o regulamento original no cartório e as
cópias autenticadas na portaria: mudou o original, todas as cópias valem igual.
Duplicar o texto em cada ferramenta faria as regras divergirem no primeiro ajuste.

## Instalação (uma vez)

1. Copie o conteúdo deste pacote para a raiz do repositório, **substituindo** os arquivos antigos de `.agents/`.
2. O antigo `.agents/documentation.md` vira `.agents/documentation.behaviour.md`: apague o antigo.
3. Revise o diff do `AGENTS.md`: o bloco `nextjs-agent-rules` e a regra de tokens de tema foram **mantidos** como estavam.
4. No `.gitignore`, acrescente:

   ```gitignore
   # Graphify (grafo local; regenerável)
   graphify-out/
   ```

5. Siga o [`graphify.md`](graphify.md) para instalar e gerar o grafo.
6. Commit:

   ```bash
   git checkout -b feature/agents   # só branches feature/* são aceitas (Danger)
   git add AGENTS.md CLAUDE.md WIP.md .agents .claude .github/copilot-instructions.md .graphifyignore .gitignore .gitattributes docs/CHANGELOG.md docs/implementations docs/agents
   git commit -m "chore(agents): time de agentes BMAD, regras validadas e economia de tokens"
   ```

## Uso no dia a dia

| Quero… | Diga à ferramenta |
|---|---|
| Começar algo novo | "Orchestrator: nova demanda — …" |
| Continuar uma tarefa | "Continue a T-0007 como `<agente>`" |
| Corrigir um bug | "Orchestrator: bug — <sintoma>" (vai para Analyst → reprodução → teste vermelho) |
| Revisar um PR | "Code Review: revise o PR #N da T-0007" |
| Ver o quadro | Abra o `WIP.md` |
