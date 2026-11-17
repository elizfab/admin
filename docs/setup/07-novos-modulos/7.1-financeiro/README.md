# Fase 07 — Novos Módulos (roteiro + Painel Financeiro)

> **Objetivo da fase:** ter um **roteiro único e repetível** para adicionar
> qualquer módulo ao Admin, e aplicá-lo de ponta a ponta no **Painel
> Financeiro**: receitas, despesas, saldo do mês e despesas por categoria,
> com tela, API, testes e deploy.\
> **Tempo estimado:** 8 a 10 horas, divididas em sessões\
> **Depende de:** [Fase 06 — Deploy](../06-setup-deploy/README.md) concluída (CI verde e produção no ar)\
> **Modelo seguido:** o módulo **Projetos** da [Fase 04](../04-setup-backend/README.md)\
> **Mapa geral:** [`docs/README.md`](../../README.md)

## 💡 A ideia da fase: uma "receita de bolo" para módulos

Todo módulo novo (Financeiro agora; PDI e Release Control depois) é feito
**da mesma forma**, com as mesmas camadas da Fase 04. 💡 É como uma
franquia: cada loja vende coisas diferentes, mas a planta da cozinha, o
caixa e o estoque seguem o mesmo manual. Quem conhece uma loja trabalha em
qualquer outra.

O passo **01** é esse manual (genérico). Os passos **02 a 13** aplicam o
manual ao Financeiro, na ordem exata em que você vai trabalhar.

### Respostas diretas às dúvidas mais comuns

| Pergunta | Resposta |
|---|---|
| **Onde clico para adicionar um módulo novo?** | Em lugar nenhum. Um módulo é **código** (tabela, regras, telas). Ele entra no Admin por um commit, seguindo o passo 01. |
| **Devo criar um form para adicionar?** | **Para o módulo, não. Para os dados do módulo, sim.** O Financeiro tem o formulário "Nova transação"; o PDI terá "Nova meta". O form cadastra **registros** dentro de um módulo que já existe no código. |
| **Qual é a API certa para cada módulo novo?** | `/api/v1/<modulo>/<recurso>` no plural, com o mesmo contrato da Fase 04 (passo 01, seção 4). No Financeiro: `/api/v1/finance/transactions`. |
| **Existe um template?** | Sim: a árvore de pastas e a lista de arquivos do passo 01, seção 3. Copie a estrutura do módulo `projects` e troque os nomes. |
| **Quais serviços e tipos preciso criar?** | Sempre os mesmos 6 papéis: modelo Prisma, tipos, schemas Zod, repositório, serviço e actions (passo 01, seção 3). |

## Ordem dos passos

| # | Passo | O que entrega | Status |
|---|---|---|---|
| 01 | [Roteiro de um módulo novo](01-roteiro-de-um-modulo.md) | O manual genérico + a ficha de planejamento | ⬜ |
| 02 | [Modelo `Transaction` e migration](02-modelo-e-migration.md) | Tabela `transaction` com dona, tipo, valor em centavos e data | ⬜ |
| 03 | [Dinheiro e datas](03-dinheiro-e-datas.md) | `lib/money` e `lib/dates` + 22 testes | ⬜ |
| 04 | [Tipos e schemas Zod](04-tipos-e-schemas.md) | Contrato de entrada do módulo + 16 testes | ⬜ |
| 05 | [Repositório](05-repositorio.md) | Consultas por dona e por mês, somas no banco + 4 testes de integração | ⬜ |
| 06 | [Serviço](06-servico.md) | Regras e resumo do mês + 4 testes | ⬜ |
| 07 | [API REST `/api/v1/finance`](07-api-rest.md) | 6 operações (lista, cria, lê, altera, exclui, resumo) | ⬜ |
| 08 | [Server Actions](08-server-actions.md) | Criar, editar e excluir pela interface | ⬜ |
| 09 | [Componentes](09-componentes.md) | Formulário, lista, resumo, navegação de mês e exclusão | ⬜ |
| 10 | [Telas do Financeiro](10-telas.md) | Painel do mês, nova transação e edição | ⬜ |
| 11 | [Registrar o módulo](11-registrar-modulo.md) | Sidebar, dashboard e proxy (inclui Projetos, que estava fora do menu) | ⬜ |
| 12 | [Testes E2E do módulo](12-testes-e2e.md) | CRUD, resumo, isolamento e acessibilidade | ⬜ |
| 13 | [Validação final e deploy](13-validacao-e-deploy.md) | Pipeline verde, preview, produção e o roteiro pronto para o PDI | ⬜ |

## Checklist da fase

- [ ] Ficha de planejamento do módulo preenchida **antes** do código (passo 01)
- [ ] Migration `add_finance_transactions` criada e Prisma Client gerado
- [ ] Dinheiro sempre em **centavos inteiros**; datas sem hora exibidas em UTC
- [ ] Schemas: criação, atualização parcial e mês (`AAAA-MM`) testados
- [ ] Repositório filtrando **toda** consulta por `ownerId` (e por mês)
- [ ] Somas feitas pelo **banco** (`groupBy`), e não em laços no JavaScript
- [ ] `GET/POST /api/v1/finance/transactions`, `GET/PATCH/DELETE …/:id` e `GET /api/v1/finance/summary`
- [ ] Telas: painel do mês, nova transação, edição e exclusão com confirmação
- [ ] Módulo registrado na sidebar, no dashboard e no `matcher` do proxy
- [ ] Isolamento: a outra usuária recebe **404** e o resumo dela não soma nada da dona
- [ ] Acessibilidade sem violações nos dois temas
- [ ] CI verde, preview testado e produção com a migration aplicada

## Números da fase (validados em 17/11/2026)

| Suíte | Antes | Depois |
|---|---|---|
| Unitários (`npm test`) | 37 | **79** |
| Integração (`npm run test:integration`) | 4 | **8** |
| E2E (`npm run test:e2e`) | 22 | **30** |

## Arquivos da fase

```text
prisma/
├── schema.prisma                                   ← Alterado (Transaction + 2 enums)
└── migrations/<data>_add_finance_transactions/     ← Criado
src/
├── lib/
│   ├── money/money.ts                              ← Criado (centavos ⇄ texto)
│   └── dates/month.ts                              ← Criado (mês, fuso, datas sem hora)
├── modules/finance/                                ← Criado (o módulo inteiro)
│   ├── index.ts · server.ts
│   ├── types/transaction.types.ts
│   ├── schemas/transaction.schema.ts
│   ├── repositories/transaction.repository.ts
│   ├── services/transaction.service.ts
│   ├── actions/transaction.actions.ts
│   └── components/ (TransactionForm, TransactionList, MonthlySummary,
│                    MonthNavigator, DeleteTransactionButton)
├── app/(private)/finance/
│   ├── page.tsx · page.module.scss                 ← Substituído (era "Em breve")
│   └── transactions/ (new, [id]/edit)              ← Criado
├── app/api/v1/finance/                             ← Criado (transactions, [id], summary)
├── components/layout/Sidebar/navigation.ts         ← Alterado (+ Projetos)
└── modules/dashboard/data/modules.mock.ts          ← Alterado (+ Projetos, Financeiro disponível)
tests/
├── unit/lib/{money,dates}/ · unit/modules/finance/ ← Criados
├── integration/transaction.repository.test.ts      ← Criado
└── e2e/finance.spec.ts                             ← Criado (+ isolation, navigation, accessibility alterados)
```

---

← [Fase 06](../06-setup-deploy/README.md) · [Mapa geral](../../README.md) · [Passo 01](01-roteiro-de-um-modulo.md) →
