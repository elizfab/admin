# Passo 07 — Telas de cadastro

> **Fase:** 09 — Financeiro → Obra\
> **Tempo estimado:** 8 a 10 horas\
> **Depende de:** [Passo 06](06-api-rest.md)\
> **Tipo:** especificação (padrões validados: Fase 07, passos 08 a 10)

## Objetivo

Criar as telas onde você **digita** os dados: configuração da obra, Serviços
contratados, Pagamentos realizados, Compras de material e Metas, com o mesmo
visual das suas abas (tabelas largas, cabeçalho lilás, status colorido).

## 💡 O mapa das rotas

Todas ficam em `src/app/(private)/finance/construction/`, protegidas pelo
`/finance/:path*` que já está no proxy.

| Rota | Tela | Aba da planilha |
|---|---|---|
| `/finance/construction` | Escolhe a obra: se houver **uma**, redireciona para ela; nenhuma → formulário "Nova obra" | — |
| `/finance/construction/[projectId]` | Dashboard (passo 08) | Dashboard de evolução |
| `…/[projectId]/settings` | Configuração: nome, datas, ambientes, fases | — |
| `…/[projectId]/services` | Serviços contratados | Serviços contratados |
| `…/[projectId]/services/new` · `…/services/[serviceId]/edit` | Formulário de serviço | — |
| `…/[projectId]/payments` | Pagamentos realizados | Pagamentos realizados |
| `…/[projectId]/payments/new?serviceId=` | Formulário de pagamento | — |
| `…/[projectId]/purchases` · `…/purchases/new` | Gestão de compras | Gestão de Compras |
| `…/[projectId]/goals` | Metas | Metas lavanderia |
| `…/[projectId]/phases/[number]` | Evolução da fase (passo 08) | Fase 01, Fase 02… |

💡 Por que o `projectId` na URL? Igual ao `?month=` do Financeiro: a URL diz
**qual obra** está aberta, e o botão "voltar" e os favoritos funcionam. Com uma
obra só, você nunca precisa escolher (a raiz redireciona).

### Navegação interna da obra

Um componente `ConstructionTabs` (Server Component), abaixo do `PageHeader`, com
`<nav aria-label="Seções da obra">` e links: **Dashboard · Fases · Serviços ·
Pagamentos · Compras · Metas · Configuração**. Cada link com
`aria-current="page"` quando ativo (mesmo critério de prefixo da Sidebar).

## Pré-requisitos

- Passo 06 concluído.

## Passo a passo

### 1. Componentes compartilhados (`src/modules/construction/components/`)

| Componente | Tipo | O que faz | Base |
|---|---|---|---|
| `ConstructionTabs` | Server | Abas da obra | `MonthNavigator` (links) |
| `StatusBadge` | Server | "Quitado" (`var(--green)`), "Em andamento" (`var(--orange)`), "Devendo" (`var(--red)`), "Pago"/"Parcelado"/"Pendente"; fundo com `color-mix(in srgb, <cor> 15%, transparent)`. Confira o contraste do laranja no tema claro com o axe | `.amount` do `TransactionList` (cor **e** texto) |
| `MoneyCell` | Server | `<td>` alinhado à direita com `formatCents` e `font-variant-numeric: tabular-nums` | `TransactionList` |
| `DataTable` | Server | `<table>` (fundo `var(--table-background)`) com `<caption>` (pode ser `visually-hidden`), `<th scope="col">`, rolagem horizontal no celular (`overflow-x: auto` num `<div role="region" tabindex="0" aria-label>`) | Novo |
| `DeleteButton` | Client | Exclusão com `AlertDialog` (genérico: `label`, `action`) | `DeleteTransactionButton` |

⚠️ As tabelas largas (Serviços e Compras) **são** tabelas de dados: use
`<table>`, e não `<div>` em grade. O leitor de tela anuncia "linha 3, coluna
Valor contratado", o que uma grade de `<div>` não faz.

### 2. Configuração (`/settings`)

- Formulário da obra: Nome *, Início, Fim previsto → `createProject` / atualizar (crie `updateProject` com a mesma regra de datas).
- **Ambientes**: lista + campo "Novo ambiente" (Enter adiciona) → `addArea`. Sugestão de primeiros: Banheiro, Escritório, Área gourmet, Quartinho.
- **Fases**: lista "Fase 01 – Estrutura" + "Nova fase" (número sugerido = maior + 1; nome opcional) → `addPhase`.

### 3. Serviços contratados (`/services`)

Tabela, na ordem das colunas da planilha:

| ID | Fase | Ambiente | Profissão | Profissional | Descrição | Valor contratado | Total pago | Falta pagar | Status | Ações |
|---|---|---|---|---|---|---|---|---|---|---|

- Dados: `listServices(ownerId, projectId)`; o "ID" é `summary.label`.
- Filtro opcional por fase: `?phaseId=` (links, como o mês do Financeiro).
- Ações: **Pagar** (vai para `payments/new?serviceId=`; some quando quitado), lápis (editar), lixeira (desabilitada com `title` quando há pagamento; o serviço responde 409 de qualquer jeito).
- Botão **Novo serviço** no `PageHeader`.

**Formulário de serviço** (`ServiceForm`, Client, molde do `TransactionForm`):

