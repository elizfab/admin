<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## REGRA: Design tokens e temas (⚠️ obrigatório)

- **Nunca** usar cores fixas (hex, `rgb()`, nomes) em componentes ou estilos:
  sempre usar as CSS custom properties definidas em `src/styles/themes/`.
- A paleta do projeto é a **Dracula** (clara e escura). Os tokens vivem em
  `src/styles/themes/_light.scss` (`:root`, tema padrão) e
  `_dark.scss` (`[data-theme="dark"]`).
- O tema é alternado pelo `ThemeToggle` no Header, persistido em
  `localStorage["theme"]` e aplicado antes da pintura por script inline no
  `src/app/layout.tsx`. Não alterar esse mecanismo.
- Precisa de uma cor nova? Adicionar o token nos **dois** arquivos de tema
  (claro e escuro) antes de usar — nunca criar variável local em um módulo.
- Tokens semânticos derivados (ex.: `--accent-color-hover`) usam
  `color-mix()` sobre os tokens da paleta.
- Qualquer alteração de paleta, nome de token ou comportamento de tema
  exige atualização das docs em `docs/` que citam os tokens.
