# Fluxo de trabalho dos agentes (BMAD + Spec Kit + OpenSpec + TDD/BDD + Kanban)

> Como uma demanda vira código em produção **sem regressão**. Cada método tem um
> lugar fixo no fluxo; nenhum agente pula etapa sem registrar o motivo na tarefa.

## 1. O ciclo (BMAD)

```text
 Demanda
   │
   ▼
 [Orchestrator] classifica: tipo (feature | mudança | bug | doc | infra) e tamanho
   │
   ├─ Análise ────────── [Analyst]    contexto, problema, impacto, perguntas    → story.md (seção Análise)
   ├─ Especificação ──── [PM]         escopo, requisitos, critérios BDD          → spec.md (Spec Kit) ou proposal.md (OpenSpec)
   ├─ Desenho ────────── [Architect]  contratos, dados, camadas, riscos, tier    → plan.md (+ ADR se decisão nova)
   ├─ Quebra ─────────── [Scrum Master/PO] tarefas pequenas, tier de cada uma   → tasks.md · WIP.md (Pronto p/ dev)
   │
   ├─ Testes primeiro ── [Tester]     cenários BDD → testes vermelhos (TDD)
   ├─ Implementação ──── [@coding-1|2|3] código até os testes ficarem verdes
   ├─ Revisão ────────── [Code Review] riscos, regressões, regras R1–R15          → review.md
   ├─ Qualidade ──────── [QA/TEA]     cobertura, rastreabilidade, gate            → qa-gate.md
   ├─ Entrega ────────── [DevOps]     pipeline, migration, preview, produção
   └─ Registro ───────── [Documentation] CHANGELOG, implementations, docs/setup, ADR
                          [Scrum Master/PO] fecha no WIP.md
```

💡 Os agentes passam o trabalho **por arquivos**, não por memória de conversa:
o próximo agente lê a pasta da tarefa e continua. Isso economiza token e
impede que uma decisão "se perca" entre sessões ou ferramentas.

## 2. Qual método em cada caso

| Tipo de demanda | Método de especificação | Artefato | Exemplo no Admin |
|---|---|---|---|
| **Feature nova / módulo novo** (greenfield) | **Spec Kit** | `spec.md` + `plan.md` + `tasks.md` | Módulo PDI, Release Control |
| **Mudança em algo que já existe** (brownfield) | **OpenSpec** | `proposal.md` com **delta** (ADDED / MODIFIED / REMOVED) + `tasks.md` | Nova coluna no Financeiro, regra nova na Obra |
| **Bug** | OpenSpec enxuto + **TDD** | `proposal.md` (Why = sintoma e causa) + teste que reproduz o bug | Parcela com centavo a menos |
| **Doc / chore** | Nenhum (só `story.md` curto) | — | Corrigir passo de setup |
| **Infra / deploy** | OpenSpec | `proposal.md` com plano de rollback | Novo segredo na Vercel |

Em **todos** os casos que mexem em comportamento: **TDD/BDD**. Os critérios de
aceite são escritos em Given/When/Then (BDD) e viram testes **antes** do código (TDD).

### Fonte da verdade das regras (OpenSpec "archive")

O comportamento validado de cada módulo vive em `docs/implementations/<modulo>.md`.
Ao concluir uma mudança, o delta do `proposal.md` é **mesclado** nesse arquivo
(ADDED entra, MODIFIED substitui, REMOVED sai). É isso que impede um agente futuro
de "desfazer" uma regra que já foi validada.

## 3. Pasta de uma tarefa

```text
.agents/tasks/T-0007-financeiro-filtro-categoria/
├── story.md      # Orchestrator/Analyst/SM: tipo, contexto, status, notas de cada agente
├── spec.md       # PM (feature nova, Spec Kit)          ┐ um OU outro
├── proposal.md   # PM (mudança/bug, OpenSpec com delta)  ┘
├── plan.md       # Architect
├── tasks.md      # SM/PO: checklist com tier e dono de cada item
├── review.md     # Code Review
└── qa-gate.md    # QA/TEA: PASS | CONCERNS | FAIL | WAIVED
```