| Campo | Controle | Regra |
|---|---|---|
| Fase * | `<select>` com as fases da obra | — |
| Ambiente | `<select>` com "Nenhum" + ambientes | Opcional |
| Profissão * | `<select>` com `tradeLabel` | — |
| Profissional | texto | Até 80 |
| Descrição do serviço * | texto | 2 a 120 |
| Valor contratado (R$) * | texto `inputMode="decimal"` | Na edição, não menor que o pago (mensagem do serviço) |
| Observações | `<textarea>` | Até 500 |

### 4. Pagamentos realizados (`/payments`)

| Data do pagamento | Serviço | Profissional | Valor pago | Forma de pagamento | Observações | Ações |
|---|---|---|---|---|---|---|

- Dados: `listPayments(ownerId, projectId)` (mais novo primeiro).
- Ação: lixeira (apaga o pagamento **e** o lançamento; o diálogo avisa: "O lançamento no Financeiro também será excluído").

**Formulário de pagamento** (`PaymentForm`):

| Campo | Controle | Regra |
|---|---|---|
| Serviço * | `<select>` com `summary.label` dos **não quitados** | Pré-selecionado por `?serviceId=` |
| (card de contexto) | Profissional, contratado, já pago, **falta** | Atualiza ao trocar o serviço (dados já vêm do servidor; filtro no cliente) |
| Data do pagamento * | `type="date"` | Padrão: `today()` |
| Valor pago (R$) * | texto decimal | ≤ falta (mensagem do serviço) |
| Forma de pagamento * | `<select>` com `paymentMethodLabel` | Padrão: Pix |
| Observações | `<textarea>` | — |

Depois de salvar: volta para a **fase** do serviço (`/phases/[number]`), onde o card mostra o pagamento novo.

### 5. Compras de material (`/purchases`)

Faixa de totais no topo (cards, como a planilha): **Total à pagar**, **Total
de compras** (quantidade), **Itens parcelados**, **Itens pagos (%)**, **Total (R$)**.

| Id | Item | Ambiente | Fornecedor/Loja | Data de compra | Valor total | Forma | Status | Parcelas | Ações |
|---|---|---|---|---|---|---|---|---|---|

- "Parcelas" mostra `2/3 pagas` e abre (com `<details>`/`<summary>`, sem JavaScript) a lista: nº, vencimento, valor, **Marcar como paga** / **Desfazer**.
- "Marcar como paga" abre um pequeno formulário com a data (padrão: vencimento) → `payInstallment`.
- Coluna lateral "Parcelas por mês" da planilha vira o card **Parcelas do mês** do dashboard (passo 08), que é exato.

**Formulário de compra** (`PurchaseForm`):

| Campo | Controle | Regra |
|---|---|---|
| Item / material * | texto | — |
| Ambiente | `<select>` | Opcional |
| Fornecedor / loja | texto | — |
| Data de compra * | `type="date"` | — |
| Valor total (R$) * | texto decimal | — |
| Forma de pagamento * | `<select>` | Pix/dinheiro/débito/transferência **travam** parcelas em 1 |
| Parcelas * | número 1–24 | Só para cartão/boleto |
| 1º vencimento | `type="date"` | Padrão: 1 mês após a compra ("30 dias" = 1x aqui) |
| (prévia) | "3x de R$ 386,52 (1ª: R$ 386,52)" | Calculada no navegador com `splitInstallments` (mesma regra do servidor) |

### 6. Metas (`/goals`)

- Barra de progresso geral (`goals.percent`) e por ambiente (`goals.byArea`), no lugar de "lista 1/lista 2".
- Lista com `<input type="checkbox">` por meta; marcar chama `setGoalDone` (`<form>` com Server Action, um por item).
- Concluída: texto riscado **e** `aria-label` "concluída" (a cor/risco não pode ser a única pista).
- Campo "Nova meta" + ambiente opcional.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/app/(private)/finance/construction/**` | Criado | Páginas das rotas acima |
| `src/modules/construction/components/*` | Criado | Abas, tabelas, formulários, badges |
| `src/modules/construction/actions/*.actions.ts` | Criado | Uma action por formulário (sessão → Zod → serviço → `revalidatePath` → `redirect`) |
| `src/modules/construction/services/project.service.ts` | Alterado | `updateProject` |

## ✅ Como testar

Use os dados da sua planilha:

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Criar a obra "Lavanderia" | Abre a configuração com "Geral" e "Fase 01" |
| 2 | Cadastrar os 5 serviços da Fase 01 | Tabela igual à aba "Serviços contratados" (IDs, valores, "Devendo") |
| 3 | Lançar os 3 pagamentos do eitão (600, 2.000, 1.000) | Eitão "Quitado"; 3 despesas "Obra" em outubro no Financeiro |
| 4 | Tentar pagar R$ 1,00 a mais no eitão | Erro "O valor passa do que falta pagar (R$ 0,00)." |
| 5 | Compra de R$ 1.159,56 no cartão em 3x | 3 parcelas de R$ 386,52 a pagar |
| 6 | Marcar a 1ª parcela como paga | Status "Parcelado", 1/3 pagas; despesa "Obra" no mês da data |
| 7 | Marcar 2 metas | % geral e do ambiente atualizados |
| 8 | Axe nas telas, nos dois temas | Sem violações |

**Critério de aceite:** os 8 testes passam.

## Commit sugerido

Um commit por tela (`feat(obra): tela de serviços contratados`, …).

---

← [Passo anterior](06-api-rest.md) · [Índice da fase](README.md) · [Próximo passo](08-fases-e-dashboard.md) →
