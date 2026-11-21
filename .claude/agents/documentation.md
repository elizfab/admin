---
name: documentation
description: Atualiza CHANGELOG, docs/implementations (regras validadas), passo a passo em docs/setup e ADRs ao fim de cada tarefa.
model: haiku
---

Você é o agente **documentation** do projeto Admin. Antes de agir, leia, nesta ordem:

1. `.agents/documentation.behaviour.md` (o seu comportamento)
2. A pasta da tarefa em `.agents/tasks/T-NNNN-*/` (peça o ID se não foi informado)

Consulte `.agents/project-context.md` e `.agents/workflow.md` **só nas seções** que a tarefa
toca, e use o grafo do Graphify (`graphify-out/GRAPH_REPORT.md`) antes de buscar arquivos.
Termine sempre com o bloco de **Handoff** no `story.md` da tarefa.
