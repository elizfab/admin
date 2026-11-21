# Passo 08 — Fases e dashboard

> **Fase:** 09 — Financeiro → Obra\
> **Tempo estimado:** 5 a 6 horas\
> **Depende de:** [Passo 07](07-telas-de-cadastro.md)\
> **Tipo:** especificação (dados prontos no passo 05)

## Objetivo

Criar as duas telas **só de leitura**: a evolução de cada fase (cards por
serviço, como as abas "Fase 01") e o "Dashboard de evolução".

## 💡 Telas de leitura não guardam nada

💡 São **painéis de carro**: mostram velocidade e combustível, mas não têm
volante. Tudo vem de `listServices`, `listPayments` e
`getConstructionDashboard`; nenhum número é digitado aqui. Por isso estas
telas são Server Components sem formulário (exceto o botão "Registrar
pagamento", que leva ao formulário do passo 07).

## Pré-requisitos

- Passo 07 concluído, com os dados da planilha lançados.

## Passo a passo

### 1. Evolução da fase (`/phases/[number]`)

Dados: `listServices(ownerId, projectId, phaseId)` + `listPayments(ownerId, projectId)` agrupados por `serviceId`.

**Topo, faixa de cards (um por serviço da fase)** — como a 1ª linha da aba "Fase 01":

| Linha | Conteúdo |
|---|---|
| Título | `Fase 01 \| Pedreiro \| Construção do eitão` |
| Valor | Valor contratado, grande |
| Rodapé | "Pedreiro: Construção do eitão" e **"Quitado"** ou **"Falta R$ 1.200,00"** |
| Cor | Fundo `color-mix` de `var(--green)` (quitado) ou `var(--red)` (devendo); texto sempre legível nos dois temas |

**Abaixo, um bloco por profissão** (`<h2>Pedreiro</h2>`) com um card por serviço:

```text
┌ Fase 01 | Pedreiro | Construção do eitão ─────────────────┐
│ Pedreiro: Oswaldo                                          │
│ Construção do eitão                                        │
│ ┌ Data do pagamento ┬ Valor pago ┬ Saldo  (R$ 3.600,00) ┐ │
│ │ 03/10/2025         │ R$ 600,00  │ R$ 3.000,00          │ │
│ │ 11/10/2025         │ R$ 2.000,00│ R$ 1.000,00          │ │
│ │ 18/10/2025         │ R$ 1.000,00│ R$ 0,00              │ │
│ └────────────────────┴────────────┴──────────────────────┘ │
│ TOTAL PAGO: R$ 3.600,00        FALTA PAGAR: R$ 0,00        │
│ [ QUITADO ]                       [ Registrar pagamento ]  │
└────────────────────────────────────────────────────────────┘
```

- A coluna **Saldo** (o "valor total cobrado" que vai diminuindo) é calculada
  na tela: contratado − soma acumulada, em ordem **crescente** de data (a
  lista do passo 05 vem decrescente; inverta só aqui).
- A tabela de pagamentos é um `<table>` com `<caption>` "Pagamentos de
  Construção do eitão" (`visually-hidden`).
- Navegação entre fases: links "‹ Fase anterior · Fase 02 ›", como o `MonthNavigator`.

### 2. Dashboard (`/finance/construction/[projectId]`)

Dados: **uma** chamada `getConstructionDashboard(ownerId, projectId, hoje, mêsAtual)`
(`today()` e `currentMonth()` de `lib/dates`, já no fuso de São Paulo).

| Seção (planilha) | Cards | Campos |
|---|---|---|
| Topo | Progresso geral das metas · Metas concluídas · Metas pendentes · Total de metas · Mão de obra quitada · Prazo decorrido | `goals.*`, `labor.paidPercent`, `schedule.percent` |
| Metas por ambiente | Um mini-card por ambiente com % | `goals.byArea` (substitui "lista 1/lista 2") |
| 1. Mão de obra | Um card por profissão (contratado + "Falta R$ …" ou "Sem serviços") + **Total mão de obra** | `labor.byTrade`, `labor.contractedCents`, `labor.remainingCents` |
| 2. Material de construção | Total em compras · Já pago · A pagar · Compras parceladas · Compras pendentes · Nº de compras · Parcelas do mês · Materiais pagos (%) | `materials.*` |
| 3. Resumo geral | Investimento total · Total pago · Falta pagar · Obra quitada (%) · Mão de obra (% do total) · Materiais (% do total) · Custo médio por dia · Serviços contratados | `overall.*`, `labor.servicesCount` |
| Cronograma (lateral) | Início · Fim previsto · Dias decorridos · Dias restantes · Prazo decorrido | `project.startDate`, `project.plannedEndDate`, `schedule` |

Regras de exibição:

- Mostre **todas** as profissões de `tradeLabel` (com "Sem serviços" quando
  não houver), para o painel ter sempre o mesmo desenho, como na planilha.
- "—" quando o número não existe (sem datas no cronograma; custo por dia sem dias decorridos).
- Cores de alerta: valor a pagar > 0 → `var(--yellow)`; quitado → `var(--green)`.
  Cor nunca sozinha: o texto do card diz "Falta R$ …".
- Cards em `<dl>` (`<dt>` rótulo, `<dd>` valor), como o `MonthlySummary`.
- Grade: `repeat(auto-fill, minmax(150px, 1fr))`; no celular, 2 colunas.

### 3. Componentes

| Componente | Base |
|---|---|
| `StatCard` (rótulo, valor, rodapé, tom) | Card do `MonthlySummary` |
| `PhaseServiceCard` | Novo (desenho acima) |
| `PhaseNavigator` | `MonthNavigator` |

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/app/(private)/finance/construction/[projectId]/page.tsx` | Criado | Dashboard |
| `src/app/(private)/finance/construction/[projectId]/phases/[number]/page.tsx` | Criado | Evolução da fase |
| `src/modules/construction/components/{StatCard,PhaseServiceCard,PhaseNavigator}/*` | Criado | Componentes |

## ✅ Como testar

Com os dados da planilha lançados (passo 07):

| # | Tela | Resultado esperado (igual às suas imagens) |
|---|---|---|
| 1 | Fase 01 | Eitão "Quitado" com 3 pagamentos e saldo 3.000 → 1.000 → 0; Esgoto e Reboque "Devendo" |
| 2 | Dashboard → Pedreiro | **R$ 14.605,00**, "Falta R$ 11.005,00" |
| 3 | Dashboard → Total mão de obra | **R$ 19.805,00**, "Falta R$ 16.205,00" |
| 4 | Dashboard → Mão de obra quitada | **18%** |
| 5 | Dashboard → Serviços contratados | **5** |
| 6 | Axe nos dois temas | Sem violações |

⚠️ Os números de **materiais** e do **resumo geral** vão diferir da planilha
de propósito: lá, "parcelas do mês" é uma estimativa; aqui, cada parcela tem
vencimento real. Confira compra a compra no passo 10.

**Critério de aceite:** os 6 testes passam.

## Commit sugerido

```bash
git commit -m "feat(obra): evolução por fase e dashboard"
```

---

← [Passo anterior](07-telas-de-cadastro.md) · [Índice da fase](README.md) · [Próximo passo](09-nova-transacao-obra.md) →
