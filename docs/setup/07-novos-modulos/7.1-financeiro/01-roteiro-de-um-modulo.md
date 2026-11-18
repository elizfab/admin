# Passo 01 — Roteiro de um módulo novo

> **Fase:** 07 — Novos Módulos\
> **Tempo estimado:** 30 min (leitura) + 20 min (ficha do módulo)\
> **Depende de:** [Fase 06](../06-setup-deploy/README.md) concluída

## Objetivo

Ter o **manual** que vale para qualquer módulo do Admin: o que decidir antes
de codar, quais arquivos criar, em que ordem, qual o formato da API e em
quais lugares registrar o módulo. No fim, preencher a **ficha de
planejamento** do Financeiro.

## 💡 Por que um roteiro antes do código

💡 Antes de construir um cômodo novo numa casa, o arquiteto decide **o que
vai dentro** (pia? tomada de 220 V?) e **por onde passam os canos**. Se a
pia for decidida depois do piso pronto, é preciso quebrar o piso: isso é o
**retrabalho**.

No código acontece o mesmo: o campo esquecido vira uma migration extra; a
regra decidida tarde muda o schema, o serviço, o formulário e os testes ao
mesmo tempo. A ficha (seção 1) força essas decisões a acontecerem **uma vez,
no papel**, onde mudar é de graça.

## Pré-requisitos

- CI verde na `main` e produção no ar (Fase 06).
- Módulo `projects` funcionando: ele é o **modelo** que vamos copiar.

## Passo a passo

### 1. Preencher a ficha de planejamento (antes de qualquer código)

Copie a ficha abaixo para o PR ou para uma issue e responda **tudo**. Cada
linha evita um tipo de retrabalho.

| # | Pergunta | Por que importa (o retrabalho que evita) |
|---|---|---|
| 1 | Qual é o **recurso** principal? (substantivo no singular) | Vira o nome do modelo, das pastas e da URL |
| 2 | Quais **campos**, com tipo, obrigatoriedade e limite? | Cada campo esquecido = migration nova |
| 3 | Há campo de **dinheiro**, **data** ou **lista fechada** (status, categoria)? | Dinheiro e data têm regras próprias (passo 03); listas viram `enum` |
| 4 | Quais **regras de negócio**? (único, mínimo, máximo, quem pode) | Vão no serviço; decidir tarde muda testes e telas |
| 5 | De quem é o dado? (sempre da **dona**: `ownerId`) | Isolamento entre usuárias desde a primeira linha |
| 6 | Como a lista é **filtrada e ordenada**? (por mês? por status?) | Define o índice do banco e os parâmetros da API |
| 7 | Há **números agregados**? (totais, médias, contagens) | Somas ficam no banco (`groupBy`), com função própria |
| 8 | Quais **telas**? (lista, novo, editar, painel) | Define rotas e componentes |
| 9 | O que acontece ao **excluir**? (some de vez? bloqueia?) | Define `onDelete` e o diálogo de confirmação |

**Ficha do Financeiro (preenchida):**

| # | Resposta |
|---|---|
| 1 | `Transaction` (transação: uma receita ou uma despesa) |
| 2 | `type` (obrigatório), `description` (2–120 caracteres), `amountCents` (inteiro > 0, até R$ 10 milhões), `category` (padrão "Outros"), `occurredOn` (data, sem hora) |
| 3 | Dinheiro: **sim** (`amountCents`). Data: **sim** (`occurredOn`). Listas: `TransactionType` (Receita/Despesa) e `TransactionCategory` (8 categorias fixas) |
| 4 | Valor sempre positivo; o **tipo** diz se soma ou subtrai. Sem nome único (duas despesas "Uber" no mesmo dia são normais) |
| 5 | `ownerId` da sessão; transação de outra pessoa = **404** |
| 6 | Por **mês** (`?month=AAAA-MM`), da data mais recente para a mais antiga |
| 7 | Receitas, despesas e saldo do mês; despesas por categoria |
| 8 | Painel do mês (`/finance`), nova (`/finance/transactions/new`), editar (`/finance/transactions/[id]/edit`) |
| 9 | Exclusão definitiva, com confirmação |

💡 Categorias como `enum` (lista fixa no código) é uma decisão consciente:
é simples e suficiente agora. Se um dia você quiser **criar** categorias pela
tela, elas viram uma tabela própria; isso fica para uma evolução.

### 2. As camadas e a ordem de construção

A ordem é **de baixo para cima**: primeiro o que guarda o dado, por último o
que aparece na tela. Cada camada só usa a de baixo, então cada passo já pode
ser testado sozinho.

| Ordem | Camada | Arquivo (no módulo `<m>`) | Testado por |
|---|---|---|---|
| 1 | Modelo e migration | `prisma/schema.prisma` | `prisma migrate dev` |
| 2 | Utilitários genéricos (se houver) | `src/lib/...` | Unitários |
| 3 | Tipos e schemas | `types/<recurso>.types.ts`, `schemas/<recurso>.schema.ts` | Unitários |
| 4 | Repositório | `repositories/<recurso>.repository.ts` | Integração (banco real) |
| 5 | Serviço | `services/<recurso>.service.ts` | Unitários (com dublê) |
| 6 | API REST | `src/app/api/v1/<m>/...` | E2E (`request`) |
| 7 | Server Actions | `actions/<recurso>.actions.ts` | E2E (tela) |
| 8 | Componentes | `components/<Nome>/<Nome>.tsx` | E2E e axe |
| 9 | Telas | `src/app/(private)/<m>/...` | E2E |
| 10 | Registro | sidebar, dashboard, proxy | E2E de navegação |

