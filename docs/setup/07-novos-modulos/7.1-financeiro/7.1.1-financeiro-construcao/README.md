# Fase 09 — Financeiro → Obra (construção da lavanderia)

> **Objetivo da fase:** levar a planilha da obra para dentro do Financeiro do
> Admin: serviços contratados, pagamentos aos profissionais, fases (evolução),
> compras de material com parcelas, metas e o dashboard. **Todo pagamento da
> obra vira automaticamente uma despesa "Obra" no painel do mês**, sem lançar
> duas vezes.\
> **Tempo estimado:** 25 a 35 horas, em várias sessões\
> **Depende de:** [Fase 07](../07-novos-modulos/README.md) concluída (módulo Financeiro e o roteiro de módulos)\
> **Tema visual:** o atual (tokens Dracula); nada muda

## 💡 A ideia: a planilha vira um sistema, sem perder o formato

💡 A planilha é um **caderno**: você escreve o total de cada serviço, anota cada
pagamento e faz as contas à mão (ou com fórmulas que podem quebrar). O sistema é
um **caixa registradora**: você registra só os fatos (contratei, paguei,
comprei), e os totais, o "falta pagar" e o status são **calculados** toda vez,
sem fórmula para manter.

### De cada aba da planilha para uma tela

| Aba da planilha | Tela no Admin | O que você **digita** | O que é **calculado** |
|---|---|---|---|
| Dashboard de evolução | `Obra → Dashboard` | — | Tudo: metas, mão de obra por profissão, materiais, resumo, cronograma |
| Fase 01, Fase 02… | `Obra → Fases → Fase 01` | — | Cards por serviço com a tabela de pagamentos e "QUITADO/DEVENDO" |
| Serviços contratados | `Obra → Serviços` | Fase, ambiente, profissão, profissional, descrição, valor contratado | ID ("Fase 01 \| Pedreiro \| Reboque"), total pago, falta, status |
| Pagamentos realizados | `Obra → Pagamentos` | Data, serviço, valor, forma de pagamento | Lançamento "Obra" no Financeiro |
| Metas lavanderia | `Obra → Metas` | Meta e ambiente; marcar/desmarcar | % por ambiente e geral |
| Gestão de compras de materiais | `Obra → Compras` | Item, loja, data, valor, forma, parcelas | Parcelas mensais, status Pago/Parcelado, a pagar, parcelas do mês |

### As "tags" de construção

O que você chamou de **"Construção da Lavanderia: banheiro"** vira duas coisas:

| Na tag | No sistema | Exemplos |
|---|---|---|
| "Construção da **Lavanderia**" | **Obra** | Lavanderia (e, no futuro, outra obra) |
| "…: **banheiro**" | **Ambiente** da obra | Geral, Banheiro, Escritório, Área gourmet, Quartinho |

Ambientes e fases são **cadastrados por você** (tela de configuração), e não
uma lista fixa no código: "e etc." significa que a lista vai crescer.

## Ordem dos passos

| # | Passo | O que entrega | Tipo | Status |
|---|---|---|---|---|
| 01 | [Ficha e decisões](01-ficha-e-decisoes.md) | Ficha do módulo e as 8 decisões (confirme antes do código) | Planejamento | ⬜ |
| 02 | [Modelo de dados](02-modelo-de-dados.md) | 7 tabelas, 2 enums, categoria "Obra" | ✅ Código validado | ⬜ |
| 03 | [Regras puras](03-regras.md) | Status, parcelas, cronograma + 11 testes | ✅ Código validado | ⬜ |
| 04 | [Schemas e tipos](04-schemas-e-tipos.md) | Entrada validada e rótulos em português | ✅ Código validado | ⬜ |
| 05 | [Serviços e integração com o Financeiro](05-servicos.md) | Pagamento + lançamento atômicos, compras, metas, dashboard + 11 testes no banco real | ✅ Código validado | ⬜ |
| 06 | [API REST](06-api-rest.md) | `/api/v1/finance/construction/...` | Especificação | ⬜ |
| 07 | [Telas de cadastro](07-telas-de-cadastro.md) | Configuração, Serviços, Pagamentos, Compras, Metas | Especificação | ⬜ |
| 08 | [Fases e dashboard](08-fases-e-dashboard.md) | Evolução por fase e Dashboard de evolução | Especificação | ⬜ |
| 09 | [Nova transação → Obra](09-nova-transacao-obra.md) | Categoria "Obra" no formulário do Financeiro | Especificação | ⬜ |
| 10 | [Navegação, testes E2E e deploy](10-navegacao-testes-deploy.md) | Menu, E2E, migração dos dados da planilha | Especificação | ⬜ |

**Código validado** = implementado e testado (unitários + integração no
PostgreSQL real) em 18/11/2026. **Especificação** = rotas, campos, componentes,
regras de tela e testes descritos com precisão, seguindo os padrões já
validados nas Fases 07 e 08.

## Checklist da fase

- [ ] Decisões do passo 01 confirmadas (ou ajustadas) **antes** do passo 02
- [ ] Migration `add_construction` aplicada; categoria `CONSTRUCTION` ("Obra") no Financeiro
- [ ] Pago, falta e status **nunca** guardados: sempre calculados
- [ ] Todo pagamento de serviço e toda parcela paga geram 1 lançamento "Obra", na mesma transação de banco
- [ ] Lançamento gerado pela Obra não é editado nem excluído pelo Financeiro (409)
- [ ] Pagar mais do que falta é recusado
- [ ] Parcelas somam exatamente o total (centavos da divisão na 1ª)
- [ ] Toda leitura filtra pela obra **da dona** (`project: { ownerId }`)
- [ ] Telas com os mesmos números da planilha (teste do passo 10 com os dados reais)

## Números (validados em 18/11/2026)

| Suíte | Antes (fim da Fase 08) | Depois do passo 05 |
|---|---|---|
| Unitários | 94 | **105** |
| Integração | 8 | **19** |

---

← [Fase 08](../08-portal-dev/README.md) · [Mapa geral](../../README.md) · [Passo 01](01-ficha-e-decisoes.md) →
