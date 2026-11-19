# WIP: quadro de trabalho (Kanban)

> Estado de **todas** as tarefas. Quem atualiza: Scrum Master/PO (e cada agente
> ao mudar o estado da sua tarefa). Regras do quadro: `.agents/workflow.md`, seção 4.
> **Limites:** Em desenvolvimento ≤ 2 · Code Review ≤ 3 · QA ≤ 2.

**Último ID:** T-0006 · **Atualizado em:** 2026-11-19

## 🔴 Bloqueado

| ID | Tarefa | Motivo | Quem destrava |
|---|---|---|---|

## 🟣 Em desenvolvimento (≤ 2)

| ID | Tarefa | Tier | Dono | Desde |
|---|---|---|---|---|

## 🔵 Code Review (≤ 3)

| ID | Tarefa | PR | Revisor |
|---|---|---|---|
| T-0005 | Correções nas docs (ADR-006/013, CHANGELOG, URL, exemplos) | Automático no push de `feature/bmad-agents` | Liza |
| T-0006 | Danger + PR automático para a develop (só `feature/*`) | Automático no push de `feature/bmad-agents` | Liza |

## 🟡 QA (≤ 2)

| ID | Tarefa | Gate |
|---|---|---|

## 🟢 Pronto p/ deploy

| ID | Tarefa | PR |
|---|---|---|

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

## ✅ Concluído (últimas 10)

| ID | Tarefa | Concluída em | Registro |
|---|---|---|---|
| — | Financeiro → Obra | 2026-11-18 | `docs/CHANGELOG.md` |
| — | Financeiro | 2026-11-17 | `docs/CHANGELOG.md` |

## Como mover uma tarefa

1. Recorte a linha da coluna atual e cole na nova (preencha as colunas dela).
2. Atualize o campo **Estado** no `story.md` da tarefa.
3. Coluna cheia? Termine ou destrave algo antes de puxar outra tarefa.
