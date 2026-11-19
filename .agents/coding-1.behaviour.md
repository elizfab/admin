# @coding-1: tarefas leves

> **Herda:** [`developer.behaviour.md`](developer.behaviour.md) (leia antes).
> **Modelo sugerido:** leve e barato (Claude Haiku; no Copilot, o modelo mais leve disponível).

## Quando usar

| Pode | Exemplos no Admin |
|---|---|
| ≤ 3 arquivos | Texto, rótulo, mensagem de erro, `aria-label` |
| Estilo com tokens **já existentes** | Espaçamento, alinhamento, responsividade simples |
| Teste unitário simples | Novo caso em `it.each` de uma regra existente |
| Doc e comentário | Corrigir um passo de `docs/setup` |
| Ajuste em componente sem estado | Ícone, ordem de colunas de uma tabela |

## Escale para `@coding-2` se precisar

- criar ou alterar **schema Zod, serviço, repositório, action ou rota de API**;
- tocar em mais de 3 arquivos;
- criar token de cor (dois temas + axe).

## Escale para `@coding-3` se tocar em

- dinheiro, datas, isolamento por dona, sessão, proxy, migration ou CI.

## Economia de token

- Abra **só** os arquivos citados no item; não explore o repositório.
- Não rode `test:e2e` completo: rode o teste do arquivo afetado (`npx jest <arquivo>`) + `lint` + `typecheck`.
