# WIP: quadro de trabalho (Kanban)

> Estado de **todas** as tarefas. Quem atualiza: Scrum Master/PO (e cada agente
> ao mudar o estado da sua tarefa). Regras do quadro: `.agents/workflow.md`, seção 4.
> **Limites:** Em desenvolvimento ≤ 2 · Code Review ≤ 3 · QA ≤ 2.

**Último ID:** T-0024 · **Atualizado em:** 2026-11-20

## 🔴 Bloqueado

| ID | Tarefa | Motivo | Quem destrava |
|---|---|---|---|

## 🟣 Em desenvolvimento (≤ 2)

| ID | Tarefa | Tier | Dono | Desde |
|---|---|---|---|---|
| T-0020 a T-0024 | Pedido do `todo.md` (Actions, abas, Voltar, Construção, Nova obra, contexto) | @coding-2/3 | Claude | 2026-11-20 |
| ETAPAS 02–05 | Reestruturação Financeiro › Construção (grupos/categorias, abas, aria-current, backend) — `todo.md` | @coding-3 | Devin | 2026-11-20 |

> Uma branch (`feature/t-0020-financeiro-construcao`) para as 5 tarefas, a pedido da Liza.

## 🔵 Code Review (≤ 3)

| ID | Tarefa | PR | Revisor |
|---|---|---|---|

## 🟡 QA (≤ 2)

| ID | Tarefa | Gate |
|---|---|---|

## 🟢 Pronto p/ deploy

| ID | Tarefa | PR |
|---|---|---|
| T-0005 a T-0011, T-0016 a T-0019 | Agentes, Danger, PR automático, cards do Dashboard, abas, Voltar, cobertura, Prettier, release automático, Header | #11 (develop → main, aberto) |

## 📐 Pronto p/ dev

| ID | Tarefa | Tier | Pasta |
|---|---|---|---|

## ✍️ Especificação

| ID | Tarefa | Documento | Aguardando |
|---|---|---|---|

## 🔎 Análise

| ID | Tarefa | Analyst |
|---|---|---|

## 📥 Backlog

| ID | Tipo | Tarefa | Origem |
|---|---|---|---|
| T-0001 | chore | Testes automáticos das regras de auth sem teste (PLAT-R01 a R05: cadastro desligado, `isActive`, expiração, rate limit, cookie falso) | `docs/implementations/platform.md` |
| T-0002 | chore | Testes dedicados para FIN-R08, OBRA-R03, OBRA-R07 e OBRA-R08 | `docs/implementations/` |
| T-0003 | feature | Módulo PDI | `docs/todo.md` |
| T-0004 | feature | Módulo Release Control | `docs/todo.md` |
| T-0012 | chore | Cobertura ≥ 95%: Plataforma | T-0010 |
| T-0013 | chore | Cobertura ≥ 95%: Projetos | T-0010 |
| T-0014 | chore | Cobertura ≥ 95%: Financeiro | T-0010 |
| T-0015 | chore | Cobertura ≥ 95%: Obra | T-0010 |

## ✅ Concluído (últimas 10)

| ID | Tarefa | Concluída em | Registro |
|---|---|---|---|
| — | Financeiro → Obra (hoje Construção) | 2026-11-18 | `docs/CHANGELOG.md` |
| — | Financeiro | 2026-11-17 | `docs/CHANGELOG.md` |

## Como mover uma tarefa

1. Recorte a linha da coluna atual e cole na nova (preencha as colunas dela).
2. Atualize o campo **Estado** no `story.md` da tarefa.
3. Coluna cheia? Termine ou destrave algo antes de puxar outra tarefa.
