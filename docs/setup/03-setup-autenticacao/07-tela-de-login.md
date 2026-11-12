# Passo 07 — Tela de login

> **Fase:** 03 — Autenticação\
> **Tempo estimado:** 60 min\
> **Depende de:** [Passo 06](06-sessao-no-servidor.md)

## Objetivo

Criar o layout público e a página `/login`, com um formulário acessível que
usa o `authClient`, mostra uma **mensagem genérica** de erro e trata o
limite de tentativas. Inclui 3 testes unitários.

## 💡 Por que

### Mensagem genérica

“E-mail não encontrado” × “Senha incorreta” parece ajudar, mas ensina ao
atacante **quais e-mails existem** (*enumeração de contas*). A mensagem única
“E-mail ou senha inválidos.” não revela nada (seção 11.10).

### Por que o formulário é Client Component

Ele reage a eventos (envio), guarda estado (erro, carregando) e chama o
`authClient` no navegador. A **página** continua Server Component: ela
verifica no servidor se já existe sessão e, nesse caso, manda direto para o
dashboard.

### Por que `router.refresh()` depois do login

O login cria o cookie, mas os Server Components já renderizados não sabem
disso. O `refresh()` pede ao servidor que renderize de novo, agora lendo a
sessão nova.

## Pré-requisitos

- Passo 06 concluído.

## Passo a passo

### 1. Layout público

```bash
mkdir -p "src/app/(public)/login" src/modules/auth/components/LoginForm
```

`src/app/(public)/layout.tsx`:

```tsx
import styles from "./layout.module.scss";

// Layout das páginas públicas (sem sidebar e sem header).
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <main className={styles.public}>{children}</main>;
}
```

`src/app/(public)/layout.module.scss`:

```scss
@use "@/styles/abstracts" as *;

.public {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: $space-4;
}
```

### 2. Página de login

`src/app/(public)/login/page.tsx`:

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { LoginForm } from "@/modules/auth/components/LoginForm/LoginForm";

export const metadata: Metadata = {
  title: "Entrar",
};

export default async function LoginPage() {
  // Quem já está autenticado não precisa ver o login.
  if (await getSession()) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
```

### 3. Formulário

`src/modules/auth/components/LoginForm/LoginForm.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth/auth-client";

import styles from "./LoginForm.module.scss";

// Mensagem genérica: não revela se o e-mail existe (evita enumeração de contas).
const INVALID_CREDENTIALS = "E-mail ou senha inválidos.";
const TOO_MANY_ATTEMPTS = "Muitas tentativas. Aguarde um minuto e tente novamente.";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    const { error: signInError } = await authClient.signIn.email({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });

    if (signInError) {
      setError(signInError.status === 429 ? TOO_MANY_ATTEMPTS : INVALID_CREDENTIALS);
      setIsSubmitting(false);
      return;
    }

    // refresh() faz os Server Components relerem a sessão recém-criada.
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h1 className={styles.title}>Entrar</h1>

      <div className={styles.field}>
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className={styles.field}>
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <button className={styles.submit} type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
```

| Trecho | Explicação |
|---|---|
| `autoComplete="current-password"` | Permite que gerenciadores de senha preencham o campo |
| `<label htmlFor>` + `id` | Leitores de tela anunciam o campo; clicar no texto foca o campo |
| `role="alert"` | O erro é anunciado assim que aparece |
| `status === 429` | Resposta do rate limiting (5 tentativas/minuto) |
| `disabled={isSubmitting}` | Evita envio duplo ao clicar várias vezes |

`src/modules/auth/components/LoginForm/LoginForm.module.scss`:

```scss
@use "@/styles/abstracts" as *;

.form {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  width: 100%;
  max-width: 380px;
  padding: $space-6;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: $radius-lg;
}

.title {
  font-size: $font-size-xl;
}

.field {
  display: flex;
  flex-direction: column;
  gap: $space-1;

  label {
    font-size: $font-size-sm;
    font-weight: 600;
  }

  input {
    padding: $space-3;
    font: inherit;
    border: 1px solid var(--color-border);
    border-radius: $radius-sm;

    &:focus-visible {
      @include focus-ring;
    }
  }
}

.error {
  margin: 0;
  padding: $space-2 $space-3;
  font-size: $font-size-sm;
  color: var(--color-danger);
  background: #fdecea;
  border-radius: $radius-sm;
}

.submit {
  padding: $space-3;
  font-weight: 600;
  color: #ffffff;
  background: var(--color-primary);
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  &:focus-visible {
    @include focus-ring;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
}
```

### 4. Testes do formulário

```bash
mkdir -p tests/unit/modules/auth
```

`tests/unit/modules/auth/LoginForm.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { LoginForm } from "@/modules/auth/components/LoginForm/LoginForm";

// Dublês: o teste não chama o servidor de verdade nem o roteador do Next.js.
const signInEmail = jest.fn();
const push = jest.fn();

jest.mock("@/lib/auth/auth-client", () => ({
  authClient: { signIn: { email: (...args: unknown[]) => signInEmail(...args) } },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: jest.fn() }),
}));

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
}

