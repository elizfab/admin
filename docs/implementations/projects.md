# Projetos: regras validadas

| ID | Regra | Por quê | Protegida por |
|---|---|---|---|
| PROJ-R01 | Nome obrigatório, 3–100 caracteres, único **por dona** | Evita duplicados; nomes iguais entre usuárias são permitidos | `tests/unit/modules/projects/project.schema.test.ts`, `tests/integration/project.repository.test.ts` |
| PROJ-R02 | Nome duplicado → 409 "Já existe um projeto com este nome." | Mensagem clara em vez de erro do banco | `tests/unit/modules/projects/project.service.test.ts` |
| PROJ-R03 | Descrição opcional até 500; URL do repositório opcional, só `https://` | Dados limpos; sem `http://` ou `javascript:` | `project.schema.test.ts` |
| PROJ-R04 | Status padrão `PLANNED` só na criação; PATCH parcial não muda campos omitidos | `.partial()` sem default | `project.schema.test.ts` |
| PROJ-R05 | Projeto de outra usuária → 404 em tela e API (ler, alterar, excluir) | Isolamento (não revela existência) | `tests/e2e/isolation.spec.ts` |
| PROJ-R06 | Excluir pede confirmação (diálogo) | Ação irreversível | `tests/e2e/projects.spec.ts` |
