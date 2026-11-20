# Financeiro → Construção: regras validadas

> A área se chamava "Obra" até T-0022. Cada item da área continua sendo uma **obra**
> (telhado, lavanderia, reformas…); o prefixo das regras segue `OBRA`.

| ID | Regra | Por quê | Protegida por |
|---|---|---|---|
| OBRA-R01 | Só a obra tem `ownerId`; todo o resto é filtrado por `project: { ownerId }` | Uma regra de isolamento só | `tests/integration/construction.service.test.ts` (outra usuária) |
| OBRA-R02 | Obra nasce com o ambiente "Geral" e a "Fase 01"; ambiente e fase são únicos por obra (409) | Mínimo para lançar; sem duplicados | `construction.service.test.ts` |
| OBRA-R03 | Fase e ambiente de um serviço/compra/meta precisam ser **da mesma obra** | Id de outra obra não entra | `contracted-service.service.ts` (sem teste dedicado: **dívida T-0002**) |
| OBRA-R04 | Total pago, falta e status do serviço são **calculados** (Devendo / Em andamento / Quitado) | Nunca desatualizam | `tests/unit/modules/construction/construction.rules.test.ts` |
| OBRA-R05 | "ID automático" do serviço = `Fase NN \| Profissão \| Descrição`, montado na leitura | Acompanha renomeações | `construction.service.test.ts` |
| OBRA-R06 | Pagamento acima do que falta é recusado (400) e **não** cria lançamento | Não pagar além do contratado | `construction.service.test.ts` |
| OBRA-R07 | Valor contratado não pode ficar menor que o já pago | Saldo negativo de serviço | `contracted-service.service.ts` (sem teste dedicado: **dívida T-0002**) |
| OBRA-R08 | Serviço com pagamento não pode ser excluído (409) | Dinheiro pago não some | `contracted-service.service.ts` (sem teste dedicado: **dívida T-0002**) |
| OBRA-R09 | Pagamento de serviço = `ServicePayment` + `Transaction` "Obra" no **mesmo** `$transaction`; excluir o pagamento apaga o lançamento | Tudo ou nada | `construction.service.test.ts` |
| OBRA-R10 | Compra no Pix/dinheiro/débito/transferência = 1 parcela **já paga** (+ lançamento); em 2x+ é recusada | Dinheiro saiu na hora | `construction.service.test.ts` |
| OBRA-R11 | Compra no cartão/boleto = N parcelas mensais a pagar a partir do 1º vencimento (padrão: 1 mês após a compra) | Parcelas e vencimentos reais | `construction.service.test.ts` |
| OBRA-R12 | Parcelas somam exatamente o total; centavos da divisão vão para a 1ª | Sem centavo perdido | `construction.rules.test.ts` |
| OBRA-R13 | Vencimento mensal respeita o fim do mês (31/01 + 1 mês = 28/02) | Sem data inexistente | `construction.rules.test.ts` |
| OBRA-R14 | Pagar parcela cria o lançamento; desfazer apaga; pagar de novo → 409 | Uma parcela, um lançamento | `construction.service.test.ts` |
| OBRA-R15 | Excluir compra apaga parcelas e os lançamentos das parcelas pagas | Sem lançamento órfão | `construction.service.test.ts` |
| OBRA-R16 | Meta recebe o estado **desejado** (`done`); repetir não muda a data de conclusão | Cliques repetidos não se anulam | `construction.service.test.ts` |
| OBRA-R17 | Dashboard: mão de obra por profissão, materiais (parcelas do mês = vencimentos do mês), resumo e cronograma derivados dos registros | Mesmos números da planilha | `construction.service.test.ts` (Pedreiro R$ 14.605,00 / falta R$ 11.005,00) |
| OBRA-R18 | A Construção lista as obras em cards: 1 por linha no celular, 2 (≥ 768 px), 3 (≥ 1024 px) e 6 (≥ 1280 px); cada card tem o nome (link para a obra), as datas e "Configurar" (adicionada em T-0022) | Várias obras e reformas visíveis de uma vez | `tests/unit/modules/construction/ConstructionProjectGrid.test.tsx`, `tests/e2e/construction.spec.ts › grid com até 6 obras…` |
| OBRA-R19 | "Nova obra", ao lado do Voltar, abre um modal com o MESMO formulário e a mesma action da configuração da obra; erro fica no modal; salvar leva à configuração da obra nova; fechar não cria nada (adicionada em T-0023) | Cadastro sem sair da lista, sem duplicar regra | `tests/unit/modules/construction/NewConstructionProjectDialog.test.tsx`, `construction.spec.ts › Nova obra…`, `accessibility.spec.ts › modal "Nova obra"…` |
