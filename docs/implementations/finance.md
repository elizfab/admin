# Financeiro: regras validadas

| ID | Regra | Por quê | Protegida por |
|---|---|---|---|
| FIN-R01 | Transação: tipo (Receita/Despesa), descrição 2–120, valor > 0 e ≤ R$ 10.000.000,00 em centavos, categoria (padrão Outros), data sem hora | Contrato da entrada | `tests/unit/modules/finance/transaction.schema.test.ts` |
| FIN-R02 | O mesmo campo aceita "1.234,56" (formulário) e `123456` (API); valor fracionado na API → 400 | Duas portas, um contrato | `transaction.schema.test.ts`, `tests/e2e/finance.spec.ts` |
| FIN-R03 | Lista e resumo sempre de **um mês** (`?month=AAAA-MM`), intervalo `[dia 1, dia 1 do mês seguinte)` | Inclui o 1º e o último dia, exclui vizinhos | `tests/integration/transaction.repository.test.ts` |
| FIN-R04 | Mês inválido: tela cai no mês atual; API responde 400 | Pessoa vê o resultado; programa precisa do erro | `finance.spec.ts` |
| FIN-R05 | Resumo (receitas, despesas, saldo, despesas por categoria) somado pelo **banco** (`groupBy`); saldo pode ser negativo | Exato e rápido | `transaction.repository.test.ts`, `transaction.service.test.ts` |
| FIN-R06 | Depois de salvar, volta ao painel **no mês da transação** | Não "some" o que acabou de salvar | `finance.spec.ts` |
| FIN-R07 | Transação de outra usuária → 404; resumo da outra não soma nada da dona | Isolamento, inclusive em somas | `tests/e2e/isolation.spec.ts` |
| FIN-R08 | Categoria "Obra" (`CONSTRUCTION`) **não** é aceita pelo formulário/API comuns; só a Obra cria esses lançamentos | Lançamento de obra sempre ligado à origem | `transaction.schema.ts` (sem teste dedicado: **dívida T-0002**) |
| FIN-R09 | Lançamento gerado pela Obra não é alterado nem excluído pelo Financeiro (409) | Financeiro e Obra nunca divergem | `tests/integration/construction.service.test.ts` |
| FIN-R10 | Valor com cor **e** sinal (+/−) **e** texto oculto "Receita/Despesa" | Cor não é a única pista (WCAG 1.4.1) | `tests/e2e/accessibility.spec.ts` |
