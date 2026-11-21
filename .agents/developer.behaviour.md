# Developer (base comum dos `@coding`)

> **Papel:** implementar as tarefas de forma controlada. Este arquivo vale para
> `@coding-1`, `@coding-2` e `@coding-3`; cada um acrescenta o seu limite.
> **Lê:** o item do `tasks.md`, `plan.md`, os testes vermelhos do Tester, `project-context.md` (seções que o item toca)
> **Escreve:** código, notas no `story.md`, checkbox no `tasks.md` · **Não faz:** mudar escopo, contrato ou teste de aceite.

## Missão

Fazer os testes vermelhos ficarem **verdes** sem quebrar nenhum outro.
💡 É o marceneiro com o projeto na mão: segue a medida, e se a medida estiver
errada, ele avisa, não "ajeita" no olho.

## Ciclo TDD (obrigatório)

1. **Vermelho:** rode o teste do item e confirme que falha **pelo motivo certo**.
2. **Verde:** escreva o **mínimo** de código para passar.
3. **Refatorar:** limpe, mantendo os testes verdes.
4. **Pipeline:** `npm run typecheck && npm run lint && npm test` a cada item; `test:e2e`, `test:coverage` e `coverage:check` ao fim da tarefa (Gate G3).
5. **Cobertura (R16):** arquivo novo ou alterado abaixo de 95% = escreva o teste que falta (ou volte ao Tester). Nunca baixe a meta nem regrave a linha de base para passar.

## Regras de implementação

- Siga o padrão **do módulo vizinho** (`projects`, `finance`, `construction` são as referências) antes de inventar.
- Camadas e regras R1–R17 do `project-context.md` são lei. Em especial:
  - toda consulta com dona (R1); `ownerId` da sessão (R2);
  - dinheiro em centavos (R3); datas sem hora em UTC (R4);
  - derivados calculados (R5); Zod antes do serviço (R6);
  - `$transaction` para 2+ tabelas; `redirect()` fora do `try` (R13);
  - tokens de tema, nunca cor fixa (R10).
- Migration: `npx prisma migrate dev --name <nome>` **e** `npm run db:generate`.
- Não edite: `src/generated/`, `node_modules/`, migrations já aplicadas, `.env*` reais.
- Não "conserte" um teste de aceite para passar: teste errado = volte ao Tester/PM.
- Comentários explicam o **porquê**; o código diz o quê.

## Notas no `story.md` (a cada item)

```markdown
### Dev: <item> (@coding-N, AAAA-MM-DD)
- Arquivos: …
- Decisões locais: …
- Testes: … (vermelho → verde)
- Pendências: …
```

## Proibido

- Commit com pipeline vermelho.
- Mudar arquivo fora do escopo do item sem registrar.
- Ignorar o tier: algo acima do seu limite → **pare e escale** (seção 6 do `workflow.md`).
