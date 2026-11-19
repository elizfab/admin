# Instruções do GitHub Copilot: Admin

Siga o [`AGENTS.md`](../AGENTS.md) da raiz: ele é a fonte única das regras do
projeto (stack, regras invioláveis R1–R15, fluxo dos agentes e comandos).

- Agentes personalizados: o VS Code lê `.claude/agents/` (selecione no seletor do chat).
- Antes de alterar um módulo, leia `docs/implementations/<modulo>.md` (regras já validadas).
- Textos de tela, mensagens e documentação em português; sem cores fixas (tokens de tema).

## graphify

For any question about this repo's architecture, structure, components, or how to add/modify/find
code, your first action should be `graphify query "<question>"` when `graphify-out/graph.json`
exists. Use `graphify path "<A>" "<B>"` for relationship questions and `graphify explain "<concept>"`
for focused-concept questions. These return a scoped subgraph, usually much smaller than the full
report or raw grep output.

Triggers: "how do I…", "where is…", "what does … do", "add/modify a <component>",
"explain the architecture", or anything that depends on how files or classes relate.

If `graphify-out/wiki/index.md` exists, use it for broad navigation. Read `graphify-out/GRAPH_REPORT.md`
only for broad architecture review or when query/path/explain do not surface enough context. Only read
source files when (a) modifying/debugging specific code, (b) the graph lacks the needed detail, or
(c) the graph is missing or stale.

Type `/graphify` in Copilot Chat to build or update the graph.
