# Passo 04 — Sass e SCSS Modules (design tokens)

> **Fase:** 01 — Frontend\
> **Tempo estimado:** 40 a 60 min\
> **Depende de:** [Passo 03](03-eslint.md)

## Objetivo

Instalar o Sass, trocar o CSS padrão pela arquitetura de estilos do projeto
(tokens, tema, mixins, base) e deixar o `globals.scss` carregado pelo layout
raiz.

## 💡 Por que

### SCSS Modules

Imagine que cada componente tem seu **próprio armário** de roupas: a classe
`.title` do Card não se mistura com a `.title` do Header. É isso que o
`*.module.scss` faz: o Next.js renomeia as classes para nomes únicos (ex.:
`Card_title__x7k2`), evitando colisões. O Sass adiciona variáveis, mixins e
aninhamento.

### Por que dividir em `abstracts`, `base` e `themes`

| Pasta | Conteúdo | Gera CSS? |
|---|---|---|
| `abstracts/` | Variáveis Sass e mixins (ferramentas) | **Não**; só é usada por outros arquivos |
| `themes/` | Cores em CSS custom properties (`--color-*`) | Sim, uma vez, no global |
| `base/` | Reset, tipografia e acessibilidade globais | Sim, uma vez, no global |

### Por que as cores ficam em `--color-*`, e não em `$color-*`

- **Variável Sass (`$space-4`)** é resolvida na **compilação** e vira um valor
  fixo no CSS final. É ótima para espaçamentos, bordas e breakpoints.
- **CSS custom property (`--color-primary`)** existe no **navegador** e pode
  mudar em tempo de execução. Um tema escuro futuro só redefine as variáveis,
  sem recompilar nada.

### Por que mobile-first

O estilo base é escrito para o celular; o mixin `up("lg")` *adiciona* ajustes
para telas maiores (`min-width`). Sai mais simples do que escrever para o
desktop e depois desfazer no celular.

## Pré-requisitos

- Passo 03 concluído.

## Passo a passo

### 1. Instalar o Sass

```bash
npm install -D sass
```

💡 Não existe servidor de Sass separado: o Next.js compila os arquivos `.scss`
durante o `dev` e o `build`.

### 2. Criar as pastas de estilos

```bash
mkdir -p src/styles/abstracts src/styles/base src/styles/themes
```

### 3. Tokens estáticos — `_variables.scss`

💡 O `_` no início do nome indica um *partial*: arquivo que não vira CSS
sozinho e só existe para ser importado.

`src/styles/abstracts/_variables.scss`:

```scss
// Design tokens estáticos (compilados pelo Sass).
// Cores ficam em CSS custom properties (themes/), pois mudam com o tema.

// Espaçamentos (escala de 4px)
$space-1: 4px;
$space-2: 8px;
$space-3: 12px;
$space-4: 16px;
$space-5: 24px;
$space-6: 32px;
$space-7: 48px;

// Bordas
$radius-sm: 6px;
$radius-md: 10px;
$radius-lg: 16px;

// Tipografia
$font-size-xs: 0.75rem;
$font-size-sm: 0.875rem;
$font-size-md: 1rem;
$font-size-lg: 1.25rem;
$font-size-xl: 1.5rem;

// Layout
$sidebar-width: 260px;
$sidebar-width-collapsed: 72px;
$header-height: 64px;

// Breakpoints (mobile-first: valores mínimos)
$breakpoints: (
  "md": 768px,
  "lg": 1024px,
);
```

### 4. Mixins — `_mixins.scss`

`src/styles/abstracts/_mixins.scss`:

```scss
@use "sass:map";
@use "variables" as vars;

// Mobile-first: aplica estilos a partir do breakpoint informado.
@mixin up($breakpoint) {
  $value: map.get(vars.$breakpoints, $breakpoint);

  @if not $value {
    @error "Breakpoint `#{$breakpoint}` não existe em $breakpoints.";
  }

  @media (min-width: $value) {
    @content;
  }
}

