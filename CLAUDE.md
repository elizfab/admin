# CLAUDE.md

@AGENTS.md

## Específico do Claude Code

- Subagentes do projeto: `.claude/agents/` (liste com `/agents`). Cada um carrega o seu `.agents/<agente>.behaviour.md`.
- Ao trocar de etapa dentro da mesma tarefa, use `/compact`; ao trocar de agente, prefira uma sessão nova e retome pela pasta da tarefa.
- Modelos: `@coding-1` usa `haiku`, `@coding-2` usa `sonnet`, `@coding-3` usa `opus` (definido em cada subagente).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. When the answer is under a Markdown heading, `graphify section "<heading>"` prints that section's text, so the .md need not be opened. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
