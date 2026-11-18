# Passo 01 — `docusaurus.config.ts`

> **Fase:** 03 — Tema e configuração\
> **Tempo estimado:** 20 min\
> **Depende de:** [Fase 02](../02-conteudo/README.md)

## Objetivo

Entender cada bloco da configuração do portal, para mudar o que precisar sem
quebrar o resto.

## 💡 Um arquivo que roda no Node, não no navegador

O `docusaurus.config.ts` é lido **no build** (Node.js). Por isso ele pode ler
variáveis de ambiente (`process.env.PORTAL_URL`) e **não** pode usar nada do
navegador (`window`, `localStorage`, JSX). 💡 É a planta da casa: ela é usada
pela construtora, não pelos moradores.

## Pré-requisitos

- Fase 02 concluída.

## Passo a passo

### 1. O arquivo completo (já com a fase 04)

`frontend/docusaurus.config.ts`:

```ts
import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const repoUrl = 'https://github.com/elizfab/portal-dev';

// O portal é servido PELO ADMIN, em <admin>/portal/, só para quem está logado.
// Os valores vêm do ambiente para o mesmo build funcionar local e em produção:
//   PORTAL_URL      → origem do Admin (ex.: https://admin-elizabetefabri.vercel.app)
//   PORTAL_BASE_URL → caminho do portal dentro do Admin (sempre com "/" no fim)
const siteUrl = process.env.PORTAL_URL ?? 'http://localhost:3000';
const baseUrl = process.env.PORTAL_BASE_URL ?? '/portal/';

const config: Config = {
  title: 'Portal Dev',
  tagline: 'Caderno de estudos: documentação técnica de frontend, backend, cloud, DevOps e muito mais.',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
    faster: true,
  },

  url: siteUrl,
  baseUrl,
  trailingSlash: false,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR'],
  },

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['pt', 'en'],
        indexBlog: false,
        docsRouteBasePath: '/docs',
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  headTags: [
    { tagName: 'link', attributes: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
    { tagName: 'link', attributes: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' } },
    { tagName: 'link', attributes: { rel: 'icon', type: 'image/png', sizes: '32x32', href: `${baseUrl}img/favicon-32x32.png` } },
    { tagName: 'link', attributes: { rel: 'icon', type: 'image/png', sizes: '16x16', href: `${baseUrl}img/favicon-16x16.png` } },
    { tagName: 'link', attributes: { rel: 'apple-touch-icon', sizes: '180x180', href: `${baseUrl}img/apple-touch-icon.png` } },
    { tagName: 'meta', attributes: { name: 'theme-color', content: '#F75F00' } },
  ],

  stylesheets: [
    'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400..800;1,400..800&family=JetBrains+Mono:wght@400;600&display=swap',
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: `${repoUrl}/tree/main/frontend/`,
          showLastUpdateTime: true,
          breadcrumbs: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    metadata: [
      { name: 'keywords', content: 'documentação, estudos, devops, cloud, frontend, backend, linux, kubernetes' },
    ],
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
    announcementBar: {
      id: 'em-construcao',
      content: '🚧 Portal em construção: novos conteúdos são adicionados continuamente.',
      isCloseable: true,
    },
    navbar: {
      title: 'Portal Dev',
      hideOnScroll: true,
      logo: {
        alt: 'Logo Portal Dev',
        src: 'img/logo.png',
        srcDark: 'img/logo-white.png',
      },
      items: [
        { type: 'docSidebar', sidebarId: 'docsSidebar', position: 'left', label: 'Documentação' },
        {
          type: 'dropdown',
          label: 'Categorias',
          position: 'left',
          items: [
            { label: 'Gestão de projetos', to: '/docs/gestao-projetos' },
            { label: 'Frontend', to: '/docs/frontend' },
            { label: 'Backend', to: '/docs/backend' },
            { label: 'Cloud', to: '/docs/cloud' },
            { label: 'DevOps', to: '/docs/devops' },
            { label: 'Release & Rollout', to: '/docs/release' },
            { label: 'Containers', to: '/docs/containers' },
            { label: 'Observabilidade', to: '/docs/observability' },
            { label: 'Sistemas Operacionais', to: '/docs/operatingsystems' },
            { label: 'Metodologias', to: '/docs/methodologies' },
          ],
        },
        { to: '/docs/guia-de-estilo', label: 'Guia de estilo', position: 'left' },
        // URL absoluta: o Docusaurus não acrescenta o baseUrl, então volta ao Admin.
        { href: `${siteUrl}/dashboard`, label: '← Admin', position: 'right', target: '_self' },
        {
          href: repoUrl,
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'Repositório no GitHub',
        },
      ],
    },
    footer: {
      style: 'dark',
      logo: {
        alt: 'Logo Portal Dev',
        src: 'img/logo-white.png',
        width: 48,
        height: 48,
      },
      links: [
        {
          title: 'Desenvolvimento',
          items: [
            { label: 'Frontend', to: '/docs/frontend' },
            { label: 'Backend', to: '/docs/backend' },
            { label: 'Metodologias', to: '/docs/methodologies' },
          ],
        },
        {
          title: 'Infraestrutura',
          items: [
            { label: 'Cloud', to: '/docs/cloud' },
            { label: 'DevOps', to: '/docs/devops' },
            { label: 'Release & Rollout', to: '/docs/release' },
            { label: 'Containers', to: '/docs/containers' },
            { label: 'Observabilidade', to: '/docs/observability' },
          ],
        },
        {
          title: 'Sistemas',
          items: [
            { label: 'Linux', to: '/docs/operatingsystems/linux' },
            { label: 'Windows', to: '/docs/operatingsystems/windows' },
            { label: 'macOS e WSL2', to: '/docs/operatingsystems/others' },
          ],
        },
        {
          title: 'Projeto',
          items: [
            { label: 'Guia de estilo', to: '/docs/guia-de-estilo' },
            { label: 'GitHub', href: repoUrl },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Portal Dev · Elizabete Fabri`,
    },
    prism: {
      theme: prismThemes.oneLight,
      darkTheme: prismThemes.oneDark,
      additionalLanguages: [
        'bash',
        'powershell',
        'batch',
        'docker',
        'hcl',
        'yaml',
        'json',
        'java',
        'go',
        'python',
        'sql',
        'groovy',
        'ini',
        'toml',
        'nginx',
        'diff',
        'ruby',
      ],
      magicComments: [
        { className: 'theme-code-block-highlighted-line', line: 'highlight-next-line', block: { start: 'highlight-start', end: 'highlight-end' } },
        { className: 'code-block-error-line', line: 'error-next-line', block: { start: 'error-start', end: 'error-end' } },
        { className: 'code-block-success-line', line: 'success-next-line', block: { start: 'success-start', end: 'success-end' } },
      ],
    },
    mermaid: {
      theme: { light: 'neutral', dark: 'dark' },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
```

### 2. Mapa dos blocos

| Bloco | O que controla | Quando mexer |
|---|---|---|
| `siteUrl`, `baseUrl` | Endereço do portal **dentro do Admin** (vêm do ambiente) | Nunca à mão; fase 04 |
| `onBrokenLinks: 'throw'` | Build **falha** com link quebrado | Nunca relaxe: é a sua rede de segurança |
| `i18n` | Idioma `pt-BR` (datas, textos do tema) | — |
| `markdown.mermaid` + `themes` | Diagramas Mermaid | — |
| `@easyops-cn/docusaurus-search-local` | Busca local em português e inglês, sem serviço externo | Ajustes de busca |
| `headTags`, `stylesheets` | Favicons, cor do navegador, fontes Open Sans e JetBrains Mono | Trocar fontes ou ícones |
| `presets.classic.docs` | `editUrl` ("Editar esta página"), data da última atualização, breadcrumbs | — |
| `themeConfig.colorMode` | Tema escuro por padrão, respeitando o sistema | — |
| `announcementBar` | Faixa do topo ("Portal em construção") | Mude o `id` ao mudar o texto, para reaparecer a quem fechou |
| `navbar.items` | Menu: Documentação, Categorias, Guia de estilo, **← Admin**, GitHub | Nova categoria (fase 02) |
| `footer.links` | Colunas do rodapé | Nova categoria |
| `prism` | Temas de código, linguagens extras, comentários mágicos | Nova linguagem em blocos de código |

💡 A busca (`docusaurus-search-local`) gera o índice **no build**
(`search-index.json`). Por isso ela só funciona no `npm run serve` e, no
Admin, esse arquivo também passa pela verificação de sessão.

## Arquivos criados ou alterados

Nenhum (referência).

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Troque o texto do `announcementBar` e o `id`; `npm start` | A faixa nova aparece (mesmo se você tinha fechado a antiga) |
| 2 | Desfaça a mudança | — |

**Critério de aceite:** você sabe dizer qual bloco mudar para cada item da tabela.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `window is not defined` no build | Código de navegador no config | Leve a lógica para um componente em `src/` |
| Linguagem sem cor nos blocos de código | Não está em `prism.additionalLanguages` | Acrescente o nome da linguagem do Prism |

## Commit sugerido

Nenhum (referência).

## Referências

- [Docusaurus — `docusaurus.config.js`](https://docusaurus.io/docs/api/docusaurus-config)
- [Docusaurus — Theme configuration](https://docusaurus.io/docs/api/themes/configuration)
- [docusaurus-search-local](https://github.com/easyops-cn/docusaurus-search-local)

---

← [Índice da fase](README.md) · [Próximo passo](02-tema-e-cores.md) →