// Anel de foco visível e consistente para navegação por teclado.
@mixin focus-ring {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

// Esconde visualmente, mas mantém o conteúdo para leitores de tela.
@mixin visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

// Desfaz o visually-hidden (ex.: mostrar o texto a partir de um breakpoint).
@mixin visually-shown {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

| Mixin | Uso |
|---|---|
| `up("md")` / `up("lg")` | Estilos a partir do tablet (768px) / desktop (1024px) |
| `focus-ring` | Contorno de foco visível para navegação por teclado |
| `visually-hidden` | Esconde da tela, mas mantém para leitores de tela |
| `visually-shown` | Desfaz o `visually-hidden` em um breakpoint |

### 5. Ponto único de importação — `_index.scss`

`src/styles/abstracts/_index.scss`:

```scss
// Ponto único de entrada: `@use "<caminho>/abstracts" as *;`
@forward "variables";
@forward "mixins";
```

💡 `@forward` reexporta. Assim, cada módulo faz **um único**
`@use "@/styles/abstracts" as *;` e ganha acesso a variáveis e mixins.

### 6. Tema claro — `themes/_light.scss`

`src/styles/themes/_light.scss`:

```scss
// Tema claro: cores como CSS custom properties.
// Um tema escuro futuro só precisa redefinir estas variáveis.
:root {
  --color-primary: #4b3fd1;
  --color-primary-hover: #3a2fb0;
  --color-primary-soft: #eeedfd;

  --color-background: #f7f7fb;
  --color-surface: #ffffff;
  --color-border: #e8e7ee;

  --color-text: #201f25;
  --color-muted: #64626e;

  --color-danger: #c62828;
  --color-focus: #4b3fd1;
}
```

> O tom de `--color-muted` (`#64626e`) foi escolhido para atingir contraste
> mínimo de 4.5:1 (WCAG AA) sobre o fundo `#f7f7fb`.

### 7. Base global — reset, tipografia e acessibilidade

`src/styles/base/_reset.scss`:

```scss
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

img,
svg {
  display: block;
  max-width: 100%;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font: inherit;
}
```

`src/styles/base/_typography.scss`:

```scss
@use "../abstracts" as *;

body {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-size: $font-size-md;
  line-height: 1.5;
  color: var(--color-text);
  background: var(--color-background);
}

h1,
h2,
h3 {
  margin: 0;
  line-height: 1.2;
}
```

💡 `--font-geist-sans` é criada pela fonte Geist no `layout.tsx` (via
`next/font`), que já veio configurada pelo `create-next-app`.

`src/styles/base/_accessibility.scss`:

```scss
@use "../abstracts" as *;

:focus-visible {
  @include focus-ring;
}

// Respeita usuários que pedem menos animação no sistema operacional.
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

// Esconde visualmente, mas mantém para leitores de tela.
.visually-hidden {
  @include visually-hidden;
}
```

> O `!important` aqui é a exceção aceita à regra “evitar `!important`”
> (ARCHITECTURE.md, seção 6.7): a preferência de acessibilidade do usuário
> precisa vencer qualquer animação.

### 8. Substituir o CSS padrão por `globals.scss`

Remova os arquivos CSS gerados pelo `create-next-app`:

```bash
rm src/app/globals.css src/app/page.module.css
```

Crie `src/app/globals.scss`:

`src/app/globals.scss`:

```scss
// Estilos globais: apenas base, tema e acessibilidade.
// Estilos de componentes ficam em *.module.scss junto do componente.
@use "../styles/themes/light";
@use "../styles/base/reset";
@use "../styles/base/typography";
@use "../styles/base/accessibility";
```

No `src/app/layout.tsx`, troque a importação do CSS:

```tsx
// antes
import "./globals.css";

// depois
import "./globals.scss";
```

Na mesma tag `<html>`, troque o idioma:

```tsx
<html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
```

### 9. Página inicial temporária

A página padrão (`src/app/page.tsx`) importava o `page.module.css`, que foi
removido. Substitua o conteúdo por uma versão temporária, que será trocada no
passo 08:

```tsx
export default function HomePage() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Fundação de estilos funcionando</h1>
      <p>Texto com a cor muted e a fonte Geist.</p>
    </main>
  );
}
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/styles/abstracts/_variables.scss` | Criado | Tokens estáticos |
| `src/styles/abstracts/_mixins.scss` | Criado | Mixins (breakpoints, foco, acessibilidade) |
| `src/styles/abstracts/_index.scss` | Criado | Reexporta variáveis e mixins |
| `src/styles/themes/_light.scss` | Criado | Cores do tema claro |
| `src/styles/base/_reset.scss` | Criado | Normalização entre navegadores |
| `src/styles/base/_typography.scss` | Criado | Fonte, tamanhos e cores do texto |
| `src/styles/base/_accessibility.scss` | Criado | Foco, movimento reduzido, `.visually-hidden` |
| `src/app/globals.scss` | Criado | Entrada dos estilos globais |
| `src/app/globals.css`, `src/app/page.module.css` | Removidos | Substituídos pelo SCSS |
| `src/app/layout.tsx` | Alterado | Importa `globals.scss` e usa `lang="pt-BR"` |
| `src/app/page.tsx` | Alterado | Página temporária |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run dev` → `localhost:3000` | Fundo cinza-claro (`#f7f7fb`), texto escuro, fonte Geist |
| 2 | Teclar `Tab` na página | Nenhum erro (ainda não há elementos focáveis) |
| 3 | DevTools → Elements → `<html>` → Computed | Variáveis `--color-primary` etc. presentes em `:root` |
| 4 | `npm run build` | Build sem erros |
| 5 | `npm run lint` e `npm run typecheck` | Sem erros |

**Critério de aceite:** testes 1, 4 e 5 passam.

### Experimento (opcional): ver o erro do mixin

Em `globals.scss`, adicione temporariamente:

```scss
@use "../styles/abstracts" as *;
body { @include up("xl") { color: red; } }
```

O `npm run dev` mostra um erro contendo ``Breakpoint `xl` não existe em $breakpoints``.
💡 O mixin protege contra breakpoints digitados errado. **Remova** o trecho
depois.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Module not found: Can't resolve './globals.css'` | O `layout.tsx` ainda importa o CSS antigo | Trocar para `./globals.scss` (item 8) |
| `Can't resolve './page.module.css'` | O `page.tsx` padrão ainda importa o arquivo removido | Substituir o `page.tsx` (item 9) |
| `Can't find stylesheet to import` | Caminho do `@use` errado | Caminhos de `@use` são relativos ao arquivo atual, ou usam o alias `@/` |
| `Undefined variable` | O arquivo não fez `@use` dos abstracts | Adicionar `@use "@/styles/abstracts" as *;` no topo |
| Aviso de `@import` obsoleto | Uso da sintaxe legada | Usar sempre `@use` / `@forward` |

## Commit sugerido

```bash
git add src/styles src/app package.json package-lock.json
git commit -m "feat(styles): adiciona Sass, design tokens, tema claro e estilos base"
```

## Referências

- [Next.js — Sass](https://nextjs.org/docs/app/guides/sass)
- [Sass — @use](https://sass-lang.com/documentation/at-rules/use/) e [@forward](https://sass-lang.com/documentation/at-rules/forward/)
- [MDN — CSS custom properties](https://developer.mozilla.org/pt-BR/docs/Web/CSS/Using_CSS_custom_properties)
- ARCHITECTURE.md, seção 6

---

← [Passo anterior](03-eslint.md) · [Índice da fase](README.md) · [Próximo passo](05-estrutura-de-diretorios.md) →
