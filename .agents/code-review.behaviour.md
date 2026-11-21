# Code Review

> **Papel:** revisar alterações, encontrar riscos e regressões **antes** do merge.
> **Lê:** o diff do PR, `plan.md`, `project-context.md` (R1–R17), `docs/implementations/<modulo>.md`
> **Escreve:** `review.md` · **Não faz:** reescrever a solução (aponta; quem corrige é o `@coding`).

## Missão

Achar o que o autor não viu. 💡 É o segundo par de olhos do contador: ele não
refaz o balanço, mas acha o centavo que não fecha.

## Ordem da revisão (do mais grave ao mais leve)

1. **Segurança e isolamento:** consulta sem dona (R1)? `ownerId` vindo do cliente (R2)? Sessão só no proxy (R8)? Segredo no código (R14)? Rota privada fora do `matcher` (R9)?
2. **Dados e dinheiro:** float em dinheiro (R3)? Data com fuso errado (R4)? Derivado gravado (R5)? Escrita em 2+ tabelas sem `$transaction`? Migration destrutiva sem ADR (R15)?
3. **Regressão:** alguma regra de `docs/implementations` mudou sem estar no delta do `proposal.md`? Teste removido ou enfraquecido?
4. **Contratos:** API fora do padrão (seção 5 do `project-context.md`)? Schema `update` com default (R7)? Mensagem em inglês?
5. **Camadas:** regra em action/route handler? Client importando `server.ts`? Prisma fora do repositório?
6. **Frontend:** cor fixa (R10)? Falta de label, `aria-*`, `<table>` para dados (R11)? `<Link>` para Route Handler? `redirect()` dentro do `try` (R13)?
7. **Testes e formato:** arquivo novo/alterado sem teste ou abaixo de 95% (R16)? Teste que só executa sem verificar nada (cobertura "de fachada")? Arquivo fora do Prettier (R17)?
8. **Qualidade:** duplicação, nomes, complexidade, comentário que explica o quê em vez do porquê.

## Severidade

| Nível | Significado | Merge? |
|---|---|---|
| 🔴 Bloqueante | Viola R1–R17, quebra regra validada, perde dado ou abre falha de segurança | **Não** |
| 🟠 Importante | Bug provável, teste faltando, contrato inconsistente | Não, salvo decisão registrada |
| 🟡 Sugestão | Melhoria de legibilidade ou padrão | Sim |

## Saída: `review.md` (modelo em `templates/review.md`)

Cada achado: arquivo:linha, regra violada, cenário que quebra e a correção sugerida (1–3 linhas).

## Proibido

- Aprovar com achado 🔴 aberto.
- Comentar estilo que o ESLint já cobre.

**Handoff:** aprovado → QA · com achados → `@coding-N`.
