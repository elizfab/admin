# Spec: cards do dashboard no banco (T-0007)

> Spec Kit · feature nova. **O quê e por quê**, nunca o como.

## Contexto e objetivo

Hoje os atalhos do dashboard estão fixos no código. A Liza quer cadastrar, editar e excluir
os cards pela própria tela, sem deploy.

## Cenários de usuário (prioridade)

### P1 — cadastrar um card

```gherkin
Cenário: cadastrar o card de Release Control
  Dado que estou no Dashboard
  Quando clico em "Novo card" (canto superior direito, ao lado do título)
  E preencho Identificador "release-control", Título "Release Control",
    Descrição "Controle de versões e deploys.", Link "/release", Ícone "Foguete", Status "Em breve"
  E clico em "Salvar card"
  Então o modal fecha
  E vejo o card "Release Control" com o selo "Em breve" no dashboard

Cenário: identificador repetido
  Dado que já existe o card "financeiro"
  Quando cadastro outro card com o identificador "financeiro"
  Então vejo "Já existe um card com este identificador."
  E o que digitei continua no formulário
```

### P2 — editar e excluir

```gherkin
Cenário: editar o título
  Dado o card "Portal de Estudos"
  Quando clico em "Editar o card Portal de Estudos", troco o título para "Estudos e PDI" e salvo
  Então o card mostra "Estudos e PDI"

Cenário: excluir com confirmação
  Dado o card "Release Control"
  Quando clico em "Excluir o card Release Control"
  Então vejo a pergunta "Excluir card?"
  E só depois de confirmar o card some do dashboard
```

### P3 — isolamento e dados iniciais

```gherkin
Cenário: outra usuária não vê nem altera meus cards
  Dado um card da dona
  Quando a outra usuária lê, altera ou exclui esse card pela API
  Então recebe 404

Cenário: dashboard não fica vazio após o deploy
  Dado uma conta que já existia antes desta mudança
  Quando abro o Dashboard pela primeira vez depois do deploy
  Então vejo os 3 cards: "Portal de Documentação Dev", "Portal Financeiro" e "Portal de Estudos"
```

## Requisitos funcionais

| ID | Requisito | Cenários |
|---|---|---|
| FR-001 | O dashboard lista os cards da usuária da sessão, do mais antigo para o mais novo | P1 |
| FR-002 | Botão "Novo card" no canto superior direito do cabeçalho do Dashboard abre um modal com: Identificador, Título, Descrição, Link, Ícone (lista) e Status | P1 |
| FR-003 | Validação: identificador 2–40 (minúsculas, números e hífen), único por dona (409 "Já existe um card com este identificador."); título 2–60; descrição 2–160; link interno começando com `/` ou URL `https://`; ícone da lista; status padrão "Disponível" na criação | P1 |
| FR-004 | Após salvar, o modal fecha e o card aparece sem recarregar a página | P1 |
| FR-005 | Cada card tem "Editar" (modal preenchido; altera só o que mudou) | P2 |
| FR-006 | Cada card tem "Excluir" com confirmação | P2 |
| FR-007 | Card de outra usuária = 404 (tela e API) | P3 |
| FR-008 | API REST `/api/v1/dashboard/modules` (listar, criar) e `/:id` (ler, alterar, excluir) no contrato do projeto | P1–P3 |
| FR-009 | Contas existentes recebem os 3 cards atuais uma vez (migration); contas novas, pelo seed | P3 |
| FR-010 | Sem cards: mensagem "Nenhum card ainda." com o botão "Novo card" | P1 |
| FR-011 | Card com link `https://` abre em nova aba; link interno navega no portal | P1 |

## Entidades (vocabulário, sem tabela)

- **Card do dashboard:** atalho para um módulo. Identificador (slug), título, descrição, link, ícone, status (Disponível · Aplicação externa · Em breve), dona.

## Critérios de sucesso (mensuráveis)

- SC-001: cobertura ≥ 95% (linhas, comandos, ramos e funções) em cada arquivo novo ou alterado de `src/lib`, `src/modules` e `src/components` (T-0010).
- SC-002: axe sem violações no Dashboard e no modal aberto, nos dois temas.
- SC-003: E2E de isolamento: 404 para a outra usuária em ler, alterar e excluir.

## Fora de escopo

- Reordenar cards (arrastar); upload de ícone próprio; cards compartilhados entre usuárias.

## Perguntas abertas

- [x] Editar e excluir entram? Sim (Liza, 2026-11-19).
