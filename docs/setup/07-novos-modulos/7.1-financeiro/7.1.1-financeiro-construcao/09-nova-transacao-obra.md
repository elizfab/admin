# Passo 09 — Nova transação → Obra

> **Fase:** 09 — Financeiro → Obra\
> **Tempo estimado:** 3 horas\
> **Depende de:** [Passo 08](08-fases-e-dashboard.md)\
> **Tipo:** especificação

## Objetivo

Atender ao fluxo que você descreveu: em **Financeiro → Nova transação**,
escolher a categoria **Obra** e, a partir dela, a obra/ambiente, a fase, a
profissão e o profissional, ver o card do serviço (contratado, pago, falta) e
lançar o pagamento.

## 💡 Duas portas, uma regra

💡 Como uma loja com entrada pela rua e pelo estacionamento: as duas levam ao
**mesmo caixa**. Aqui, o formulário da Obra (passo 07) e o atalho em Nova
transação chamam o **mesmo** `registerServicePayment`. Nenhuma regra (não
pagar além do que falta, gerar o lançamento) é escrita duas vezes.

```text
Nova transação
├── Categoria ≠ Obra → createTransactionAction (Fase 07, igual a hoje)
└── Categoria = Obra → campos da obra aparecem
      └── Salvar → createConstructionPaymentAction → registerServicePayment
                     (cria o ServicePayment E a Transaction "Obra")
```

### O que aparece ao escolher "Obra"

| Ordem | Campo | Origem | Filtra o próximo |
|---|---|---|---|
| 1 | **Obra · Ambiente** (as suas "tags": "Lavanderia", "Lavanderia · Banheiro", "Lavanderia · Escritório"…) | Obras + ambientes | Serviços daquela obra/ambiente ("Lavanderia" = todos) |
| 2 | **Fase** | Fases da obra | Serviços da fase |
| 3 | **Profissão** | Profissões com serviço não quitado | Serviços da profissão |
| 4 | **Serviço** (profissional + descrição) | `listServices` não quitados | — |
| 5 | Card do serviço | `ServiceSummary` | — |
| 6 | Data, Valor pago, Forma de pagamento | Formulário | — |

O **tipo** fica fixo em **Despesa** e o campo Descrição some: ela é gerada
("Lavanderia · Pedreiro Oswaldo: Reboque").

Sem serviço cadastrado para a combinação → mensagem "Nenhum serviço a pagar
nesta fase/profissão" e o link **Cadastrar serviço**
(`/finance/construction/[projectId]/services/new?phaseId=…&trade=…`).

⚠️ Compras de material **não** entram por aqui: uma compra tem parcelas e
vencimentos, e isso pertence à tela de Compras (passo 07). O atalho cobre
**pagamento de mão de obra**, o caso do seu pedido.

## Pré-requisitos

- Passo 08 concluído.

## Passo a passo

### 1. Dados para o formulário (servidor)

`src/app/(private)/finance/transactions/new/page.tsx` passa a buscar, para
**todas as obras da dona**: obras, ambientes, fases e `listServices` (só os não
quitados), e envia ao formulário uma lista **pequena e já filtrada no
servidor**. 💡 Uma obra pessoal tem dezenas de serviços, não milhares: filtrar
no navegador é instantâneo e evita uma requisição a cada troca de campo.

### 2. Formulário

- Acrescente "Obra" às opções **do formulário** (não ao `transactionCategoryValues` da API).
- `TransactionForm` passa a ter estado `category` (`useState`) para mostrar o
  bloco `ConstructionPaymentFields` quando for "Obra".
- O `<form>` usa a action certa conforme a categoria (`formAction` diferente
  no botão: `<button formAction={...}>`), mantendo o `useActionState` de cada uma.
- Os campos da obra ficam num `<fieldset>` com `<legend>Pagamento da obra</legend>`;
  ao aparecer, o foco **não** salta (o leitor de tela anuncia a região por `aria-live="polite"` no card).

### 3. Action

`createConstructionPaymentAction` (em `src/modules/construction/actions/`):
sessão → `createServicePaymentSchema.safeParse` → `registerServicePayment` →
`revalidatePath("/finance")` e `revalidatePath("/finance/construction")` →
`redirect` para `/finance?month=<mês do pagamento>`.

### 4. Lista do Financeiro

No `TransactionList`, lançamentos "Obra" mostram o selo **Obra** e, no lugar
de editar/excluir, um link **Ver na obra** (o serviço responderia 409). Para
isso, `listByOwnerInRange` passa a incluir `servicePayment: { select: { service: { select: { projectId: true, phase: { select: { number: true } } } } } }`
e `materialInstallment: { select: { purchase: { select: { projectId: true } } } }`.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/app/(private)/finance/transactions/new/page.tsx` | Alterado | Carrega obras/serviços |
| `src/modules/finance/components/TransactionForm/TransactionForm.tsx` | Alterado | Categoria "Obra" e bloco condicional |
| `src/modules/construction/components/ConstructionPaymentFields/*` | Criado | Selects encadeados + card do serviço |
| `src/modules/construction/actions/construction-payment.actions.ts` | Criado | Action do atalho |
| `src/modules/finance/repositories/transaction.repository.ts` | Alterado | Inclui a origem "Obra" na lista |
| `src/modules/finance/components/TransactionList/TransactionList.tsx` | Alterado | Selo "Obra" e "Ver na obra" |

## ✅ Como testar

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Nova transação → Categoria **Obra** | Somem Tipo e Descrição; aparecem Obra · Ambiente, Fase, Profissão, Serviço |
| 2 | Lavanderia → Fase 01 → Pedreiro → "Oswaldo: Reboque" | Card: contratado R$ 9.805,00, pago R$ 0,00, falta R$ 9.805,00 |
| 3 | Valor 2.000,00 → Salvar | Volta ao mês; despesa "Lavanderia · Pedreiro Oswaldo: Reboque" com selo **Obra** |
| 4 | Fase 01 da obra | Reboque "Em andamento", 1 pagamento |
| 5 | Lápis/lixeira desse lançamento no Financeiro | Não aparecem; "Ver na obra" leva à Fase 01 |
| 6 | Valor maior que a falta | Erro no campo; nada é gravado |

**Critério de aceite:** os 6 testes passam.

## Commit sugerido

```bash
git commit -m "feat(finance): categoria Obra em Nova transação (atalho de pagamento)"
```

---

← [Passo anterior](08-fases-e-dashboard.md) · [Índice da fase](README.md) · [Próximo passo](10-navegacao-testes-deploy.md) →
