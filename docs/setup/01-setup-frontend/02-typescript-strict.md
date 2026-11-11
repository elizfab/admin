# Passo 02 — TypeScript strict

> **Fase:** 01 — Frontend\
> **Tempo estimado:** 15 min\
> **Depende de:** [Passo 01](01-criar-app-nextjs.md)

## Objetivo

Confirmar que o TypeScript está em modo `strict`, entender o que isso faz e
criar o script `npm run typecheck`.

## 💡 Por que

O TypeScript funciona como um **corretor ortográfico para código**: aponta
erros antes de o programa rodar. O modo `strict` liga as verificações mais
rigorosas. A principal delas é o `strictNullChecks`, que obriga a tratar
valores que podem ser `null` ou `undefined`, a causa número 1 de
`Cannot read properties of undefined` em produção.

Por que um script separado, se o `next build` já checa tipos? Porque o
`typecheck` é mais rápido, não gera build e pode rodar a todo momento
(e, no futuro, no CI).

## Pré-requisitos

- Passo 01 concluído (`npm run build` passando).

## Passo a passo

### 1. Conferir o `tsconfig.json`

Abra o `tsconfig.json` e confirme a linha:

```json
"strict": true,
```

O `create-next-app` já gera essa opção. Confira também o alias de imports:

```json
"paths": {
  "@/*": ["./src/*"]
}
```

💡 O alias `@/` é um “atalho de endereço”: `@/lib/utils/cn` significa
`src/lib/utils/cn`, sem precisar de `../../../`.

### 2. Adicionar o script `typecheck`

No `package.json`, dentro de `"scripts"`, adicione:

```json
"typecheck": "tsc --noEmit"
```

A seção fica assim:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "typecheck": "tsc --noEmit"
}
```

💡 `--noEmit` significa “só verifique, não gere arquivos JavaScript”; quem
compila de fato é o Next.js.

### 3. Experimento: provocar um erro de tipo

Crie temporariamente `src/app/teste-tipos.ts`:

```ts
const total: number = "dez";
```

Rode:

```bash
npm run typecheck
```

Esperado: erro `Type 'string' is not assignable to type 'number'`.

**Apague o arquivo** depois do experimento:

```bash
rm src/app/teste-tipos.ts
```

### 4. Regras do projeto (ARCHITECTURE.md, seção 22.1)

- Não usar `any` sem justificativa documentada em comentário.
- Preferir tipos inferidos (por exemplo, dos schemas Zod, na Fase 04).
- Tipar *props* de componentes e retornos de funções públicas.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `package.json` | Alterado | Script `typecheck` |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Experimento do item 3 | Erro de tipo exibido |
| 2 | `npm run typecheck` (sem o arquivo de teste) | Termina sem nenhuma mensagem de erro |

**Critério de aceite:** `npm run typecheck` passa sem erros.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Erros em `.next/types/...` | Tipos de rota gerados desatualizados | Rodar `npm run dev` ou `npm run build` uma vez e repetir |
| `tsc: command not found` | Dependências não instaladas | `npm install` |

## Commit sugerido

```bash
git add package.json
git commit -m "chore: adiciona script de verificação de tipos"
```

## Referências

- [TypeScript — strict](https://www.typescriptlang.org/tsconfig#strict)
- [Next.js — TypeScript](https://nextjs.org/docs/app/api-reference/config/typescript)

---

← [Passo anterior](01-criar-app-nextjs.md) · [Índice da fase](README.md) · [Próximo passo](03-eslint.md) →
