# WIP: quadro de trabalho (Kanban)

> Estado de **todas** as tarefas. Quem atualiza: Scrum Master/PO (e cada agente
> ao mudar o estado da sua tarefa). Regras do quadro: `.agents/workflow.md`, seção 4.
> **Limites:** Em desenvolvimento ≤ 2 · Code Review ≤ 3 · QA ≤ 2.

**Último ID:** T-0018 · **Atualizado em:** 2026-11-19

## 🔴 Bloqueado

| ID | Tarefa | Motivo | Quem destrava |
|---|---|---|---|

## 🟣 Em desenvolvimento (≤ 2)

| ID | Tarefa | Tier | Dono | Desde |
|---|---|---|---|---|

## 🔵 Code Review (≤ 3)

| ID | Tarefa | PR | Revisor |
|---|---|---|---|
| T-0007 | Cards do dashboard no banco (cadastrar, editar, excluir) | Automático no push de `feature/t-0007-dashboard-financeiro-cobertura` | Liza |
| T-0008 | Financeiro em abas (Transações \| Obra) | mesmo PR | Liza |
| T-0009 | "Voltar ao início" nas páginas de módulo | mesmo PR | Liza |
| T-0010 | Cobertura na CI (≥ 95% no código novo) | mesmo PR | Liza |
| T-0011 | Prettier + formatação automática | mesmo PR | Liza |
| T-0016 | PR automático develop → main | mesmo PR | Liza |
| T-0017 | Mover ALTERACOES-2026-11-15.md para docs | mesmo PR | Liza |
| T-0018 | Tabela de cobertura no `npm test` | mesmo PR | Liza |

> ⚠️ 8 tarefas em Code Review (limite 3): exceção pedida pela Liza (uma branch para várias resoluções, 2026-11-19); um PR só.

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
| T-0012 | chore | Cobertura ≥ 95%: Plataforma | T-0010 |
| T-0013 | chore | Cobertura ≥ 95%: Projetos | T-0010 |
| T-0014 | chore | Cobertura ≥ 95%: Financeiro | T-0010 |
| T-0015 | chore | Cobertura ≥ 95%: Obra | T-0010 |

## ✅ Concluído (últimas 10)

| ID | Tarefa | Concluída em | Registro |
|---|---|---|---|
| T-0006 | Danger + PR automático (PR #9) | 2026-11-19 | `docs/CHANGELOG.md` |
| T-0005 | Correções nas docs (PR #9) | 2026-11-19 | `docs/CHANGELOG.md` |
| — | Financeiro → Obra | 2026-11-18 | `docs/CHANGELOG.md` |
| — | Financeiro | 2026-11-17 | `docs/CHANGELOG.md` |

## Como mover uma tarefa

1. Recorte a linha da coluna atual e cole na nova (preencha as colunas dela).
2. Atualize o campo **Estado** no `story.md` da tarefa.
3. Coluna cheia? Termine ou destrave algo antes de puxar outra tarefa.
