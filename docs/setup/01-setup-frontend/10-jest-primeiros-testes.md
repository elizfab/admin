# Passo 10 — Jest e React Testing Library (primeiros testes)

> **Fase:** 01 — Frontend\
> **Tempo estimado:** 45 a 60 min\
> **Depende de:** [Passo 09](09-dashboard-mockado.md)

## Objetivo

Configurar Jest com `next/jest`, React Testing Library e jest-dom, e escrever
os primeiros testes: uma função (`cn`) e dois componentes (`Sidebar` e
`EmptyState`).

## 💡 Por que

Um teste é um **alarme de fumaça**: você instala uma vez e ele avisa sempre
que algo quebra, mesmo meses depois, numa parte do código que você nem lembra
mais. Começar a testar cedo (princípio 8) é mais barato do que adicionar
testes a um projeto grande.

| Ferramenta | Papel |
|---|---|
| **Jest** | Executa os testes e faz as asserções (`expect`) |
| **jsdom** | Simula um navegador dentro do Node.js |
| **React Testing Library** | Renderiza componentes e busca elementos **como um usuário** (pelo papel e pelo nome acessível) |
| **jest-dom** | Matchers legíveis: `toBeInTheDocument()`, `toHaveAttribute()` |
| **next/jest** | Configura o Jest com o compilador do Next.js e simula (mock) arquivos `.scss`, imagens e `next/font` |

💡 Buscar por `getByRole("link", { name: "Financeiro" })`, e não por classe
CSS, testa o que o usuário (e o leitor de tela) percebe. Se o componente for
reestilizado, o teste continua válido. De quebra, o teste denuncia problemas
de acessibilidade.

⚠️ **Limitação conhecida:** o Jest não suporta *async* Server Components.
Componentes síncronos funcionam; os assíncronos serão cobertos por testes E2E
com Playwright (Fase 05).

## Pré-requisitos

- Passo 09 concluído.

## Passo a passo

### 1. Instalar as dependências

```bash
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom ts-node @types/jest
```

💡 O `ts-node` é necessário porque a configuração (`jest.config.ts`) é escrita
em TypeScript.

### 2. Configuração — `jest.config.ts` (na raiz)

`jest.config.ts`:

```ts
import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Caminho da aplicação Next.js: carrega next.config.ts e arquivos .env nos testes.
  dir: "./",
});

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // Espelha o alias "@/*" do tsconfig.json.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // Os testes E2E (Playwright) ficarão em tests/e2e e não devem rodar no Jest.
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/tests/e2e/"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/generated/**",
  ],
};

// Exportado assim para que o next/jest consiga carregar a config do Next (assíncrona).
export default createJestConfig(config);
```

| Opção | Por que |
|---|---|
| `moduleNameMapper` | Ensina o Jest a entender o alias `@/` do `tsconfig.json` |
| `testPathIgnorePatterns` → `tests/e2e/` | O Playwright (Fase 05) também usa arquivos `*.spec.ts`; sem isso, o Jest tentaria executá-los e falharia |
| `collectCoverageFrom` | Mede a cobertura só do código-fonte, sem código gerado |

### 3. Setup — `jest.setup.ts` (na raiz)

`jest.setup.ts`:

```ts
import "@testing-library/jest-dom";
```

### 4. Scripts no `package.json`

Em `"scripts"`, adicione:

```json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

### 5. Primeiro teste: função `cn`

```bash
mkdir -p tests/unit/lib/utils tests/unit/components/layout tests/unit/components/shared
```

`tests/unit/lib/utils/cn.test.ts`:

```ts
import { cn } from "@/lib/utils/cn";

