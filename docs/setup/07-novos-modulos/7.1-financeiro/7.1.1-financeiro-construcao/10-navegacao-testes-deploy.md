# Passo 10 — Navegação, testes E2E, dados da planilha e deploy

> **Fase:** 09 — Financeiro → Obra\
> **Tempo estimado:** 4 a 5 horas\
> **Depende de:** [Passo 09](09-nova-transacao-obra.md)\
> **Tipo:** especificação

## Objetivo

Registrar a Obra na navegação, cobrir os fluxos com E2E, trazer os dados reais
da planilha e publicar.

## 💡 A migração dos dados é um teste de verdade

💡 Passar a planilha para o sistema é a **prova dos nove**: se o dashboard do
Admin mostrar os mesmos números da planilha (onde as regras são iguais), o
módulo está certo; onde forem diferentes (parcelas), você sabe exatamente por quê.

## Pré-requisitos

- Passos 01 a 09 concluídos.

## Passo a passo

### 1. Registro (checklist da Fase 07, passo 11)

- [ ] `navigation.ts`: **não** criar item novo; a Obra fica dentro de Financeiro. No painel `/finance`, um card/link **Obra** ao lado de "Nova transação".
- [ ] `modules.mock.ts`: descrição do Financeiro passa a citar a obra ("Receitas, despesas, saldo e obra.").
- [ ] Proxy: nada (já cobre `/finance/:path*`).
- [ ] `accessibility.spec.ts`: acrescentar o dashboard, uma fase, Serviços, Pagamentos, Compras, Metas e Nova transação com "Obra" selecionada. Use o `projectId` criado no `beforeAll` do spec.

### 2. Testes E2E (`tests/e2e/construction.spec.ts`)

Cada teste cria **a própria obra** (nome com `randomUUID()`), o que dispensa o
`clearMonth` da Fase 07: obras diferentes não se somam.

| Teste | Prova |
|---|---|
| Criar obra → serviço → 3 pagamentos pela tela | Card "Quitado" na fase; 3 despesas "Obra" no Financeiro |
| Pagar acima da falta | Erro no campo; nenhum lançamento novo |
| Compra 3x → pagar 1ª parcela → desfazer | Status Parcelado/Pendente; lançamento aparece e some |
| Nova transação → Obra | Pagamento registrado e visível na fase |
| Lançamento "Obra" no Financeiro | Sem editar/excluir; API `DELETE` → 409 |
| Isolamento | Outra usuária: 404 em obra, serviço, pagamento, parcela e dashboard |
| Dashboard | Números de um cenário conhecido (o do teste de integração) |

### 3. Trazer os dados da planilha

1. Exporte as abas **Serviços contratados**, **Pagamentos realizados**, **Gestão de compras** e **Metas** como CSV (Arquivo → Fazer download → `.csv`).
2. Crie `scripts/import-obra.ts` (rodado com `npx tsx`), que **chama os serviços do passo 05** (nunca o Prisma direto, para valer as mesmas regras):
   - lê os CSVs com `parseMoneyToCents` para os valores e datas `dd/mm/aaaa` → `aaaa-mm-dd`;
   - cria a obra "Lavanderia", as fases ("Fase 01") e os serviços;
   - casa cada pagamento com o serviço pelo **ID automático** ("Fase 01 | Pedreiro | Construção do eitão");
   - cria as compras: "Pago" → Pix (1x paga); "Parcelado" + "3x" → cartão em 3x, e marca como pagas as parcelas já quitadas na fatura; "30 dias" → cartão 1x;
   - cria as metas e marca as concluídas.
3. Rode primeiro no banco **local**, confira o dashboard e só depois aponte para produção (com o `DATABASE_URL` de produção **só** no terminal, nunca em arquivo).

### 4. Deploy

- PR `feat/obra` → `develop` → CI ✅ → preview: a migration `add_construction` roda no banco de preview pelo `vercel-build`.
- Merge na `main`: a migration roda em produção. Ela é **aditiva** (tabelas novas + um valor novo de enum), sem risco para os dados atuais.
- Em `docs/README.md`, acrescente a linha da Fase 09 na tabela de fases.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/app/(private)/finance/page.tsx` | Alterado | Link para a Obra |
| `src/modules/dashboard/data/modules.mock.ts` | Alterado | Descrição do Financeiro |
| `tests/e2e/construction.spec.ts` | Criado | 7 testes |
| `tests/e2e/accessibility.spec.ts` | Alterado | Telas da obra |
| `scripts/import-obra.ts` | Criado | Importação da planilha |
| `docs/README.md` | Alterado | Fase 09 no mapa |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Pipeline completo (`typecheck`, `lint`, `test`, `test:e2e`, `test:integration`) | Tudo verde |
| 2 | Importação no banco local | Dashboard com Pedreiro R$ 14.605,00 / falta R$ 11.005,00 e 5 serviços |
| 3 | Produção | `/finance/construction` abre a Lavanderia; o painel do mês mostra as despesas "Obra" |

**Critério de aceite:** os 3 testes passam.

## Commit sugerido

```bash
git commit -m "test(obra): E2E, acessibilidade e importação da planilha"
git commit -m "docs: conclui fase 09 (Financeiro → Obra)"
```

---

← [Passo anterior](09-nova-transacao-obra.md) · [Índice da fase](README.md) · [Mapa geral](../../README.md) →
