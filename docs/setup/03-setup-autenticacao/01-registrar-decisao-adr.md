# Passo 01 — Registrar a decisão (ADR-006)

> **Fase:** 03 — Autenticação\
> **Tempo estimado:** 15 min\
> **Depende de:** [Fase 02 concluída](../02-setup-banco-prisma/README.md)

## Objetivo

Revisar e versionar o ADR que registra a troca do Auth.js pelo Better Auth.

## 💡 Por que registrar decisões

Um ADR (*Architecture Decision Record*) é a **ata da reunião**: daqui a um
ano, quando alguém (inclusive você) perguntar “por que não usamos Auth.js?”,
a resposta está escrita, com o contexto da época, as alternativas e as
consequências aceitas. Sem ADR, as decisões viram folclore.

Formato usado: **Contexto → Decisão → Alternativas → Consequências**.

## Pré-requisitos

- Fase 02 concluída.

## Passo a passo

### 1. Ler o ADR

Abra [`docs/decisions/ADR-006-autenticacao-better-auth.md`](../../decisions/ADR-006-autenticacao-better-auth.md)
e confira se o contexto e as consequências refletem a sua decisão.

### 2. Conferir o registro na arquitetura

No `ARCHITECTURE.md`, a seção 11 e a tabela de ADRs (seção 25) já apontam
para o ADR-006 como **Aceita**.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `docs/decisions/ADR-006-autenticacao-better-auth.md` | Revisado | Decisão registrada |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Ler o ADR | Contexto, decisão, alternativas e consequências compreendidos |

**Critério de aceite:** você consegue explicar, com suas palavras, por que o
Better Auth foi escolhido e quais cuidados ele traz.

## Commit sugerido

```bash
git add docs/decisions
git commit -m "docs(adr): registra ADR-006 - autenticação com Better Auth"
```

## Referências

- [ADR — Michael Nygard (formato original)](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)

---

[Índice da fase](README.md) · [Próximo passo](02-instalar-configurar-better-auth.md) →
