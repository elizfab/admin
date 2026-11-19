# Proposta de mudança: Financeiro em abas (T-0008)

> OpenSpec · mudança em algo existente.

## Why (por quê)

Os atalhos "Obra" e "Nova transação" disputam o canto do cabeçalho e não deixam claro que
Obra é uma **seção** do Financeiro. Abas mostram as seções e onde a Liza está.

## What Changes (o que muda)

- Abaixo de "Receitas, despesas, saldo e obra.", uma barra de abas: **Transações** (`/finance`) e **Obra** (`/finance/construction`), com o conteúdo dentro de um container.
- "Nova transação" sai do cabeçalho e vai para dentro da aba Transações, à esquerda, acima do mês.
- `/finance/construction` passa a usar o mesmo cabeçalho "Financeiro" + abas (aba Obra ativa); o título "Obras" vira o título da seção.

## Impact (impacto)

- Telas: `/finance`, `/finance/construction`. Sem API, sem banco.
- Regras R1–R15 em jogo: R10, R11.

## Delta de requisitos (sobre `docs/implementations/finance.md`)

### ADDED

#### FIN-R11 — Navegação por abas Transações | Obra, com a aba atual marcada

```gherkin
Cenário: ir para a Obra pela aba
  Dado que estou em /finance
  Então a aba "Transações" está marcada como atual
  Quando clico na aba "Obra"
  Então vou para /finance/construction
  E a aba "Obra" está marcada como atual

Cenário: nova transação dentro da aba
  Dado que estou na aba Transações
  Então o link "Nova transação" está dentro do conteúdo da aba, à esquerda
```

### MODIFIED

Nenhuma regra existente.

### REMOVED

Nenhuma.

## Rollback

Reverter o commit (só tela).
