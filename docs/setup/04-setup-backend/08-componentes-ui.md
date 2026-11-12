# Passo 08 — Componentes de UI: Button, AlertDialog e PageHeader

> **Fase:** 04 — Backend\
> **Tempo estimado:** 40 min\
> **Depende de:** [Passo 07](07-server-actions.md)

## Objetivo

Criar três componentes reutilizáveis que as telas de projetos precisam:
`Button`, `AlertDialog` (Radix) e `PageHeader`.

## 💡 Por que agora

Regra da seção 7.5: **criar o wrapper quando uma tela precisar dele**. A
exclusão de projeto é uma ação destrutiva e precisa de confirmação: chegou a
hora do `AlertDialog`. As telas novas também precisam de botões padronizados
e de um cabeçalho de página consistente.

| Componente | Pasta | Por quê |
|---|---|---|
| `Button` | `components/ui` | Visual único de botão (primário, secundário, perigo) |
| `AlertDialog` | `components/ui` | Confirmação acessível; **não fecha ao clicar fora** (exige uma escolha) |
| `PageHeader` | `components/shared` | Título + ação principal, igual em todas as páginas |

### `buttonClassName`: o mesmo visual para `<button>` e `<Link>`

“Novo projeto” **navega** (é um link); “Salvar” **envia** (é um botão).
Semanticamente são elementos diferentes, mas visualmente iguais. A função
`buttonClassName()` aplica as classes do botão a um `<Link>`.

💡 Usar `<button onClick={() => router.push(...)}>` para navegar quebraria
o “abrir em nova aba” e confundiria o leitor de tela.

## Pré-requisitos

- Passo 07 concluído.

## Passo a passo

### 1. Button

```bash
mkdir -p src/components/ui/Button src/components/ui/AlertDialog src/components/shared/PageHeader
```

`src/components/ui/Button/Button.tsx`:

```tsx
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

import styles from "./Button.module.scss";

export type ButtonVariant = "primary" | "secondary" | "danger";

/** Classes do botão, para reutilizar em <Link> com aparência de botão. */
export function buttonClassName(variant: ButtonVariant = "primary", className?: string) {
  return cn(styles.button, styles[variant], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant };

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClassName(variant, className)} {...props} />;
}
```

💡 `type = "button"` como padrão: um `<button>` sem `type` dentro de um
formulário **envia o formulário**. É uma fonte clássica de bugs.

`src/components/ui/Button/Button.module.scss`:

```scss
@use "@/styles/abstracts" as *;

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  padding: $space-2 $space-4;
  font-size: $font-size-sm;
  font-weight: 600;
  line-height: 1.5;
  border: 1px solid transparent;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: background-color 150ms ease;

  &:focus-visible {
    @include focus-ring;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.primary {
  color: #ffffff;
  background: var(--color-primary);

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }
}

.secondary {
  color: var(--color-text);
  background: var(--color-surface);
  border-color: var(--color-border);

  &:hover:not(:disabled) {
    background: var(--color-background);
  }
}

.danger {
  color: #ffffff;
  background: var(--color-danger);

  &:hover:not(:disabled) {
    background: #a31f1f;
  }
}
```

### 2. AlertDialog

`src/components/ui/AlertDialog/AlertDialog.tsx`:

```tsx
"use client";

import type { ComponentProps } from "react";
import { AlertDialog as Primitive } from "radix-ui";

import { cn } from "@/lib/utils/cn";

import styles from "./AlertDialog.module.scss";

// AlertDialog: confirmação de ações destrutivas.
// Diferente do Dialog comum, não fecha clicando fora: exige uma escolha.

export const AlertDialog = Primitive.Root;
export const AlertDialogTrigger = Primitive.Trigger;
export const AlertDialogCancel = Primitive.Cancel;
export const AlertDialogAction = Primitive.Action;

export function AlertDialogContent({
  className,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className={styles.overlay} />
      <Primitive.Content className={cn(styles.content, className)} {...props} />
    </Primitive.Portal>
  );
}

export function AlertDialogTitle({ className, ...props }: ComponentProps<typeof Primitive.Title>) {
  return <Primitive.Title className={cn(styles.title, className)} {...props} />;
}

export function AlertDialogDescription({
  className,
  ...props
}: ComponentProps<typeof Primitive.Description>) {
  return <Primitive.Description className={cn(styles.description, className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(styles.footer, className)} {...props} />;
}
```

`src/components/ui/AlertDialog/AlertDialog.module.scss`:

```scss
@use "@/styles/abstracts" as *;

.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgb(32 31 37 / 45%);
}

.content {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 51;
  width: calc(100% - #{$space-6});
  max-width: 440px;
  padding: $space-5;
  background: var(--color-surface);
  border-radius: $radius-lg;
  box-shadow: 0 16px 48px rgb(32 31 37 / 20%);
  transform: translate(-50%, -50%);
}

.title {
  margin: 0 0 $space-2;
  font-size: $font-size-lg;
}

.description {
  margin: 0 0 $space-5;
  color: var(--color-muted);
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
}
```

O que o Radix garante sozinho (validado no passo 09): foco preso dentro do
diálogo, `Esc` fecha, foco volta ao botão que abriu, e `role="alertdialog"`
para leitores de tela.

### 3. PageHeader

`src/components/shared/PageHeader/PageHeader.tsx`:

```tsx
import type { ReactNode } from "react";

import styles from "./PageHeader.module.scss";

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Ação principal da página (ex.: botão "Novo projeto"). */
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.text}>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
```

`src/components/shared/PageHeader/PageHeader.module.scss`:

```scss
@use "@/styles/abstracts" as *;

.header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  margin-bottom: $space-5;
}

.text {
  display: flex;
  flex-direction: column;
  gap: $space-1;

  p {
    margin: 0;
    color: var(--color-muted);
  }
}
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/components/ui/Button/*` | Criados | Botão e variantes |
| `src/components/ui/AlertDialog/*` | Criados | Wrapper do Radix AlertDialog |
| `src/components/shared/PageHeader/*` | Criados | Cabeçalho de página |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run typecheck && npm run lint` | Sem erros |
| 2 | `npm run build` | Sem erros (confirma que os SCSS compilam) |

O teste visual e de teclado acontece no passo 09.

**Critério de aceite:** os dois testes passam.

## Commit sugerido

```bash
git add src/components
git commit -m "feat(ui): adiciona Button, AlertDialog e PageHeader"
```

## Referências

- [Radix — Alert Dialog](https://www.radix-ui.com/primitives/docs/components/alert-dialog)
- [WAI-ARIA — Alert and Message Dialogs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/)
- ARCHITECTURE.md, seção 7

---

← [Passo anterior](07-server-actions.md) · [Índice da fase](README.md) · [Próximo passo](09-telas-projetos.md) →
