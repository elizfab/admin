# Passo 02 — Validação de variáveis no build

> **Fase:** 06 — Deploy\
> **Tempo estimado:** 30 min\
> **Depende de:** [Passo 01](01-headers-de-seguranca.md)

## Objetivo

Fazer o **build de produção falhar** (com uma mensagem clara) quando faltar
uma variável obrigatória, em vez de publicar uma aplicação quebrada.

## 💡 Por que (descoberto na validação desta fase)

Rodando o build **sem** `BETTER_AUTH_SECRET`, o Better Auth registra um erro
no log, mas o build **termina com sucesso** (código de saída `0`, validado).
Na Vercel, isso significaria um deploy “verde” cujo login quebra na
primeira tentativa.

💡 É o **checklist do piloto antes da decolagem**: é muito melhor o avião
não sair do chão do que descobrir no ar que falta combustível. Esse
princípio se chama _fail fast_ (falhar cedo).

| Variável                                             | Regra                                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| `DATABASE_URL`                                       | Obrigatória                                                              |
| `BETTER_AUTH_SECRET`                                 | Obrigatória, com **32+ caracteres**                                      |
| `BETTER_AUTH_URL` **ou** `BETTER_AUTH_ALLOWED_HOSTS` | Uma das duas (produção usa a primeira; previews, a segunda, no passo 03) |

### Por que só no build de produção

O `next.config.ts` pode exportar uma **função** que recebe a _fase_ em que o
Next.js está. A validação roda só em `PHASE_PRODUCTION_BUILD`: o `npm run
dev`, o Jest e o typecheck continuam funcionando sem essas variáveis.

## Pré-requisitos

- Passo 01 concluído.

## Passo a passo

### 1. Função de validação

```bash
mkdir -p src/lib/env tests/unit/lib/env
```

`src/lib/env/required-env.ts`:

```ts
/**
 * Validação das variáveis de ambiente obrigatórias para um build de produção.
 * Sem ela, um deploy sem BETTER_AUTH_SECRET terminaria "com sucesso" e o
 * login só quebraria quando alguém tentasse entrar (validado).
 */

type Env = Record<string, string | undefined>;

export function findEnvProblems(env: Env): string[] {
  const problems: string[] = [];

  if (!env.DATABASE_URL) {
    problems.push("DATABASE_URL não definida.");
  }

  if (!env.BETTER_AUTH_SECRET) {
    problems.push("BETTER_AUTH_SECRET não definida.");
  } else if (env.BETTER_AUTH_SECRET.length < 32) {
    problems.push("BETTER_AUTH_SECRET precisa ter pelo menos 32 caracteres.");
  }

  if (!env.BETTER_AUTH_URL && !env.BETTER_AUTH_ALLOWED_HOSTS) {
    problems.push(
      "Defina BETTER_AUTH_URL (URL fixa) ou BETTER_AUTH_ALLOWED_HOSTS (previews).",
    );
  }

  return problems;
}

export function assertProductionEnv(env: Env) {
  const problems = findEnvProblems(env);

  if (problems.length > 0) {
    throw new Error(
      `Build interrompido — variáveis de ambiente inválidas:\n- ${problems.join("\n- ")}`,
    );
  }
}
```

💡 A função `findEnvProblems` é **pura** (recebe um objeto e devolve uma
lista, sem efeitos colaterais). Por isso é fácil de testar sem mexer nas
variáveis reais do computador.

### 2. Testes

`tests/unit/lib/env/required-env.test.ts`:

