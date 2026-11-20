# T-0019 — Header em componentes, cada um com a sua pasta e responsabilidades separadas

| Campo | Valor |
|---|---|
| Tipo | change (refatoração, sem mudar comportamento) |
| Módulos | plataforma (layout) |
| Tamanho | M |
| Tier | @coding-2 |
| Estado (Kanban) | Pronto p/ deploy (na develop; produção pelo PR #11) |
| Criada em | 2026-11-19 |
| Branch / PR | `feature/t-0019-header-componentes` · sem commit (pedido da Liza) |

## Pedido (palavras da Liza)

> Separar as responsabilidades do tema (constantes, tipos, utils, hook `useTheme`, componente
> `ThemeToggle`), abstraindo todos os componentes do Header, cada um no seu diretório, com
> testes; remover os estilos do Header que não são dele e colocar no componente a que pertencem.
> Não comitar nem fazer push.

## Análise (Analyst, 2026-11-19)

**Situação atual:** a Liza já moveu o `ThemeToggle` para `Header/ThemeToggle/` (com o
`.iconButton` no SCSS próprio e o antigo comentado no `Header.module.scss`), mas o
`ThemeToggle.tsx` ainda mistura tipo, constantes, acesso ao DOM/localStorage, assinatura de
eventos e o botão. O `UserMenu.tsx` está solto em `Header/` e usa estilos do `Header.module.scss`
(`.userButton`, `.userName`). Há um `ThemeToggle.test.tsx` vazio dentro de `src/` e o teste real
fica em `tests/unit/components/layout/ThemeToggle.test.tsx` (importando o caminho antigo).
**Regras validadas tocadas:** PLAT-R11 (tokens de tema), PLAT-R12 (axe). O mecanismo de tema
(`localStorage["theme"]` + script inline no `src/app/layout.tsx`) **não muda** (regra do `AGENTS.md`).
**Regras do projeto em jogo:** R10, R11, R16 (Header.tsx e UserMenu.tsx estavam com 0% de
cobertura: como são alterados, precisam chegar a ≥ 95%), R17.

## Proposta (OpenSpec, enxuta)

- **What Changes:** só organização; nenhum comportamento muda.

| Pasta / arquivo | Responsabilidade |
|---|---|
| `Header/Header.tsx`, `Header.module.scss`, `Header.types.ts` | Barra do topo: título e área de ações (só os estilos dela) |
| `Header/ThemeToggle/theme.constants.ts` | Chave do localStorage, nome do evento, temas e rótulos |
| `Header/ThemeToggle/theme.types.ts` | Tipo `Theme` e o retorno do hook |
| `Header/ThemeToggle/theme.utils.ts` | Ler, aplicar e observar o tema (DOM, localStorage, eventos) |
| `Header/ThemeToggle/useTheme.ts` | Liga o React ao tema (`useSyncExternalStore`) e expõe `toggleTheme` |
| `Header/ThemeToggle/ThemeToggle.tsx` (+ `.module.scss`) | Botão, ícone e acessibilidade |
| `Header/UserMenu/UserMenu.tsx` (+ `.module.scss`, `UserMenu.types.ts`) | Menu da conta (estilos `.userButton`/`.userName` saem do Header) |
| `Header/UserMenu/useSignOut.ts` | Encerrar a sessão e ir para o login |

- **Testes:** em `tests/unit/components/layout/Header/` (padrão do projeto: testes em `tests/unit/**`).
- **Delta de regras:** nenhuma regra validada muda.
- **Rollback:** reverter os arquivos.

## Tier

**@coding-2** (vários arquivos de um mesmo componente; sem banco, sem API).

## Testes (Tester, 2026-11-19)

| Cenário | Teste | Estado |
|---|---|---|
| Ler/aplicar/observar o tema, localStorage indisponível | `tests/unit/components/layout/Header/theme.utils.test.ts` | 🔴 → ✅ |
| Hook: tema inicial, alternar, setTheme, troca externa | `useTheme.test.ts` | 🔴 → ✅ |
| Botão: rótulos, alternância, persistência, ícone decorativo | `ThemeToggle.test.tsx` (movido de `tests/unit/components/layout/`) | ✅ |
| Menu da conta: nome, Perfil desabilitado, Sair | `UserMenu.test.tsx` | 🔴 → ✅ |
| Sair: signOut → /login → refresh, nessa ordem | `useSignOut.test.ts` | 🔴 → ✅ |
| Header: banner com título, tema e conta | `Header.test.tsx` | ✅ |

## Dev (@coding-2, 2026-11-19)

- Arquivos: ver tabela da proposta. `UserMenu.tsx` movido para `UserMenu/`; `ThemeToggle.test.tsx` vazio
  dentro de `src/` removido (os testes ficam em `tests/unit/**`, padrão do projeto).
- Decisão local: `*.types.ts` sai da meta de cobertura (`scripts/coverage-rules.ts` e
  `jest.coverage-scope.mjs`), igual às pastas `types/`: arquivo só de tipos não tem código para executar
  (o `coverage:check` cobrava 0%).
- Cobertura: todos os arquivos do Header com 100% (linhas, comandos, ramos, funções); total 44,01% → 46,52%
  (nova linha de base).
- Mecanismo do tema intacto: mesma chave `theme`, mesmo evento, script inline do `src/app/layout.tsx` sem mudança.

## Gates

| Gate | Estado | Evidência |
|---|---|---|
| G1 Spec | ✅ | Pedido da Liza |
| G2 Testes vermelhos | ✅ | 4 arquivos de teste falharam por "módulo não existe" |
| G3 Pipeline verde | ✅ | typecheck, lint, 224 unit, 55 E2E (inclui axe nos dois temas), 251 com cobertura, coverage:check |
| G4 Review | ⬜ | No PR (depois do commit da Liza) |
| G5 QA | ⬜ | No PR |
| G6 Registro | ✅ | CHANGELOG, `project-context.md` §6 (convenção de pastas), PLAT-R17 |

## Handoffs

### Handoff: @coding-2 → Liza (2026-11-19)
- Feito: tudo acima, **sem commit e sem push** (pedido da Liza).
- Pendente: `src/app/(private)/finance/page.tsx` tem uma mudança da Liza (linha em branco) fora do formato; o pre-commit corrige ao comitar.
- Próximo passo: revisar o diff, comitar e dar push (o PR para a develop abre sozinho).
