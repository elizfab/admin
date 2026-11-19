# Plano técnico: botão "Voltar ao início" (T-0009)

| Requisito | Camada | Arquivo |
|---|---|---|
| PLAT-R16 | Componente compartilhado | `src/components/shared/BackLink/BackLink.tsx` + `.module.scss` |
| PLAT-R16 | Telas | `finance/page.tsx`, `finance/construction/page.tsx`, `projects/page.tsx`, `studies/page.tsx` |

- `<Link>` (rota de página) com ícone `ArrowLeft` `aria-hidden` e texto visível (nome acessível = texto).
- Testes: `tests/unit/components/shared/BackLink.test.tsx`; E2E em `navigation.spec.ts` (as 4 páginas).

## Tier

**@coding-1**.
