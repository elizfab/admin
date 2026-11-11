# Passo 01 — Criar a aplicação Next.js

> **Fase:** 01 — Frontend\
> **Tempo estimado:** 15 a 20 min\
> **Depende de:** [Fase 00 concluída](../00-setup-ambiente/README.md)

## Objetivo

Criar o projeto Next.js (TypeScript, App Router, `src/`, sem Tailwind)
**diretamente na raiz** da pasta `_admin` e vê-lo rodando em
`http://localhost:3000`.

## 💡 Por que

O `create-next-app` é o “kit de montagem” oficial: gera a estrutura mínima,
instala as dependências nas versões compatíveis entre si e configura
TypeScript e ESLint. Montar tudo à mão funciona, mas aumenta muito a chance
de erro de configuração.

### Por que não rodar `create-next-app .` direto em `_admin`?

O instalador usa o **nome da pasta** como nome do pacote no `package.json`.
O npm proíbe nomes que começam com `_`, então o comando falha com:

```text
Could not create a project called "_admin" because of npm naming restrictions:
    * name cannot start with an underscore
```

**Solução (validada):** criar o projeto em uma subpasta temporária chamada
`frontend`, que vira o nome do pacote, e depois mover o
conteúdo para a raiz de `_admin`.

## Pré-requisitos

- Fase 00 concluída: `_admin` contém `docs/` e `.git/`.
- Terminal aberto em `_admin`.

## Passo a passo

### 1. Entrar na pasta

```bash
cd ~/repos/projetos-pessoais/portfolio/org-elizfab/_admin
```

### 2. Executar o instalador

```bash
npx create-next-app@latest frontend
```

Responda às perguntas assim:

| Pergunta                                                | Resposta                   | 💡 Motivo                                                           |
| ------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------- |
| Would you like to use the recommended Next.js defaults? | **No, customize settings** | O padrão inclui Tailwind, que o projeto não usa                     |
| Would you like to use TypeScript?                       | **Yes**                    | Tipagem estática (ADR-003)                                          |
| Which linter would you like to use?                     | **ESLint**                 | Padrão do ecossistema Next.js                                       |
| Would you like to use React Compiler?                   | **No**                     | Avaliar depois; menos variáveis no início                           |
| Would you like to use Tailwind CSS?                     | **No**                     | O projeto usa SCSS Modules (ADR-004)                                |
| Would you like your code inside a `src/` directory?     | **Yes**                    | Separa código de arquivos de configuração                           |
| Would you like to use App Router?                       | **Yes**                    | Arquitetura definida (ADR-002)                                      |
| Would you like to use Cache Components?                 | **No**                     | Recurso avançado de cache; avaliar depois                           |
| Would you like to customize the import alias?           | **No**                     | Mantém o padrão `@/*`                                               |
| Would you like to include AGENTS.md…?                   | **Yes**                    | Orienta assistentes de IA a usar a documentação da versão instalada |

Se aparecer uma pergunta sobre enviar _feedback_ anônimo ao Next.js, a
resposta é opcional.

> Alternativa sem perguntas (mesmo resultado):
>
> ```bash
> npx create-next-app@latest frontend --ts --eslint --no-tailwind --src-dir --app --no-react-compiler --no-cache-components --agents-md --import-alias "@/*" --use-npm
> ```

Aguarde até aparecer `Success! Created frontend`.

O instalador deve informar que **pulou** a criação do Git, porque `_admin`
já é um repositório.

### 3. Conferir o que foi gerado

```bash
ls -A frontend
```

Esperado (a ordem pode variar):

```text
.gitignore  .next  AGENTS.md  README.md  eslint.config.mjs  next-env.d.ts
next.config.ts  node_modules  package-lock.json  package.json  public  src  tsconfig.json
```

⚠️ Se aparecer uma pasta `.git` aqui, o `_admin` não estava com Git
inicializado. Volte à Fase 00, passo 02, antes de continuar.

### 4. Mover o projeto para a raiz de `_admin`

Estes comandos funcionam tanto no bash quanto no zsh:

