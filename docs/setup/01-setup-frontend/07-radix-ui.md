# Passo 07 — Radix UI (primeiro wrapper: DropdownMenu)

> **Fase:** 01 — Frontend\
> **Tempo estimado:** 30 min\
> **Depende de:** [Passo 06](06-lucide-react.md)

## Objetivo

Instalar o Radix UI e criar o primeiro **wrapper** do projeto, um
`DropdownMenu` estilizado com SCSS Modules, que será usado no menu do
usuário no Header (passo 08).

## 💡 Por que

Fazer um menu suspenso acessível “do zero” é difícil: abrir com `Enter`,
navegar com as setas, fechar com `Esc`, devolver o foco ao botão, anunciar
corretamente para leitores de tela… O Radix entrega **o comportamento**
pronto e testado, sem nenhum visual. É como comprar um carro com motor e
freios prontos, mas sem pintura: a pintura (SCSS) é do projeto.

### Por que um *wrapper*

O wrapper é uma camada fina entre o Radix e o resto do projeto:

- aplica o visual padrão uma vez só, sem repetir classes em toda tela;
- define padrões (ex.: `sideOffset={8}`, `align="end"`);
- isola o projeto da biblioteca: se a API do Radix mudar, só o wrapper muda.

### Pacote unificado `radix-ui`

A documentação atual do Radix recomenda o pacote único `radix-ui`, que contém
todos os primitives. Só o que é importado vai para o bundle. Não misture com
os pacotes individuais antigos (`@radix-ui/react-*`).

## Pré-requisitos

- Passo 06 concluído.

## Passo a passo

### 1. Instalar

```bash
npm install radix-ui
```

### 2. Criar a pasta do componente

```bash
mkdir -p src/components/ui/DropdownMenu
```

### 3. Componente — `DropdownMenu.tsx`

`src/components/ui/DropdownMenu/DropdownMenu.tsx`:

```tsx
"use client";

import type { ComponentProps } from "react";
import { DropdownMenu as Primitive } from "radix-ui";

import { cn } from "@/lib/utils/cn";

import styles from "./DropdownMenu.module.scss";

// O Radix cuida de comportamento (teclado, foco, ARIA).
// Este wrapper só aplica a identidade visual do projeto.

export const DropdownMenu = Primitive.Root;
export const DropdownMenuTrigger = Primitive.Trigger;

export function DropdownMenuContent({
  className,
  sideOffset = 8,
  align = "end",
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        className={cn(styles.content, className)}
        sideOffset={sideOffset}
        align={align}
        {...props}
      />
    </Primitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof Primitive.Item>) {
  return <Primitive.Item className={cn(styles.item, className)} {...props} />;
}

export function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof Primitive.Label>) {
  return <Primitive.Label className={cn(styles.label, className)} {...props} />;
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof Primitive.Separator>) {
  return (
    <Primitive.Separator className={cn(styles.separator, className)} {...props} />
  );
}
```

| Trecho | Explicação |
|---|---|
| `"use client"` | Menus reagem a cliques e teclado, então precisam rodar no navegador |
| `Primitive.Root` / `Trigger` | Reexportados sem mudança: não têm visual próprio |
| `ComponentProps<typeof Primitive.Content>` | O wrapper aceita **todas** as props originais do Radix, com tipos corretos |
| `className` desestruturado + `cn(...)` | Permite estender o estilo sem perder o padrão |
| `Primitive.Portal` | Renderiza o menu no fim do `<body>`, evitando que seja cortado por `overflow: hidden` |

### 4. Estilos — `DropdownMenu.module.scss`

`src/components/ui/DropdownMenu/DropdownMenu.module.scss`:

```scss
@use "@/styles/abstracts" as *;

.content {
  min-width: 200px;
  padding: $space-1;
  background: var(--card-background);
  border: 1px solid var(--border);
  border-radius: $radius-md;
  box-shadow: 0 8px 24px rgb(32 31 37 / 12%);
}

.item {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  font-size: $font-size-sm;
  border-radius: $radius-sm;
  outline: none;
  cursor: pointer;
  user-select: none;

  // O Radix marca o item com foco de teclado/mouse com data-highlighted.
  &[data-highlighted] {
    color: var(--accent-color);
    background: var(--selection-color);
  }

  &[data-disabled] {
    color: var(--text-color-secondary);
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.label {
  padding: $space-2 $space-3;
  font-size: $font-size-xs;
  color: var(--text-color-secondary);
}

.separator {
  height: 1px;
  margin: $space-1 0;
  background: var(--border);
}
```

💡 O Radix comunica estados por **atributos `data-*`**
(`data-highlighted`, `data-disabled`, `data-state="open"`). O SCSS estiliza
esses atributos, sem JavaScript extra.

### 5. Como será usado (prévia do passo 08)

```tsx
<DropdownMenu>
  <DropdownMenuTrigger>Abrir</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Opção</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Critério para os próximos wrappers (ARCHITECTURE.md, seção 7.5)

Crie o wrapper de outro primitive (Dialog, Select, Tooltip…) **somente quando
uma tela precisar dele**, seguindo este mesmo modelo de pasta:

```text
src/components/ui/<Nome>/
├── <Nome>.tsx
└── <Nome>.module.scss
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `package.json` / `package-lock.json` | Alterado | Dependência `radix-ui` |
| `src/components/ui/DropdownMenu/DropdownMenu.tsx` | Criado | Wrapper do primitive |
| `src/components/ui/DropdownMenu/DropdownMenu.module.scss` | Criado | Visual do menu |

## ✅ Como testar

O teste visual e de teclado acontece no passo 08, quando o menu entrar no
Header. Agora:

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run typecheck` | Sem erros (confirma que os tipos das props do Radix estão corretos) |
| 2 | `npm run lint` | Sem erros |
| 3 | `npm run build` | Build sem erros (confirma que o SCSS compila) |

**Critério de aceite:** os três comandos passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `useContext` / `createContext` só funciona em Client Component | Falta `"use client"` no wrapper | Primeira linha do arquivo deve ser `"use client";` |
| Menu aparece cortado | Sem `Portal` | Manter `Primitive.Portal` no `DropdownMenuContent` |

## Commit sugerido

```bash
git add package.json package-lock.json src/components/ui
git commit -m "feat(ui): adiciona Radix UI e wrapper de DropdownMenu"
```

## Referências

- [Radix Primitives — Getting started](https://www.radix-ui.com/primitives/docs/overview/getting-started)
- [Radix — Dropdown Menu](https://www.radix-ui.com/primitives/docs/components/dropdown-menu)
- [Radix — Styling](https://www.radix-ui.com/primitives/docs/guides/styling)
- ARCHITECTURE.md, seção 7

---

← [Passo anterior](06-lucide-react.md) · [Índice da fase](README.md) · [Próximo passo](08-layout-base.md) →