- ID sequencial `T-NNNN` + slug em kebab-case. O próximo ID é o maior do `WIP.md` + 1.
- Modelos em `.agents/templates/`. Ao concluir, a pasta vai para `.agents/tasks/archive/AAAA-MM/`.

## 4. Kanban (estados no `WIP.md`)

| Estado | Entra quando | Sai quando (Definition of Done da coluna) | Limite WIP |
|---|---|---|---|
| **Backlog** | Demanda registrada | Orchestrator classificou | — |
| **Análise** | Analyst assumiu | Contexto e perguntas respondidos | 2 |
| **Especificação** | PM assumiu | Spec/proposal **aprovada pela Liza** (Gate G1) | 2 |
| **Pronto p/ dev** | Architect + SM concluíram plan e tasks | Tester e @coding assumem | — |
| **Em desenvolvimento** | Testes vermelhos escritos (Gate G2) | Pipeline verde (Gate G3) | **2** |
| **Code Review** | PR aberto | `review.md` aprovado (Gate G4) | 3 |
| **QA** | Review aprovado | `qa-gate.md` PASS ou WAIVED (Gate G5) | 2 |
| **Pronto p/ deploy** | Gate G5 | Merge em `main` e produção validada | — |
| **Concluído** | Produção validada | Docs e CHANGELOG atualizados (Gate G6) | — |
| **Bloqueado** | Qualquer estado, com motivo e dono | Bloqueio resolvido | — |

💡 Limite de WIP é o "um prato de cada vez" da cozinha: com no máximo 2 tarefas
em desenvolvimento, nada fica pela metade e esquecido.

## 5. Gates (portões de qualidade)

| Gate | Quem libera | Critério |
|---|---|---|
| G1 Spec aprovada | **Liza** (humano) | Escopo, critérios BDD e fora-de-escopo claros; nenhuma pergunta aberta |
| G2 Testes vermelhos | Tester (validado com o PM) | Cada critério de aceite tem um teste que **falha** pelo motivo certo; o plano de testes cobre ≥ 95% dos arquivos novos/alterados (R16) |
| G3 Pipeline verde | @coding | `typecheck`, `format:check`, `lint`, `test`, `test:e2e`, `test:coverage` e `coverage:check` passam localmente |
| G4 Review | Code Review | Nenhum achado **bloqueante**; R1–R15 respeitadas |
| G5 QA | QA/TEA | Rastreabilidade critério → teste completa; `coverage:check` verde (≥ 95% no código novo, total não caiu); risco residual aceito |
| G6 Registro | Documentation | `CHANGELOG`, `implementations`, `WIP.md` e docs afetadas atualizados |

Gate pulado = registrar em `story.md` **quem** decidiu e **por quê** (ex.: hotfix).

## 6. Roteamento de implementação (`@coding` por complexidade)

O Architect define o tier no `plan.md`; o SM repete em cada item do `tasks.md`.

| Tier | Agente | Quando | Modelo sugerido |
|---|---|---|---|
| 1 | `@coding-1` | ≤ 3 arquivos, sem migration, sem regra R1–R5/R8/R12, sem mudança de contrato | Leve (Claude Haiku / equivalente) |
| 2 | `@coding-2` | Feature ou mudança dentro de **um** módulo seguindo o roteiro; migration **aditiva** | Padrão (Claude Sonnet / equivalente) |
| 3 | `@coding-3` | Transversal (2+ módulos), auth/sessão/proxy, dinheiro + `$transaction`, migration destrutiva, segurança, CI/deploy, refatoração de camada | Forte (Claude Opus / equivalente) |

**Regra de escalada:** se um `@coding` encontrar, no meio do trabalho, algo do
tier de cima, **para**, registra em `story.md` e devolve ao Orchestrator. Nunca
"resolve rapidinho" fora do seu tier.

## 7. Handoff (passagem de bastão)

Toda passagem termina com este bloco no `story.md`:

```markdown
### Handoff: <de> → <para> (AAAA-MM-DD)
- Feito: …
- Decidido: …
- Pendente / riscos: …
- Arquivos tocados: …
- Próximo passo: …
```
