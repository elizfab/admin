# Passo 02 — Estrutura do projeto

> **Fase:** 01 — Ambiente e estrutura\
> **Tempo estimado:** 15 min\
> **Depende de:** [Passo 01](01-instalar-e-rodar.md)

## Objetivo

Saber, para cada tipo de mudança, **qual arquivo** editar.

## 💡 As três camadas do portal

💡 Pense num livro: o **texto** (conteúdo `.mdx`), a **diagramação** (tema,
cores, componentes) e a **ficha catalográfica** (configuração: título,
menu, endereço). Mudar o texto não exige mexer na diagramação.

| Quero… | Edito… | Fase |
|---|---|---|
| Escrever ou corrigir conteúdo | `frontend/docs/<categoria>/<topico>.mdx` | 02 |
| Criar uma categoria | Pasta nova com `_category_.json` e `index.mdx` | 02 |
| Mudar cores, fontes, alertas | `frontend/src/css/custom.css` | 03 |
| Mudar o menu, o rodapé, a busca | `frontend/docusaurus.config.ts` | 03 |
| Criar um componente para os `.mdx` | `frontend/src/components/` + `src/theme/MDXComponents.tsx` | 02 |
| Mudar a home | `frontend/src/pages/index.tsx` e `src/components/CategoryGrid` | 03 |
| Mudar como o portal chega ao Admin | `.github/workflows/deploy.yml`, `scripts/write-build-info.mjs` | 04 |

## Pré-requisitos

- Passo 01 concluído.

## Passo a passo

### 1. O site (`frontend/`)

```text
frontend/
├── docs/                    # conteúdo (uma pasta por categoria)
│   ├── intro.mdx            # página inicial da documentação (slug /intro)
│   ├── guia-de-estilo.mdx   # vitrine de TODOS os componentes e alertas
│   └── <categoria>/
│       ├── _category_.json  # rótulo e posição na sidebar
│       ├── index.mdx        # página da categoria (lista os cards)
│       └── <topico>.mdx
├── templates/doc-template.mdx  # modelo para novas páginas
├── src/
│   ├── components/          # Badge, TechIcon, CategoryGrid
│   ├── css/custom.css       # tema (cores, alertas, código)
│   ├── pages/index.tsx      # home
│   └── theme/MDXComponents.tsx  # componentes globais nos .mdx
├── scripts/write-build-info.mjs  # gera o portal-build.json (fase 04)
├── i18n/pt-BR/code.json     # traduções da busca
├── static/img/              # logos, favicons e social card
├── sidebars.ts              # sidebar gerada a partir das pastas
└── docusaurus.config.ts     # configuração geral
```

### 2. A pasta `documentation/` (raiz)

São as anotações **antigas**, em Markdown puro, de antes do Docusaurus. O site
**não** as lê. Elas ficam como fonte histórica; ao migrar um assunto para
`frontend/docs/`, use-as como rascunho.

## Arquivos criados ou alterados

Nenhum.

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Responder: onde mudo a cor laranja principal? | `frontend/src/css/custom.css` (`--ifm-color-primary`) |
| 2 | Responder: onde mudo o menu "Categorias"? | `frontend/docusaurus.config.ts` → `navbar.items` |

**Critério de aceite:** você responde as duas perguntas sem procurar.

## Commit sugerido

Nenhum.

## Referências

- [Docusaurus — Project structure](https://docusaurus.io/docs/installation#project-structure)

---

← [Passo anterior](01-instalar-e-rodar.md) · [Índice da fase](README.md) · [Fase 02](../02-conteudo/README.md) →
