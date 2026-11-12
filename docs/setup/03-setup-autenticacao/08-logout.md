# Passo 08 — Logout e usuário real no Header

> **Fase:** 03 — Autenticação\
> **Tempo estimado:** 20 min\
> **Depende de:** [Passo 07](07-tela-de-login.md)

## Objetivo

Ativar o item “Sair” do menu do usuário, encerrando a sessão **no banco**.

## 💡 Por que a sessão no banco faz diferença aqui

Com sessão JWT pura (proposta original), o “sair” só apagava o cookie do
navegador: uma cópia do token continuaria válida até expirar. Com o Better
Auth, a sessão é **apagada do banco**, e qualquer cópia do cookie deixa de
funcionar na hora (validado no passo 10, teste 11). 💡 É a diferença entre
jogar o crachá no lixo e **desativar o crachá no sistema**.

## Pré-requisitos

- Passo 07 concluído.

## Passo a passo

### 1. Atualizar o `UserMenu`

Substitua `src/components/layout/Header/UserMenu.tsx`:

`src/components/layout/Header/UserMenu.tsx`:

```tsx
"use client";

import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu/DropdownMenu";
import { authClient } from "@/lib/auth/auth-client";

import styles from "./Header.module.scss";

type UserMenuProps = {
  userName: string;
};

export function UserMenu({ userName }: UserMenuProps) {
  const router = useRouter();

  async function handleSignOut() {
    // Encerra a sessão no servidor (apaga do banco) e remove o cookie.
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={styles.userButton}>
        <UserRound size={18} aria-hidden="true" />
        <span className={styles.userName}>{userName}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuLabel>Conta</DropdownMenuLabel>
        <DropdownMenuItem disabled>
          <UserRound size={16} aria-hidden="true" />
          Perfil (em breve)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut}>
          <LogOut size={16} aria-hidden="true" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

| Mudança | Explicação |
|---|---|
| `onSelect={handleSignOut}` | Evento do Radix: dispara com clique **e** com `Enter` no teclado |
| `authClient.signOut()` | Chama `/api/auth/sign-out`: apaga a sessão no banco e o cookie |
| `router.refresh()` | Os Server Components releem a sessão, que agora não existe |
| Item “Sair” sem `disabled` | Era um *placeholder* da Fase 01 |

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/components/layout/Header/UserMenu.tsx` | Alterado | Logout funcional |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Logada, abrir o menu e clicar em “Sair” | Vai para `/login` |
| 2 | Botão “Voltar” do navegador e depois recarregar a página | Continua em `/login`; o dashboard não reabre |
| 3 | Só teclado: `Tab` até o menu → `Enter` → setas até “Sair” → `Enter` | Logout funciona |
| 4 | Studio → tabela `Session` | Sem a sessão encerrada |
| 5 | `npm test && npm run typecheck && npm run lint` | Tudo passa |

**Critério de aceite:** os cinco testes passam.

## Commit sugerido

```bash
git add src/components/layout/Header/UserMenu.tsx
git commit -m "feat(auth): ativa logout no menu do usuário"
```

## Referências

- [Better Auth — Sign out](https://www.better-auth.com/docs/basic-usage#signout)
- ARCHITECTURE.md, seção 11.9

---

← [Passo anterior](07-tela-de-login.md) · [Índice da fase](README.md) · [Próximo passo](09-proxy.md) →
