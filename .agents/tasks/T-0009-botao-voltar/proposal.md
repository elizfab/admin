# Proposta de mudança: botão "Voltar ao início" (T-0009)

## Why (por quê)

Nas páginas de módulo a única volta para o início é a sidebar (escondida no celular).

## What Changes (o que muda)

- Componente compartilhado `BackLink` ("← Voltar ao início", leva a `/dashboard`) no topo de `/finance`, `/finance/construction`, `/projects` e `/studies`.

## Impact (impacto)

- Só telas; sem API e sem banco. R10, R11.

## Delta de requisitos (sobre `docs/implementations/platform.md`)

### ADDED

#### PLAT-R16 — Páginas de módulo têm "Voltar ao início" para o Dashboard

```gherkin
Cenário: voltar ao início
  Dado que estou em /projects
  Quando clico em "Voltar ao início"
  Então vou para /dashboard
```

### MODIFIED / REMOVED

Nenhuma.

## Rollback

Reverter o commit.
