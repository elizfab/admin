# Fase 01 — Setup do Frontend

> **Objetivo da fase:** aplicação Next.js funcionando localmente, com
> TypeScript strict, ESLint, SCSS Modules, design tokens, Lucide, Radix,
> layout administrativo responsivo, dashboard com dados mockados e os
> primeiros testes unitários.\
> **Tempo estimado:** 4 a 6 horas, divididas em várias sessões\
> **Mapa geral:** [`docs/README.md`](../../README.md)\
> **Arquitetura:** ARCHITECTURE.md, Partes I e II e seções 16, 21 (Fases 0 e 1) e 24

## Por que esta fase vem primeiro

💡 É como montar a vitrine e os corredores de uma loja antes de abastecer o
estoque. Com o frontend pronto (usando dados de mentira, os “mocks”), você
valida navegação, layout e componentes sem depender de banco ou login. As
fases seguintes só trocam o mock por dados reais.

## Ordem dos passos

| # | Passo | O que entrega | Status |
|---|---|---|---|
| 01 | [Criar a aplicação Next.js](01-criar-app-nextjs.md) | Projeto rodando em `localhost:3000` | ⬜ |
| 02 | [TypeScript strict](02-typescript-strict.md) | Verificação de tipos com `npm run typecheck` | ⬜ |
| 03 | [ESLint](03-eslint.md) | `npm run lint` e `lint:fix` | ⬜ |
| 04 | [Sass e SCSS Modules](04-sass-scss-modules.md) | Tokens, tema, mixins e `globals.scss` | ⬜ |
| 05 | [Estrutura de diretórios](05-estrutura-de-diretorios.md) | Pastas por responsabilidade, `cn()` e `.env.example` | ⬜ |
| 06 | [Lucide React](06-lucide-react.md) | Biblioteca de ícones | ⬜ |
| 07 | [Radix UI](07-radix-ui.md) | Wrapper acessível de DropdownMenu | ⬜ |
| 08 | [Layout base](08-layout-base.md) | Layout raiz, layout privado, Sidebar e Header | ⬜ |
| 09 | [Dashboard mockado e estados](09-dashboard-mockado.md) | Cards dos módulos, páginas, loading, erro e vazio | ⬜ |
| 10 | [Jest e primeiros testes](10-jest-primeiros-testes.md) | 7 testes unitários passando | ⬜ |
| 11 | [Validação final e README](11-validacao-final.md) | Checklist completo e README do projeto | ⬜ |

## Checklist da fase

Fundação (Fase 0 da arquitetura):

- [ ] Aplicação Next.js criada na raiz de `_admin`
- [ ] TypeScript strict confirmado
- [ ] ESLint configurado e passando
- [ ] SCSS configurado
- [ ] Estrutura inicial de diretórios criada
- [ ] `.env.example` criado e versionado

Frontend base (Fase 1 da arquitetura):

- [ ] Tokens de design definidos
- [ ] SCSS Modules em uso nos componentes
- [ ] Lucide React instalado e em uso
- [ ] Radix UI instalado, com o primeiro wrapper
- [ ] Layout raiz e layout privado
- [ ] Sidebar e Header
- [ ] Dashboard com dados mockados
- [ ] Responsividade (celular, tablet e desktop)
- [ ] Estados de loading, vazio e erro
- [ ] Jest configurado, com testes passando
- [ ] README do projeto e commit final

## ✅ Critério de conclusão da fase

Todos estes comandos terminam **sem erro**:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Além disso, `npm run dev` mostra o dashboard navegável em
`http://localhost:3000`, com layout adaptado ao celular e ao desktop.

## Estrutura ao final da fase

```text
_admin/
├── docs/
├── public/
├── src/
│   ├── app/
│   │   ├── (private)/
│   │   │   ├── dashboard/   (page, loading, estilos)
│   │   │   ├── studies/  finance/  pdi/  projects/
│   │   │   ├── error.tsx
│   │   │   ├── layout.tsx
│   │   │   └── layout.module.scss
│   │   ├── globals.scss
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── layout/   (Sidebar, Header)
│   │   ├── shared/   (EmptyState)
│   │   └── ui/       (DropdownMenu)
│   ├── lib/utils/cn.ts
│   ├── modules/dashboard/   (components, data, types)
│   └── styles/   (abstracts, base, themes)
├── tests/unit/
├── .env.example
├── AGENTS.md
├── eslint.config.mjs
├── jest.config.ts
├── jest.setup.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

← Fase anterior: [00 — Ambiente](../00-setup-ambiente/README.md) · [Mapa geral](../../README.md) · Próxima fase: [02 — Banco e Prisma](../02-setup-banco-prisma/README.md) →
