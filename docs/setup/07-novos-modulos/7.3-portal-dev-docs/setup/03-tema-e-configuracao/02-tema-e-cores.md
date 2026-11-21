# Passo 02 — Tema e cores

> **Fase:** 03 — Tema e configuração\
> **Tempo estimado:** 20 min\
> **Depende de:** [Passo 01](01-docusaurus-config.md)

## Objetivo

Mudar cores, fontes e componentes visuais do portal mantendo os dois temas
(claro e escuro) legíveis.

## 💡 Variáveis de cor, como no Admin

O tema mora em `frontend/src/css/custom.css`. Há dois tipos de variável:

| Prefixo | De quem é | Exemplo |
|---|---|---|
| `--ifm-*` | Do Infima, o CSS base do Docusaurus | `--ifm-color-primary` (laranja da marca) |
| `--pd-*` | Do Portal Dev (paleta própria) | `--pd-green`, `--pd-surface` |

A regra é a mesma do Admin: **nenhuma cor fixa** em componentes; sempre uma
variável, definida no `:root` (claro) **e** no `[data-theme='dark']` (escuro).
💡 É a lista de tintas do pintor: se a parede pede "verde-folha", a cor exata
muda conforme a luz do ambiente (tema), mas o nome da tinta é o mesmo.

## Pré-requisitos

- Passo 01 concluído.

## Passo a passo

### 1. A paleta (tema claro)

`frontend/src/css/custom.css`, início do arquivo:

```css
/* ---------- Paleta ---------- */
:root {
  /* Marca */
  --pd-orange: #f75f00;
  --pd-pink: #e8367a;
  --pd-red: #e5383b;
  --pd-purple: #8b5cf6;
  --pd-green: #16a34a;
  --pd-blue: #2f80ed;
  --pd-cyan: #0ea5b7;
  --pd-yellow: #eab308;

  --ifm-color-primary: #f75f00;
  --ifm-color-primary-dark: #de5600;
  --ifm-color-primary-darker: #d25100;
  --ifm-color-primary-darkest: #ad4300;
  --ifm-color-primary-light: #ff6d12;
  --ifm-color-primary-lighter: #ff761f;
  --ifm-color-primary-lightest: #ff8f47;

  /* Tipografia */
  --ifm-font-family-base: 'Open Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --ifm-heading-font-family: 'Open Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --ifm-font-family-monospace: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --ifm-heading-font-weight: 700;
  --ifm-line-height-base: 1.7;
  --ifm-code-font-size: 90%;

  /* Superfícies */
  --ifm-background-color: #ffffff;
  --pd-surface: #fff7f2;
  --pd-border: #f1e4dc;
  --ifm-navbar-shadow: 0 1px 0 var(--pd-border);
  --ifm-global-radius: 0.6rem;
  --ifm-code-border-radius: 0.4rem;
  --ifm-link-color: #d25100;
  --ifm-toc-border-color: var(--pd-border);

  /* Código */
  --docusaurus-highlighted-code-line-bg: rgba(247, 95, 0, 0.12);
  --pd-code-error-bg: rgba(229, 56, 59, 0.14);
  --pd-code-success-bg: rgba(22, 163, 74, 0.14);
  --pd-inline-code-color: #c2185b;
  --pd-inline-code-bg: #fdf0f5;

  /* Alertas (admonitions) */
  --ifm-color-info: var(--pd-blue);
  --ifm-color-success: var(--pd-green);
  --ifm-color-warning: var(--pd-orange);
  --ifm-color-danger: var(--pd-red);
}
```

O bloco `[data-theme='dark']`, logo abaixo, redefine as mesmas variáveis com
tons mais claros (para fundo escuro).

### 2. Mudar a cor principal

O Docusaurus usa **sete** tons da cor primária (`-dark`, `-darker`… `-lightest`).
Gere os sete com o gerador oficial (link nas referências) a partir da cor base,
e cole nos dois temas.

### 3. Nova cor de apoio

1. Acrescente `--pd-<nome>` no `:root` e no `[data-theme='dark']`.
2. Use `var(--pd-<nome>)` no componente.
3. Se for uma cor de `Badge`, acrescente o nome em `BadgeColor`
   (`src/components/Badge/index.tsx`) e a classe em `styles.module.css`.

### 4. Home e cards de categoria

A home (`src/pages/index.tsx`) mostra o `CategoryGrid`. Cada card tem título,
descrição, rota, ícone do Devicon e uma cor `var(--pd-*)`; edite a lista
`categories` em `src/components/CategoryGrid/index.tsx`.

## Arquivos criados ou alterados

Nenhum (referência).

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Alternar o tema com o botão sol/lua | Texto, alertas e código legíveis nos dois |
| 2 | `npm run build` | Sem erros |

**Critério de aceite:** toda cor nova existe nos dois temas.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Cor certa no claro, ilegível no escuro | Variável só no `:root` | Defina também em `[data-theme='dark']` |
| Botões com tons "quebrados" | Só a `--ifm-color-primary` foi trocada | Troque os sete tons |

## Commit sugerido

```bash
git add frontend/src
git commit -m "style(tema): <o que mudou>"
```

## Referências

- [Docusaurus — Styling and layout](https://docusaurus.io/docs/styling-layout)
- [Docusaurus — Gerador de cores primárias](https://docusaurus.io/docs/styling-layout#styling-your-site-with-infima)
- [Infima](https://infima.dev/)

---

← [Passo anterior](01-docusaurus-config.md) · [Índice da fase](README.md) · [Fase 04](../04-integracao-admin/README.md) →
