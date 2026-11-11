# Passo 03 — ESLint

> **Fase:** 01 — Frontend\
> **Tempo estimado:** 15 min\
> **Depende de:** [Passo 02](02-typescript-strict.md)

## Objetivo

Entender a configuração de ESLint gerada pelo Next.js, adicionar o script
`lint:fix` e ver o editor apontando problemas em tempo real.

## 💡 Por que

Se o TypeScript é o corretor ortográfico, o ESLint é o **revisor de estilo e
boas práticas**: pega variáveis não usadas, hooks do React usados de forma
errada, `<img>` sem `alt` e padrões que causam bugs ou lentidão.

⚠️ **Mudança no Next.js 16:** o `next build` **não roda mais o linter**
automaticamente. Se você não rodar `npm run lint`, os problemas passam
despercebidos. Por isso ele faz parte do checklist de todo passo.

## Pré-requisitos

- Passo 02 concluído.
- Extensão ESLint instalada no VS Code (Fase 00).

## Passo a passo

### 1. Entender o `eslint.config.mjs`

`eslint.config.mjs`:

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
```

| Trecho | Significado |
|---|---|
| `nextVitals` | Regras do Next.js + Core Web Vitals (desempenho e acessibilidade) |
| `nextTs` | Regras específicas para TypeScript |
| `globalIgnores` | Pastas e arquivos que o ESLint não analisa |

💡 Esse é o formato **flat config** (`eslint.config.mjs`), padrão do ESLint 9.
Tutoriais antigos usam `.eslintrc.json`, que é o formato legado.

### 2. Adicionar o script `lint:fix`

No `package.json`, em `"scripts"`:

```json
"lint": "eslint",
"lint:fix": "eslint --fix",
```

`lint:fix` corrige automaticamente o que for seguro corrigir.

### 3. Experimento: provocar um aviso

Crie temporariamente `src/app/teste-lint.ts`:

```ts
export function exemplo() {
  const naoUsada = 1;
  return true;
}
```

```bash
npm run lint
```

Esperado: um aviso de variável não usada (`@typescript-eslint/no-unused-vars`).
No VS Code, a variável aparece sublinhada.

Apague o arquivo:

```bash
rm src/app/teste-lint.ts
```

### 4. (Opcional) Rótulos de abas no VS Code

No App Router, muitos arquivos têm o mesmo nome (`page.tsx`, `layout.tsx`). A
documentação do Next.js sugere criar `.vscode/settings.json` para mostrar a
pasta no nome da aba:

```json
{
  "workbench.editor.customLabels.patterns": {
    "**/app/**/page.tsx": "${dirname(1)}/${dirname} - page.tsx",
    "**/app/**/layout.tsx": "${dirname(1)}/${dirname} - layout.tsx"
  }
}
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `package.json` | Alterado | Script `lint:fix` |
| `.vscode/settings.json` | Criado (opcional) | Rótulos de abas |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Experimento do item 3 | Aviso de variável não usada |
| 2 | `npm run lint` (sem o arquivo de teste) | Nenhum erro ou aviso |

**Critério de aceite:** `npm run lint` termina sem erros nem avisos.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Editor não mostra avisos | Extensão desativada ou VS Code aberto fora de `_admin` | Abrir a pasta `_admin` como raiz do workspace |
| Tutorial pede `next lint` | Comando removido no Next.js 16 | Usar `npm run lint` (que chama `eslint`) |

## Commit sugerido

```bash
git add package.json
git commit -m "chore: adiciona script lint:fix"
```

## Referências

- [Next.js — ESLint](https://nextjs.org/docs/app/api-reference/config/eslint)
- [ESLint — Configuration files](https://eslint.org/docs/latest/use/configure/configuration-files)

---

← [Passo anterior](02-typescript-strict.md) · [Índice da fase](README.md) · [Próximo passo](04-sass-scss-modules.md) →
