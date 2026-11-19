# Economia de tokens (regras para todos os agentes)

> Cada token lido custa dinheiro **e** espaço de contexto (quanto mais cheio, pior
> o raciocínio). 💡 Ler o repositório inteiro para mudar um botão é como ler a
> enciclopédia inteira para achar uma palavra: o índice (grafo) e o marcador de
> página (pasta da tarefa) resolvem.

## A escada do contexto (suba só o necessário)

| Degrau | O que ler | Quando |
|---|---|---|
| 1 | `AGENTS.md` (já carregado pela ferramenta) | Sempre |
| 2 | `.agents/<seu-agente>.behaviour.md` | Ao assumir um papel |
| 3 | Pasta da tarefa (`story.md` e o artefato do seu passo) | Sempre que houver tarefa |
| 4 | `graphify-out/GRAPH_REPORT.md` → `graphify query "…"` | Antes de qualquer busca no código |
| 5 | Seções de `project-context.md` que a tarefa toca | Ao decidir/implementar |
| 6 | Arquivos de código apontados pelo grafo | Só os necessários |
| 7 | `docs/setup/**`, `ARCHITECTURE.md` | Só se o passo acima não respondeu |

## Regras

1. **Grafo antes de `grep`.** Pergunte ao Graphify onde algo mora (`graphify query`, `graphify explain`, `graphify path`) antes de abrir arquivos. Configuração: [`docs/agents/graphify.md`](../docs/agents/graphify.md).
2. **Tier certo.** Tarefa pequena vai para `@coding-1` (modelo barato). Modelo forte só no tier 3.
3. **Estado em arquivo, não em conversa.** Retome pela pasta da tarefa; não peça para "relembrar tudo".
4. **Leia trechos, não arquivos.** Abra o intervalo de linhas que interessa; arquivos grandes (`schema.prisma`, `ARCHITECTURE.md`) nunca inteiros sem motivo.
5. **Nunca leia:** `node_modules/`, `.next/`, `src/generated/`, `package-lock.json`, `playwright-report/`, `test-results/`, `coverage/`, `graphify-out/cache/`, `.portal/`.
6. **Testes focados durante o trabalho** (`npx jest <arquivo>`, `npx playwright test <spec> --retries=0`); pipeline completo só no Gate G3.
7. **Saída curta.** Nos artefatos: tabelas e listas, sem repetir o que já está em outro arquivo (cite o caminho).
8. **Uma tarefa por sessão.** Ao terminar um papel, escreva o handoff e comece outra sessão para o próximo agente (o contexto antigo não vai junto).
9. **Compacte cedo.** No Claude Code, use `/compact` ao trocar de etapa dentro da mesma tarefa; no Copilot/Devin, abra nova conversa citando a pasta da tarefa.
