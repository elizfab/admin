# Tarefas

Uma pasta por tarefa: `T-NNNN-<slug>/` (ver `.agents/workflow.md`, seção 3).

- Crie a pasta copiando os modelos de `.agents/templates/` que o tipo da tarefa usa.
- O estado de cada tarefa fica no `WIP.md` (raiz) e no `story.md` dela.
- Concluída (Gate G6): mova para `archive/AAAA-MM/`.
- Próximo ID: o maior `T-NNNN` do `WIP.md` + 1.

| Tipo | Arquivos |
|---|---|
| feature | `story.md`, `spec.md`, `plan.md`, `tasks.md`, `review.md`, `qa-gate.md` |
| change / bug / infra | `story.md`, `proposal.md`, `plan.md`, `tasks.md`, `review.md`, `qa-gate.md` |
| doc / chore | `story.md` (e `tasks.md` se tiver mais de um item) |
