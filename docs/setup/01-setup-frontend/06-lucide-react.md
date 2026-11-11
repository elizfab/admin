# Passo 06 — Lucide React (ícones)

> **Fase:** 01 — Frontend\
> **Tempo estimado:** 15 min\
> **Depende de:** [Passo 05](05-estrutura-de-diretorios.md)

## Objetivo

Instalar o Lucide React e aprender o padrão de uso de ícones do projeto,
incluindo a acessibilidade.

## 💡 Por que

Cada ícone do Lucide é um **componente React** que desenha um SVG. Só os
ícones importados vão para o bundle (*tree-shaking*), então o peso é mínimo.
Usar uma única biblioteca mantém o traço e o tamanho dos ícones consistentes.

## Pré-requisitos

- Passo 05 concluído.

## Passo a passo

### 1. Instalar

```bash
npm install lucide-react
```

### 2. O padrão de acessibilidade

Existem dois casos, e é importante não confundi-los:

| Caso | Exemplo | Como fazer |
|---|---|---|
| **Ícone decorativo**: ao lado de um texto | Ícone de carteira + “Financeiro” | `aria-hidden="true"`: o leitor de tela lê só o texto |
| **Ícone sozinho** em um botão | Botão só com ícone de lixeira | `aria-label` **no botão**, e o ícone com `aria-hidden="true"` |

```tsx
import { Trash2, Wallet } from "lucide-react";

// Decorativo: o texto já descreve
<Wallet size={20} strokeWidth={1.75} aria-hidden="true" />
<span>Financeiro</span>

// Botão só com ícone: o nome acessível fica no botão
<button type="button" aria-label="Excluir projeto">
  <Trash2 size={18} aria-hidden="true" />
</button>
```

💡 Pense no leitor de tela como alguém lendo a página **em voz alta**. Sem o
`aria-hidden`, ele tentaria anunciar um desenho sem significado. Sem o
`aria-label`, um botão só com ícone seria anunciado apenas como “botão”.

### 3. Padrão visual do projeto (ARCHITECTURE.md, seção 8.3)

| Propriedade | Valor padrão |
|---|---|
| `size` em menus | 18 a 20 |
| `strokeWidth` | 1.75 (consistente em todo o projeto) |
| Cor | Herdada do texto (`currentColor`); controlada pelo CSS do componente |

### 4. Teste rápido

Em `src/app/page.tsx` (ainda temporária), adicione:

```tsx
import { LayoutDashboard } from "lucide-react";

export default function HomePage() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Fundação de estilos funcionando</h1>
      <LayoutDashboard size={32} strokeWidth={1.75} aria-hidden="true" />
    </main>
  );
}
```

O ícone será usado de verdade na Sidebar (passo 08).

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `package.json` / `package-lock.json` | Alterado | Dependência `lucide-react` |
| `src/app/page.tsx` | Alterado | Teste temporário do ícone |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run dev` → `localhost:3000` | Ícone de dashboard visível abaixo do título |
| 2 | DevTools → inspecionar o ícone | Um `<svg>` com `aria-hidden="true"` |
| 3 | `npm run typecheck` e `npm run lint` | Sem erros |

**Critério de aceite:** o ícone aparece e os testes 3 passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Module '"lucide-react"' has no exported member` | Nome do ícone errado | Procurar o nome exato em <https://lucide.dev/icons> (PascalCase) |

## Commit sugerido

```bash
git add package.json package-lock.json src/app/page.tsx
git commit -m "feat(ui): adiciona Lucide React"
```

## Referências

- [Lucide React — Guia](https://lucide.dev/guide/react)
- [Lucide — catálogo de ícones](https://lucide.dev/icons)
- ARCHITECTURE.md, seção 8

---

← [Passo anterior](05-estrutura-de-diretorios.md) · [Índice da fase](README.md) · [Próximo passo](07-radix-ui.md) →