describe("LoginForm", () => {
  beforeEach(() => {
    signInEmail.mockReset();
    push.mockReset();
  });

  it("envia e-mail e senha e redireciona para o dashboard", async () => {
    signInEmail.mockResolvedValue({ error: null });
    render(<LoginForm />);

    fillAndSubmit("admin@example.com", "senha-correta-123");

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    expect(signInEmail).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "senha-correta-123",
    });
  });

  it("mostra mensagem genérica quando as credenciais são inválidas", async () => {
    signInEmail.mockResolvedValue({ error: { status: 401 } });
    render(<LoginForm />);

    fillAndSubmit("admin@example.com", "errada");

    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha inválidos.");
    expect(push).not.toHaveBeenCalled();
  });

  it("avisa quando o limite de tentativas foi atingido (429)", async () => {
    signInEmail.mockResolvedValue({ error: { status: 429 } });
    render(<LoginForm />);

    fillAndSubmit("admin@example.com", "errada");

    expect(await screen.findByRole("alert")).toHaveTextContent("Muitas tentativas");
  });
});
```

💡 O `jest.mock` do `auth-client` troca o cliente real por um **dublê**: o
teste não depende do servidor nem do banco, e consegue simular qualquer
resposta (sucesso, `401`, `429`).

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/app/(public)/layout.tsx` + `.module.scss` | Criados | Layout das páginas públicas |
| `src/app/(public)/login/page.tsx` | Criado | Página de login |
| `src/modules/auth/components/LoginForm/*` | Criados | Formulário |
| `tests/unit/modules/auth/LoginForm.test.tsx` | Criado | 3 testes |

## ✅ Como testar

Com `npm run dev`, numa **janela anônima**:

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Abrir `/dashboard` | Redireciona para `/login`, que mostra o formulário |
| 2 | Entrar com senha errada | “E-mail ou senha inválidos.” |
| 3 | Entrar com os dados do seed | Vai para `/dashboard`, com o **seu nome** no Header |
| 4 | Logada, abrir `/login` | Volta para `/dashboard` |
| 5 | Só teclado: `Tab` entre os campos e `Enter` para enviar | Funciona, com contorno de foco visível |
| 6 | `npm test` | `Tests: 10 passed` |
| 7 | `npm run typecheck && npm run lint` | Sem erros |

**Critério de aceite:** os sete testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Login com sucesso, mas continua em `/login` | Faltou `router.refresh()` | Conferir o `handleSubmit` |
| Erro `403` no login | `BETTER_AUTH_URL` diferente do endereço aberto no navegador (ex.: `127.0.0.1` × `localhost`) | Abrir exatamente `http://localhost:3000` |
| Mensagem “Muitas tentativas” | Rate limit atingido (5 em 1 minuto) | Aguardar 1 minuto. É o comportamento esperado |

## Commit sugerido

```bash
git add "src/app/(public)" src/modules/auth tests/unit/modules
git commit -m "feat(auth): adiciona tela de login com mensagens genéricas e testes"
```

## Referências

- [Better Auth — Email & Password (sign in)](https://www.better-auth.com/docs/authentication/email-password)
- [OWASP — Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Next.js — useRouter](https://nextjs.org/docs/app/api-reference/functions/use-router)

---

← [Passo anterior](06-sessao-no-servidor.md) · [Índice da fase](README.md) · [Próximo passo](08-logout.md) →
