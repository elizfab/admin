# Agentes do Admin

Time de agentes especializados que trabalham **no mesmo fluxo** (BMAD), seja no
Claude Code, no GitHub Copilot ou no Devin.

| Arquivo | Para quê |
|---|---|
| [`project-context.md`](project-context.md) | Stack, arquitetura, regras invioláveis R1–R15, API, comandos. **Todo agente lê** |
| [`workflow.md`](workflow.md) | Ciclo BMAD, qual método usar, Kanban, gates, tiers e handoff |
| [`token-economy.md`](token-economy.md) | Regras para gastar menos token (inclui o Graphify) |
| `*.behaviour.md` | Comportamento de cada agente |
| [`templates/`](templates/) | Modelos de `story`, `spec`, `proposal`, `plan`, `tasks`, `review`, `qa-gate` |
| [`tasks/`](tasks/) | Uma pasta por tarefa (`T-NNNN-slug`) |

## O time

| Agente | Arquivo | Responsabilidade | Método principal |
|---|---|---|---|
| Orchestrator | [`orchestrator.behaviour.md`](orchestrator.behaviour.md) | Recebe a demanda, classifica e roteia | BMAD |
| Analyst | [`analyst.behaviour.md`](analyst.behaviour.md) | Investigar problemas, levantar contexto e requisitos | BMAD |
| PM | [`pm.behaviour.md`](pm.behaviour.md) | Definir escopo, requisitos e histórias | Spec Kit · OpenSpec · BDD |
| Architect | [`architect.behaviour.md`](architect.behaviour.md) | Arquitetura, contratos, padrões, decisões e tier | Spec Kit (plan) · ADR |
| Scrum Master / PO | [`scrum-master.behaviour.md`](scrum-master.behaviour.md) | Organizar tarefas, fluxo, backlog e acompanhamento | Kanban |
| Developer (base) | [`developer.behaviour.md`](developer.behaviour.md) | Regras comuns de implementação | TDD |
| `@coding-1` | [`coding-1.behaviour.md`](coding-1.behaviour.md) | Tarefas pequenas e de baixo risco | TDD |
| `@coding-2` | [`coding-2.behaviour.md`](coding-2.behaviour.md) | Features e mudanças dentro de um módulo | TDD |
| `@coding-3` | [`coding-3.behaviour.md`](coding-3.behaviour.md) | Mudanças complexas, transversais e de alto risco | TDD |
| Tester | [`tester.behaviour.md`](tester.behaviour.md) | Escrever os testes a partir dos critérios (antes do código) | TDD/BDD |
| QA / TEA | [`qa.behaviour.md`](qa.behaviour.md) | Estratégia de testes, cobertura, rastreabilidade e gate | TDD/BDD |
| Code Review | [`code-review.behaviour.md`](code-review.behaviour.md) | Revisar alterações, encontrar riscos e regressões | — |
| DevOps | [`devops.behaviour.md`](devops.behaviour.md) | CI, migrations, variáveis, deploy e rollback | OpenSpec |
| Documentation | [`documentation.behaviour.md`](documentation.behaviour.md) | CHANGELOG, implementations, setup e ADR | OpenSpec (archive) |

💡 **Tester × QA:** o Tester **escreve** os testes (mão na massa, antes do
código); o QA/TEA **decide** se o conjunto de testes é suficiente e libera o
gate. É a diferença entre quem faz a prova e quem corrige a prova.

## Como chamar um agente

| Ferramenta | Como |
|---|---|
| **Claude Code** | Subagentes em `.claude/agents/` (`/agents` lista). Ex.: "use o agente analyst para investigar …" |
| **GitHub Copilot (VS Code)** | O VS Code também lê `.claude/agents/`: escolha o agente no seletor do chat |
| **Devin** | Lê o `AGENTS.md` da raiz. Comece a sessão com: "Atue como `<agente>` conforme `.agents/<agente>.behaviour.md`, tarefa `T-NNNN`" |
| Qualquer outra | Cole: "Leia `.agents/project-context.md`, `.agents/workflow.md` e `.agents/<agente>.behaviour.md`" |

## Começando uma demanda

```text
"Orchestrator: nova demanda — <descrição>."
```

O Orchestrator cria `.agents/tasks/T-NNNN-<slug>/story.md`, coloca a tarefa no
`WIP.md` (Backlog) e diz qual agente vem a seguir.