```bash
mv frontend/.gitignore .
mv frontend/* .
rm -rf frontend
```

💡 O primeiro `mv` move o único arquivo oculto que importa (`.gitignore`). O
segundo move todo o resto. Na subpasta sobra apenas `.next/`, um cache gerado
automaticamente que pode ser apagado sem risco.

### 5. Conferir a raiz

```bash
ls -A
```

Agora `_admin` deve conter `docs/` **junto** com os arquivos do Next.js.

### 6. Rodar o servidor de desenvolvimento

```bash
npm run dev
```

Abra <http://localhost:3000>. A página inicial padrão do Next.js deve aparecer.

Para encerrar o servidor: `Ctrl + C`.

## Arquivos criados ou alterados

| Arquivo                              | Ação   | Descrição                                             |
| ------------------------------------ | ------ | ----------------------------------------------------- |
| `package.json` / `package-lock.json` | Criado | Dependências e scripts; o lock fixa as versões exatas |
| `tsconfig.json`                      | Criado | Configuração do TypeScript (já com `strict: true`)    |
| `eslint.config.mjs`                  | Criado | Regras do ESLint (formato _flat config_)              |
| `next.config.ts`                     | Criado | Configuração do Next.js                               |
| `next-env.d.ts`                      | Criado | Tipos do Next.js (gerado; ignorado pelo Git)          |
| `AGENTS.md`                          | Criado | Instruções para assistentes de IA                     |
| `.gitignore`                         | Criado | Arquivos que o Git deve ignorar                       |
| `src/app/`                           | Criado | Layout, página inicial e estilos padrão               |
| `public/`                            | Criado | Arquivos estáticos (imagens, ícones)                  |

## ✅ Como testar

| #   | Teste                                  | Resultado esperado                                                   |
| --- | -------------------------------------- | -------------------------------------------------------------------- |
| 1   | `ls -A` em `_admin`                    | `docs/` e os arquivos do Next.js lado a lado; sem a pasta `frontend` |
| 2   | `grep '"name"' package.json`           | `"name": "frontend"`                                                 |
| 3   | `npm run dev` + abrir `localhost:3000` | Página padrão do Next.js                                             |
| 4   | `npm run build`                        | Termina com a tabela de rotas e sem erros                            |

**Critério de aceite:** os testes 3 e 4 passam.

## ⚠️ Problemas comuns

| Sintoma                                 | Causa provável                                          | Solução                                                                                        |
| --------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `name cannot start with an underscore`  | Rodou `create-next-app .` em `_admin`                   | Usar a subpasta temporária (item 2)                                                            |
| `mv: cannot move … Directory not empty` | Já existia na raiz um arquivo ou pasta com o mesmo nome | Conferir com `ls -A`; a raiz deveria ter só `docs/` e `.git/`                                  |
| `Port 3000 is in use`                   | Outro servidor está rodando                             | Encerrar o outro processo ou usar a porta indicada pelo Next.js                                |
| `npm warn deprecated eslint@9…`         | Aviso de versão da ferramenta                           | Não bloqueia; manter a versão instalada pelo Next.js                                           |
| `8 moderate severity vulnerabilities`   | Avisos do `npm audit` em dependências indiretas         | **Não** rodar `npm audit fix --force` (pode quebrar versões). Reavaliar ao atualizar o Next.js |
| Erro estranho após mover os arquivos    | Cache inconsistente                                     | `rm -rf .next node_modules && npm install`                                                     |

## Commit sugerido

```bash
git add .
git status   # conferir: nenhum .env, node_modules ou .next na lista
git commit -m "chore: cria aplicação Next.js com TypeScript, ESLint e App Router"
```

## Referências

- [Next.js — Installation](https://nextjs.org/docs/app/getting-started/installation)
- [create-next-app — CLI](https://nextjs.org/docs/app/api-reference/cli/create-next-app)
- ARCHITECTURE.md, seção 4.2

---

[Índice da fase](README.md) · [Próximo passo](02-typescript-strict.md) →