### 3. O template de pastas (copie para cada módulo)

```text
src/modules/<m>/
├── index.ts            → exporta schemas e tipos (seguro no navegador)
├── server.ts           → exporta o serviço (import "server-only")
├── types/<recurso>.types.ts        → tipos + rótulos em português
├── schemas/<recurso>.schema.ts     → Zod: create, update (partial), filtros
├── repositories/<recurso>.repository.ts → Prisma, SEMPRE com ownerId
├── services/<recurso>.service.ts   → regras; recebe ownerId da sessão
├── actions/<recurso>.actions.ts    → "use server": sessão → Zod → serviço
└── components/
    ├── <Recurso>Form/              → formulário (Client Component)
    ├── <Recurso>List/              → lista (Server Component)
    └── Delete<Recurso>Button/      → exclusão com confirmação

src/app/(private)/<m>/
├── page.tsx                        → lista ou painel
└── <recursos>/new/page.tsx · <recursos>/[id]/edit/page.tsx

src/app/api/v1/<m>/
└── <recursos>/route.ts · <recursos>/[id]/route.ts
```

**Os 6 "serviços e tipos" de todo módulo** são sempre os mesmos papéis:

| Papel | Pergunta que responde | No Financeiro |
|---|---|---|
| Modelo Prisma | Como o dado é guardado? | `Transaction` |
| Tipos | Como o resto do código chama o dado? | `Transaction`, `MonthlySummary`, rótulos |
| Schemas Zod | O que é uma entrada válida? | `createTransactionSchema`, `updateTransactionSchema`, `monthSchema` |
| Repositório | Como buscar e gravar? | `transactionRepository` |
| Serviço | Quais são as regras? | `listTransactions`, `getMonthlySummary`… |
| Actions | Como a tela chama as regras? | `createTransactionAction`… |

### 4. O contrato da API (igual para todos os módulos)

| Método | Rota | Corpo | Sucesso | Erros |
|---|---|---|---|---|
| `GET` | `/api/v1/<m>/<recursos>` | — | `200 { data: [...] }` | 401 |
| `POST` | `/api/v1/<m>/<recursos>` | JSON do schema de criação | `201 { data: {...} }` | 400, 401, 409 |
| `GET` | `/api/v1/<m>/<recursos>/:id` | — | `200 { data: {...} }` | 400, 401, 404 |
| `PATCH` | `/api/v1/<m>/<recursos>/:id` | JSON parcial | `200 { data: {...} }` | 400, 401, 404, 409 |
| `DELETE` | `/api/v1/<m>/<recursos>/:id` | — | `204` | 400, 401, 404 |

Regras fixas, herdadas da Fase 04:

- Erro sempre como `{ "error": { "code", "message", "fieldErrors"? } }`.
- `ownerId` **nunca** vem do corpo: vem da sessão.
- Recurso de outra pessoa responde **404**, e não 403 (não revela que existe).
- Nomes em inglês e no plural na URL (`transactions`); rótulos em português só na tela.
- Operações extras ganham rota própria e descritiva: no Financeiro, `GET /api/v1/finance/summary`.

### 5. Os 3 lugares onde todo módulo é registrado

| Lugar | Arquivo | Sem ele… |
|---|---|---|
| Menu lateral | `src/components/layout/Sidebar/navigation.ts` | O módulo existe, mas ninguém acha |
| Card do dashboard | `src/modules/dashboard/data/modules.mock.ts` | Some do painel inicial |
| Proxy (primeira barreira de login) | `src/proxy.ts` → `matcher` | A página começa a renderizar antes de redirecionar quem não está logado |

💡 Por que três lugares, e não uma lista só? O `matcher` do proxy precisa ser
um **valor fixo no arquivo**: o Next.js o lê na hora do build, sem executar o
código. Por isso ele não pode importar a lista da sidebar. O passo 11 tem o
checklist para não esquecer nenhum.

### 6. Onde a pessoa usuária "clica"

Depois que o módulo existe, o fluxo de uso é sempre o mesmo:

```text
Sidebar → <Módulo> → botão "Novo <recurso>" → formulário → Salvar
       → volta para a lista/painel com o registro novo
       → ícone de lápis (editar) ou lixeira (excluir, com confirmação)
```

## Arquivos criados ou alterados

Nenhum. Este passo produz a **ficha preenchida** (seção 1).

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Releia a ficha do seu módulo | As 9 linhas têm resposta; nenhuma diz "depois eu vejo" |
| 2 | Compare com o módulo `projects` | Você sabe apontar o arquivo de cada camada da seção 2 |

**Critério de aceite:** a ficha do Financeiro está respondida e você sabe em
qual arquivo cada decisão vai virar código.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Migration nova a cada passo | Campos decididos durante o código | Volte à ficha; acrescente tudo de uma vez |
| Regra repetida na action e na API | Regra fora do serviço | Regra só no serviço; as duas portas chamam o mesmo serviço |
| Módulo aparece mas não protege | Esqueceu o `matcher` do proxy | Passo 11 |

## Commit sugerido

Nenhum (planejamento). Se quiser registrar a ficha:

```bash
git commit --allow-empty -m "docs(finance): ficha de planejamento do módulo Financeiro"
```

## Referências

- [Fase 04 — README (as camadas)](../04-setup-backend/README.md)
- [Next.js — Proxy `matcher`](https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher)

---

← [Índice da fase](README.md) · [Próximo passo](02-modelo-e-migration.md) →
