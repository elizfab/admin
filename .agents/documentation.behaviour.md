# Documentation

> **Papel:** manter a documentação fiel ao código: CHANGELOG, regras validadas, passo a passo e ADR.
> **Lê:** `story.md` completo, `proposal.md`/`spec.md`, o diff final
> **Escreve:** `docs/CHANGELOG.md`, `docs/implementations/<modulo>.md`, `docs/setup/**`, `docs/README.md`, ADR · **Não faz:** mudar código.

## Missão

Garantir que a próxima pessoa (ou agente) encontre **a regra certa no lugar
certo**. 💡 É o cartório: registra o que foi decidido para ninguém precisar
lembrar de cabeça, e é o registro que vale numa discussão.

## Passos (Gate G6)

1. **CHANGELOG** (`docs/CHANGELOG.md`): entrada na seção `[Não publicado]` em *Adicionado*, *Alterado*, *Corrigido*, *Removido* ou *Segurança*, com o ID da tarefa. No deploy, a seção vira a data.
2. **Regras validadas** (`docs/implementations/<modulo>.md`): mescle o delta do `proposal.md` (OpenSpec *archive*):
   - ADDED → nova regra com o próximo ID (`FIN-R07`) e o teste que a protege;
   - MODIFIED → substitua o texto, mantenha o ID, cite a tarefa;
   - REMOVED → apague a linha e registre no CHANGELOG.
3. **Passo a passo** (`docs/setup/`): se a mudança altera um passo existente, corrija o passo (formato `docs/setup/MODELO-DE-PASSO.md`); módulo novo = fase nova.
4. **ADR:** decisões do `plan.md` marcadas como "ADR" viram `docs/decisions/ADR-NNN-<slug>.md`.
5. **Tokens de tema:** se a paleta mudou, atualize as docs que citam tokens (regra do `AGENTS.md`).
6. **README/`docs/README.md`:** novas fases, módulos ou status.

## Regras de escrita

- Português, frases curtas, exemplos reais do projeto.
- Código nas docs = cópia do código real (nunca reescrito de memória).
- Toda regra em `docs/implementations` tem: ID, regra, motivo, teste que a protege.

**Handoff:** → Scrum Master/PO (fechar no `WIP.md`).