```ts
import { assertProductionEnv, findEnvProblems } from "@/lib/env/required-env";

const valid = {
  DATABASE_URL: "postgresql://u:p@host:6543/postgres",
  BETTER_AUTH_SECRET: "a".repeat(32),
  BETTER_AUTH_URL: "https://admin.vercel.app",
};

describe("findEnvProblems", () => {
  it("aceita um ambiente completo", () => {
    expect(findEnvProblems(valid)).toEqual([]);
  });

  it("aceita BETTER_AUTH_ALLOWED_HOSTS no lugar de BETTER_AUTH_URL (previews)", () => {
    const previewEnv = {
      ...valid,
      BETTER_AUTH_URL: undefined,
      BETTER_AUTH_ALLOWED_HOSTS: "app-*.vercel.app",
    };

    expect(findEnvProblems(previewEnv)).toEqual([]);
  });

  it("aponta segredo ausente ou curto", () => {
    expect(
      findEnvProblems({ ...valid, BETTER_AUTH_SECRET: undefined }),
    ).toContain("BETTER_AUTH_SECRET não definida.");
    expect(
      findEnvProblems({ ...valid, BETTER_AUTH_SECRET: "curto" }),
    ).toContain("BETTER_AUTH_SECRET precisa ter pelo menos 32 caracteres.");
  });

  it("lista todos os problemas de uma vez", () => {
    expect(findEnvProblems({})).toHaveLength(3);
  });
});

describe("assertProductionEnv", () => {
  it("lança erro com a lista de problemas", () => {
    expect(() => assertProductionEnv({})).toThrow(/DATABASE_URL não definida/);
  });
});
```

### 3. Ligar a validação ao build

Versão final do `next.config.ts`:

`next.config.ts`:

```ts
import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

import { assertProductionEnv } from "./src/lib/env/required-env";

/**
 * Headers de segurança aplicados a todas as respostas.
 * Cada um fecha uma "porta" que o navegador deixaria aberta por padrão.
 */
const securityHeaders = [
  // Não deixa o navegador "adivinhar" o tipo de arquivo (evita executar texto como script).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Proíbe exibir o site dentro de <iframe> de outros sites (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Ao clicar num link externo, envia só o domínio, nunca o caminho completo.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desliga APIs do navegador que o painel não usa.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // CSP básica: sem iframes externos, sem <object>, formulários só para o próprio site.
  {
    key: "Content-Security-Policy",
    value:
      "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  // Força HTTPS por 2 anos nas próximas visitas (ignorado em http://localhost).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  // Não anuncia "X-Powered-By: Next.js" (menos informação para atacantes).
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// Função (e não objeto): o Next.js informa a fase. Só o build de produção
// exige as variáveis; o `dev` e os testes seguem funcionando sem elas.
export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) {
    assertProductionEnv(process.env);
  }

  return nextConfig;
}
```

## Arquivos criados ou alterados

| Arquivo                                   | Ação     | Descrição                                     |
| ----------------------------------------- | -------- | --------------------------------------------- |
| `src/lib/env/required-env.ts`             | Criado   | Regras das variáveis obrigatórias             |
| `tests/unit/lib/env/required-env.test.ts` | Criado   | 5 testes                                      |
| `next.config.ts`                          | Alterado | Exporta uma função por fase e valida no build |

## ✅ Como testar

| #   | Teste                                                                                 | Resultado esperado                                                           |
| --- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | `npm test`                                                                            | `Tests: 34 passed` (29 + 5)                                                  |
| 2   | **Prova:** `mv .env.local /tmp/env.bak && npx next build; mv /tmp/env.bak .env.local` | Build **interrompido**, listando as 3 variáveis ausentes (código de saída 1) |
| 3   | `npm run build` (com o `.env.local`)                                                  | Build normal                                                                 |
| 4   | `npm run test:e2e`                                                                    | `20 passed` (o servidor de teste recebe as variáveis do `e2e-env.ts`)        |

⚠️ No teste 2, **não esqueça** o `mv` de volta: o `;` garante que ele rode
mesmo com o build falhando.

**Critério de aceite:** os quatro testes passam.

## Commit sugerido

```bash
git add src/lib/env tests/unit/lib/env next.config.ts
git commit -m "feat(config): valida variáveis obrigatórias no build de produção"
```

## Referências

- [Next.js — next.config.js como função (fases)](https://nextjs.org/docs/app/api-reference/config/next-config-js)
- [The Twelve-Factor App — Config](https://12factor.net/pt_br/config)

---

← [Passo anterior](01-headers-de-seguranca.md) · [Índice da fase](README.md) · [Próximo passo](03-preparar-para-vercel.md) →
