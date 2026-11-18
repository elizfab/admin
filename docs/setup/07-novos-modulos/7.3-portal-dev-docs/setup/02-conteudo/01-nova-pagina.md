# Passo 01 — Nova página

> **Fase:** 02 — Conteúdo\
> **Tempo estimado:** 15 min\
> **Depende de:** [Fase 01](../01-ambiente-e-estrutura/README.md)

## Objetivo

Criar uma página nova a partir do modelo, com o cabeçalho (*front matter*) certo.

## 💡 Por que um modelo

💡 O modelo é o **formulário em branco** da secretaria: todas as fichas têm os
mesmos campos na mesma ordem, então quem lê sabe onde procurar. Toda página do
portal segue a mesma ordem: Sobre → Introdução → Instalação → Comandos → Boas
práticas → Exemplos → Links.

## Pré-requisitos

- `npm start` rodando.

## Passo a passo

### 1. Copiar o modelo

```bash
cd frontend
cp templates/doc-template.mdx docs/<categoria>/<topico>.mdx
```

Exemplo: `cp templates/doc-template.mdx docs/backend/rust.mdx`.

### 2. Preencher o *front matter*

`frontend/templates/doc-template.mdx`:

````text
---
title: "Nome do tópico"
sidebar_position: 1
description: "Resumo de uma linha sobre o tópico."
---

{/* Copie este arquivo para docs/<categoria>/<topico>.mdx e preencha. */}

<TechIcon icon="devicon/devicon-original" alt="Nome do tópico" />

<Badge color="blue">rascunho</Badge>

:::info[Sobre]
O que é, para que serve e quando usar.
:::

## Introdução

Contexto e conceitos principais.

## Instalação / Configuração

<Tabs groupId="os">
  <TabItem value="linux" label="Linux" default>

  ```bash
  sudo apt install -y pacote
  ```

  </TabItem>
  <TabItem value="macos" label="macOS">

  ```bash
  brew install pacote
  ```

  </TabItem>
  <TabItem value="windows" label="Windows">

  ```powershell
  winget install --id Fornecedor.Pacote -e
  ```

  </TabItem>
</Tabs>

## Comandos principais

```bash title="Comandos"
comando --versao
```

## Boas práticas

:::tip
Recomendação.
:::

:::warning
Armadilha comum.
:::

## Exemplos práticos

## Links úteis

- [Documentação oficial](https://exemplo.com)
````

| Campo | Para quê |
|---|---|
| `title` | Título da página e da aba do navegador |
| `sidebar_position` | Ordem dentro da categoria (menor = mais acima) |
| `description` | Resumo usado na busca, nos cards da categoria e no SEO |
| `slug` (opcional) | URL diferente do nome do arquivo (ex.: `slug: /intro`) |
| `sidebar_label` (opcional) | Texto mais curto só na sidebar |

### 3. Links entre páginas

Use o **caminho do arquivo**, relativo, com a extensão:

```mdx
Veja também [Docker](../containers/docker.mdx).
```

💡 Com o caminho do arquivo, o Docusaurus calcula a URL final (com o
`/portal/` na frente) e **acusa no build** se o arquivo não existir. Uma URL
escrita à mão (`/portal/docs/...`) quebraria se o endereço do portal mudasse.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `frontend/docs/<categoria>/<topico>.mdx` | Criado | A página nova |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm start` | A página aparece na sidebar, na posição do `sidebar_position` |
| 2 | Página da categoria | Um card novo com a `description` |
| 3 | `npm run build` | Sem `Broken link` |

**Critério de aceite:** os 3 testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Could not parse expression with acorn` | `{` ou `<` soltos no texto (no MDX, viram código) | Use `` `{chave}` `` em código, ou `\{` |
| Comentário `<!-- -->` dá erro | MDX não aceita comentário HTML | Use `{/* comentário */}` |
| Página não aparece | Arquivo fora de `frontend/docs/` ou com extensão errada | `.md` ou `.mdx` dentro de `frontend/docs/` |

## Commit sugerido

```bash
git add frontend/docs/<categoria>/<topico>.mdx
git commit -m "docs(<categoria>): adiciona <topico>"
```

## Referências

- [Docusaurus — Docs front matter](https://docusaurus.io/docs/api/plugins/@docusaurus/plugin-content-docs#markdown-front-matter)
- [Docusaurus — MDX](https://docusaurus.io/docs/markdown-features/react)

---

← [Índice da fase](README.md) · [Próximo passo](02-categorias-e-sidebar.md) →
