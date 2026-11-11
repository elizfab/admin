# Passo 05 — Estrutura de diretórios

> **Fase:** 01 — Frontend\
> **Tempo estimado:** 20 min\
> **Depende de:** [Passo 04](04-sass-scss-modules.md)

## Objetivo

Entender **onde cada tipo de código mora**, criar a primeira função
utilitária (`cn`) e o arquivo `.env.example`.

## 💡 Por que

Uma cozinha organizada tem um lugar para facas, outro para panelas e outro
para temperos. Ninguém procura a faca na geladeira. No código é igual: quando
cada pasta tem **uma responsabilidade**, você sabe onde procurar e onde criar
cada arquivo, e os módulos não se misturam (princípio 2 da arquitetura).

## Pré-requisitos

- Passo 04 concluído.

## O mapa das pastas

| Pasta | O que mora aqui | Exemplo neste projeto | Regra |
|---|---|---|---|
| `src/app/` | **Rotas** (páginas, layouts, API) | `(private)/dashboard/page.tsx` | Arquivos finos: montam a página e delegam |
| `src/components/ui/` | Componentes visuais genéricos | `DropdownMenu` | Sem regra de negócio |
| `src/components/layout/` | Estrutura da tela | `Sidebar`, `Header` | Sem regra de negócio |
| `src/components/shared/` | Blocos reutilizados entre módulos | `EmptyState` | Sem regra de negócio |
| `src/modules/<domínio>/` | **Tudo de um domínio**: componentes, dados, tipos, serviços | `modules/dashboard/` | Um módulo não importa a parte interna de outro |
| `src/lib/` | Infraestrutura e utilitários | `lib/utils/cn.ts` | Código técnico, sem domínio |
| `src/styles/` | Tokens, tema e base | `abstracts/_variables.scss` | Nada específico de um componente |
| `tests/` | Testes | `tests/unit/` | Espelha a estrutura de `src/` |

### Route Groups: `(private)` e `(public)`

💡 Pastas entre parênteses **organizam sem aparecer na URL**:
`src/app/(private)/dashboard/page.tsx` responde em `/dashboard`. O grupo
permite dar um layout próprio (com sidebar) a todas as páginas autenticadas.

### Regra de ouro: não criar pastas vazias

A estrutura completa do ARCHITECTURE.md (seção 4.4) é o **destino**, não o
ponto de partida. Cada pasta é criada **no passo em que recebe o primeiro
arquivo**. O Git nem versiona pastas vazias.

## Passo a passo

### 1. Criar a função `cn`

```bash
mkdir -p src/lib/utils
```

`src/lib/utils/cn.ts`:

```ts
/**
 * Junta nomes de classes CSS, ignorando valores falsos.
 * Útil com SCSS Modules: cn(styles.item, isActive && styles.itemActive)
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
```

💡 Com SCSS Modules, frequentemente você precisa combinar classes
condicionalmente. Sem o `cn`, ficaria assim:

```tsx
className={`${styles.item} ${isActive ? styles.itemActive : ""}`}
```

Com o `cn`:

```tsx
className={cn(styles.item, isActive && styles.itemActive)}
```

### 2. Criar o `.env.example`

Crie o arquivo `.env.example` na raiz:

`.env.example`:

```bash
# Copie para .env.local e preencha os valores reais.
# Nunca commite .env.local.
# Variáveis serão adicionadas nas fases de banco e autenticação.
```

💡 O `.env.local` guarda **segredos reais** e nunca vai para o Git. O
`.env.example` é o “molde” versionado: mostra quais variáveis existem, sem os
valores. As variáveis serão adicionadas nas fases de banco e autenticação.

### 3. Liberar o `.env.example` no `.gitignore`

O `.gitignore` gerado pelo Next.js ignora **todos** os arquivos `.env*`,
incluindo o `.env.example`. Adicione a exceção logo abaixo da linha `.env*`:

```gitignore
# env files (can opt-in for committing if needed)
.env*
!.env.example
```

💡 O `!` significa “exceto este”.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/lib/utils/cn.ts` | Criado | Combina classes CSS condicionalmente |
| `.env.example` | Criado | Molde das variáveis de ambiente |
| `.gitignore` | Alterado | Exceção `!.env.example` |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `git check-ignore -v .env.example` | Mostra a regra `!.env.example` (o arquivo **não** é ignorado) |
| 2 | `touch .env.local && git status --short` | `.env.local` **não** aparece na lista |
| 3 | `npm run typecheck` | Sem erros |

Depois do teste 2, apague o arquivo vazio: `rm .env.local`.

**Critério de aceite:** `.env.example` é versionável, `.env.local` é ignorado
e o typecheck passa.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `.env.example` não aparece no `git status` | A exceção não foi adicionada ou ficou acima de `.env*` | A linha `!.env.example` precisa vir **depois** de `.env*` |

## Commit sugerido

```bash
git add src/lib .env.example .gitignore
git commit -m "chore: adiciona utilitário cn e modelo de variáveis de ambiente"
```

## Referências

- [Next.js — Project structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [Next.js — Route Groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)
- [Next.js — Environment variables](https://nextjs.org/docs/app/guides/environment-variables)
- ARCHITECTURE.md, seções 1.1, 4.4 e 20

---

← [Passo anterior](04-sass-scss-modules.md) · [Índice da fase](README.md) · [Próximo passo](06-lucide-react.md) →