describe("cn", () => {
  it("junta várias classes com espaço", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("ignora valores falsos", () => {
    const isActive = false;

    expect(cn("item", isActive && "item-active", null, undefined)).toBe("item");
  });

  it("retorna string vazia quando não há classes", () => {
    expect(cn()).toBe("");
  });
});
```

💡 Estrutura de todo teste (padrão **AAA**): **Arrange** (preparar), **Act**
(executar), **Assert** (verificar com `expect`).

### 6. Teste de componente: `Sidebar`

`tests/unit/components/layout/Sidebar.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";

import { Sidebar } from "@/components/layout/Sidebar/Sidebar";

// A Sidebar usa usePathname(), que só existe dentro do Next.js.
// No teste, simulamos (mock) o hook para controlar a rota atual.
jest.mock("next/navigation", () => ({
  usePathname: () => "/finance",
}));

describe("Sidebar", () => {
  it("exibe a navegação principal com todos os módulos", () => {
    render(<Sidebar />);

    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(nav).toBeInTheDocument();

    for (const label of ["Dashboard", "Estudos", "Financeiro", "PDI", "Projetos"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("marca apenas o link da rota atual como página ativa", () => {
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "Financeiro" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
```

| Trecho | Explicação |
|---|---|
| `jest.mock("next/navigation", …)` | O `usePathname` só existe dentro do Next.js. O mock é um “dublê” que devolve a rota que o teste quer |
| `getByRole("navigation", { name })` | Encontra o `<nav>` pelo `aria-label` |
| `not.toHaveAttribute("aria-current")` | Garante que só um item está ativo |

### 7. Teste de componente: `EmptyState`

`tests/unit/components/shared/EmptyState.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";

import { EmptyState } from "@/components/shared/EmptyState/EmptyState";

describe("EmptyState", () => {
  it("usa h2 como título por padrão", () => {
    render(<EmptyState title="Sem dados" description="Nada por aqui." />);

    expect(screen.getByRole("heading", { level: 2, name: "Sem dados" })).toBeInTheDocument();
    expect(screen.getByText("Nada por aqui.")).toBeInTheDocument();
  });

  it("permite usar h1 quando for o conteúdo principal da página", () => {
    render(<EmptyState headingLevel="h1" title="Financeiro" description="Em breve." />);

    expect(screen.getByRole("heading", { level: 1, name: "Financeiro" })).toBeInTheDocument();
  });
});
```

### 8. Rodar

```bash
npm test
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `package.json` / `package-lock.json` | Alterado | Dependências e scripts de teste |
| `jest.config.ts` | Criado | Configuração do Jest |
| `jest.setup.ts` | Criado | Matchers do jest-dom |
| `tests/unit/**` | Criados | 3 arquivos, 7 testes |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm test` | `Test Suites: 3 passed` e `Tests: 7 passed` |
| 2 | **Prova do alarme:** em `navigation.ts`, troque `"Financeiro"` por `"Finanças"` e rode `npm test` | O teste da Sidebar **falha**. Desfaça a alteração e rode de novo: volta a passar |
| 3 | `npm run test:coverage` | Tabela de cobertura; `cn.ts` com 100% |
| 4 | `npm run typecheck` | Sem erros (os testes também são checados) |
| 5 | `npm run lint` | Sem erros |

**Critério de aceite:** testes 1, 2, 4 e 5 passam.

💡 O teste 2 é o mais importante: um teste que nunca falha não protege
nada. Ver o teste falhar quando deveria falhar prova que ele funciona.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Cannot find module '@/…'` | `moduleNameMapper` ausente | Conferir o item 2 |
| `toBeInTheDocument is not a function` | `jest.setup.ts` não carregado | Conferir `setupFilesAfterEnv` e o import no setup |
| `Jest: 'ts-node' is required for the TypeScript configuration files` | `ts-node` não instalado | `npm install -D ts-node` |
| `invariant expected app router to be mounted` | Componente usa hook do Next sem mock | Adicionar `jest.mock("next/navigation", …)` no teste |
| `coverage/` aparecendo no `git status` | — | Já está no `.gitignore` gerado pelo Next.js; conferir |

## Commit sugerido

```bash
git add package.json package-lock.json jest.config.ts jest.setup.ts tests
git commit -m "test: configura Jest e adiciona testes de cn, Sidebar e EmptyState"
```

## Referências

- [Next.js — Jest](https://nextjs.org/docs/app/guides/testing/jest)
- [Testing Library — Queries (prioridade)](https://testing-library.com/docs/queries/about#priority)
- [jest-dom — matchers](https://github.com/testing-library/jest-dom#custom-matchers)
- ARCHITECTURE.md, seção 16

---

← [Passo anterior](09-dashboard-mockado.md) · [Índice da fase](README.md) · [Próximo passo](11-validacao-final.md) →
