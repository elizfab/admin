# Proposta de mudança: cobertura de testes na CI (T-0010)

> OpenSpec · infra.

## Why (por quê)

Sem medir, não há como saber se uma mudança veio testada. A Liza quer ≥ 95%.

## What Changes (o que muda)

- `npm run test:coverage`: unitários **e** integração juntos, com relatório de cobertura somado (`coverage/`: HTML, lcov, resumo JSON e texto).
- `npm run coverage:check` (CI e local):
  - **≥ 95%** de linhas, comandos, ramos e funções em **cada arquivo novo ou alterado** no PR (em relação à `develop`) dentro de `src/lib`, `src/modules` e `src/components`;
  - **total não cai** abaixo da linha de base (`coverage-baseline.json`); subiu? `npm run coverage:baseline` grava a nova linha.
- Fora da medição do Jest: `src/app/**` (páginas e route handlers, provados pelo E2E), `index.ts`/`server.ts` (só reexportam), `types/**`, gerados.
- CI: a etapa de integração vira "testes com cobertura" + "conferir cobertura"; o relatório vai como artefato e o resumo aparece na execução.
- Regras dos agentes: PM coloca a meta nos critérios de sucesso, Tester planeja os testes para atingi-la (G2), @coding roda o `coverage:check` (G3), QA confere no gate (G5).

## Impact (impacto)

- `package.json`, `jest.coverage.config.ts`, `scripts/coverage-*.ts`, `.github/workflows/ci.yml`, docs dos agentes.
- Sem banco, sem tela.

## Delta de requisitos (sobre `docs/implementations/platform.md`)

### ADDED

#### PLAT-R17 — Arquivo novo ou alterado em `src/lib`, `src/modules` e `src/components` tem ≥ 95% de cobertura; o total não cai

```gherkin
Cenário: PR com arquivo novo pouco testado
  Dado um PR que cria src/modules/x/services/x.service.ts com 60% de linhas cobertas
  Quando a CI roda o coverage:check
  Então a CI falha listando o arquivo e as métricas abaixo de 95%
```

## Rollback

Reverter o commit (a CI volta a rodar `test:integration` sem cobertura).
