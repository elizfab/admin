# Passo 10 — Rotina, depuração e validação final

> **Fase:** 05 — Testes E2E\
> **Tempo estimado:** 30 min\
> **Depende de:** [Passo 09](09-testes-integracao.md)

## Objetivo

Aprender as ferramentas de **investigação** do Playwright (modo UI,
relatório e trace), definir quando rodar cada tipo de teste e fechar a fase.

## 💡 Por que

Um teste que falha sem explicar **por quê** é só um alarme sem endereço. O
Playwright grava evidências (print, vídeo de cada passo, rede, console)
justamente das execuções que falham, e é isso que transforma “quebrou” em
“quebrou **aqui**, por **isto**”.

## Ferramentas de depuração

| Comando | Para quê |
|---|---|
| `npm run test:e2e:ui` | **Modo UI**: lista os testes, roda um por vez e mostra cada passo com print. O melhor para escrever e investigar |
| `npx playwright test --headed` | Roda com o navegador **visível** |
| `npx playwright test --debug` | Pausa em cada ação (Playwright Inspector) |
| `npm run test:e2e:report` | Abre o relatório HTML da última execução |
| `npx playwright show-trace test-results/<pasta>/trace.zip` | Abre o **trace** de uma falha: linha do tempo, DOM, rede e console de cada passo |
| `npx playwright codegen http://localhost:3000` | Grava cliques e gera o código do teste (bom ponto de partida) |

💡 O trace é a **caixa-preta do avião**: depois do acidente, mostra cada
instante antes da queda.

## Quando rodar cada tipo de teste

| Momento | Comandos | Tempo aproximado |
|---|---|---|
| A cada alteração (enquanto programa) | `npm test` (ou `npm run test:watch`) | Segundos |
| Antes de cada commit | `npm run typecheck && npm run lint && npm test` | Menos de 1 minuto |
| Antes de juntar uma funcionalidade (merge) | + `npm run test:integration` + `npm run test:e2e` | 1 a 2 minutos |
| Depois de mexer em autenticação | + `bash scripts/security-check.sh` (Fase 03) | 1 minuto |
| A cada push no GitHub | Tudo, automaticamente no CI | Fase 06 |

## Passo a passo: validação final da fase

### 1. Bateria completa

```bash
npm run db:up
npm run typecheck && npm run lint && npm test
npm run test:integration
npm run test:e2e
```

### 2. Repetibilidade

Rode `npm run test:e2e` **mais uma vez**, logo em seguida. Deve passar de
novo: o banco é limpo a cada execução, inclusive o contador de rate limit.

### 3. Explorar uma falha (exercício)

1. Introduza o bug do passo 07 no repositório.
2. Rode `npx playwright test isolation.spec`.
3. Abra o relatório: `npm run test:e2e:report`, clique no teste que falhou
   e depois em **Trace**.
4. Veja a requisição que respondeu `200` onde deveria ser `404`.
5. Desfaça o bug.

## ✅ Checklist final da fase

**Automático**

- [x] `npm run typecheck` e `npm run lint`: sem erros e sem avisos
- [x] `npm test`: **32 testes** (unitários)
- [x] `npm run test:integration`: **4 testes**
- [x] `npm run test:e2e`: **22 testes** (2 setups + 20)
- [x] Segunda execução do E2E também passa

**Provas do alarme** (cada uma falha com o bug e passa sem ele)

- [x] Isolamento: E2E (passo 07) **e** integração (passo 09)
- [x] Formulário mantém o texto (passo 06)
- [x] Contraste de cor (passo 08)
- [x] Trava `_test` recusa o `admin_dev` (passo 03)

**Critério de aceite:** todos os itens marcados. **A Fase 05 está concluída.**

## Commit sugerido

```bash
git commit --allow-empty -m "test: conclui fase 05 (E2E e integração)"
git tag fase-05-testes
```

Atualize o status no [README da fase](README.md) e no [mapa geral](../../README.md).

## Referências

- [Playwright — UI Mode](https://playwright.dev/docs/test-ui-mode)
- [Playwright — Trace viewer](https://playwright.dev/docs/trace-viewer)
- [Playwright — Debugging](https://playwright.dev/docs/debug)
- [Playwright — Codegen](https://playwright.dev/docs/codegen)
- ARCHITECTURE.md, seções 17.3 e 22.5

---

← [Passo anterior](09-testes-integracao.md) · [Índice da fase](README.md) · Próxima fase: [06 — Deploy](../06-setup-deploy/README.md) →
