# Passo 01 — Ficha e decisões

> **Fase:** 09 — Financeiro → Obra\
> **Tempo estimado:** 40 min\
> **Depende de:** [Fase 07, passo 01](../07-novos-modulos/01-roteiro-de-um-modulo.md) (o roteiro de módulos)

## Objetivo

Preencher a ficha do módulo (roteiro da Fase 07) e **confirmar as 8 decisões**
abaixo antes de qualquer código. Cada decisão mudada depois do passo 02 custa
uma migration, telas e testes refeitos.

## 💡 Por que um módulo próprio, e não só uma categoria

A sua ideia original era: em **Nova transação**, escolher a categoria
Construção e preencher fase, profissão e profissional. Isso funciona para
**um** pagamento, mas a planilha guarda mais coisas que uma transação não tem:

- o **valor contratado** de cada serviço (para saber quanto falta);
- **várias** parcelas de uma compra, com vencimentos;
- metas, fases e o cronograma.

💡 Uma transação é um **recibo**; a obra é a **pasta** onde ficam o contrato,
os recibos e o planejamento. Por isso a sugestão é: a obra é um módulo próprio
(`construction`), dentro do Financeiro, e **cada pagamento da obra gera o
recibo** (a transação) sozinho. A categoria "Obra" continua existindo em Nova
transação, mas como **atalho** para pagar um serviço já contratado (passo 09).

## Pré-requisitos

- Fase 07 concluída.

## Passo a passo

### 1. As 8 decisões (sugeridas; confirme ou ajuste)

| # | Decisão | Sugestão | Por quê |
|---|---|---|---|
| 1 | Onde fica | Módulo `construction`, telas em **Financeiro → Obra** (`/finance/construction`) | É finança, mas com regras próprias |
| 2 | Uma ou várias obras | O banco aceita **várias** (`ConstructionProject`); a tela abre direto a única que existir | A próxima obra não exige migration |
| 3 | "Tags" de construção | **Ambientes** cadastráveis por obra (Geral, Banheiro, Escritório, Área gourmet…) | A lista cresce sem mexer no código |
| 4 | Profissões | Lista **fixa** no código: Pedreiro, Carpinteiro, Azulejista, Eletricista, Encanador, Calheiro, Pintor, Vidraceiro, Outros | O dashboard tem uma coluna por profissão; uma lista fixa garante os rótulos |
| 5 | Pagamento ↔ Financeiro | Todo pagamento de serviço e toda parcela paga **geram 1 lançamento "Obra"**, na mesma transação de banco; ele só muda pela Obra | Uma fonte de verdade; o saldo do mês inclui a obra; nada é lançado duas vezes |
| 6 | Compras parceladas | A compra gera **parcelas reais** com vencimento mensal (cartão/boleto); Pix, dinheiro, débito e transferência = 1x já paga | "Parcelas do mês" e "a pagar" passam a ser **exatos**, não estimativas |
| 7 | Status do serviço | Calculado: **Devendo** (nada pago), **Em andamento** (pago em parte), **Quitado** | Igual à planilha, com um meio-termo para o dashboard |
| 8 | Metas | Checklist por obra, cada meta opcionalmente ligada a um **ambiente**; % por ambiente substitui "lista 1/lista 2" | Mostra **onde** a obra está atrasada (ex.: Banheiro 20%) |

⚠️ Na decisão 8, se "lista 1" e "lista 2" tiverem outro significado para você
(por exemplo, "obra" e "compras"), troque `areaId` por um campo `group` na
meta **antes** do passo 02.

### 2. A ficha do módulo (roteiro da Fase 07)

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Recurso principal | `ConstructionProject` (obra), com `ConstructionArea`, `ConstructionPhase`, `ConstructionService`, `ServicePayment`, `MaterialPurchase`, `MaterialInstallment`, `ConstructionGoal` |
| 2 | Campos | Ver passo 02 |
| 3 | Dinheiro, data, listas | Dinheiro em **centavos** em tudo; datas sem hora (`@db.Date`); listas fixas: profissão e forma de pagamento |
| 4 | Regras | Não pagar além do contratado; contratado não fica menor que o pago; Pix/dinheiro/débito/transferência sempre 1x; serviço com pagamento não é excluído |
| 5 | Dona | Só a **obra** tem `ownerId`; o resto é filtrado pela obra |
| 6 | Filtros e ordem | Serviços por fase → profissão; pagamentos do mais novo para o mais antigo; compras por data |
| 7 | Agregados | Por profissão, por fase, por ambiente; totais de material; cronograma |
| 8 | Telas | Dashboard, Fases, Serviços, Pagamentos, Compras, Metas, Configuração |
| 9 | Excluir | Pagamento/parcela: apaga o lançamento junto. Serviço com pagamento: bloqueado. Compra: apaga parcelas e lançamentos |

## Arquivos criados ou alterados

Nenhum. O resultado deste passo é a ficha e as decisões confirmadas.

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Releia as 8 decisões | Cada uma confirmada ou ajustada por escrito no PR |
| 2 | Pegue a aba "Fase 01" da planilha | Você sabe de qual tabela vem cada número (passo 02) |

**Critério de aceite:** nenhuma decisão em aberto.

## Commit sugerido

```bash
git commit --allow-empty -m "docs(obra): ficha e decisões do módulo Obra"
```

---

← [Índice da fase](README.md) · [Próximo passo](02-modelo-de-dados.md) →
