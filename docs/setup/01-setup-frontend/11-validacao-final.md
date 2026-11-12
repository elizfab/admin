# Passo 11 — Validação final da fase e README do projeto

> **Fase:** 01 — Frontend\
> **Tempo estimado:** 30 min\
> **Depende de:** [Passo 10](10-jest-primeiros-testes.md)

## Objetivo

Conferir a fase inteira com um checklist objetivo, substituir o `README.md`
padrão do Next.js pelo README do projeto e fechar a fase com um commit.

## 💡 Por que

É a **vistoria antes da entrega das chaves**: cada item é conferido com um
teste, não com “acho que está funcionando”. A regra 11 da arquitetura (seção 26) vale aqui: não afirmar que algo funciona sem testar.

## Pré-requisitos

- Passos 01 a 10 concluídos.

## Passo a passo

### 1. Bateria de verificações automáticas

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

💡 O `&&` executa o próximo comando **só se o anterior passar**. Se algo
falhar, a sequência para no problema.

### 2. Verificação manual em produção local

```bash
npm run start
```

Abrir <http://localhost:3000> e percorrer o checklist da seção ✅ abaixo.

💡 Testar o build de produção (`start`), e não só o `dev`, pega problemas que
só aparecem otimizados, como CSS em ordem diferente.

### 3. README do projeto

Substitua o conteúdo do `README.md` da raiz:

`README.md`:

````markdown
# Admin — Personal Platform

Portal administrativo pessoal, privado e extensível: ponto central de acesso
aos módulos Estudos, Financeiro, PDI e Projetos.

> **Status:** Fase 01 (frontend) concluída. Banco, autenticação e backend nas
> próximas fases.

## Stack

Next.js (App Router) · TypeScript strict · SCSS Modules · Radix UI · Lucide React · Jest + React Testing Library

Planejado: PostgreSQL + Prisma · Zod · autenticação · Playwright · Vercel

## Pré-requisitos

- Node.js ≥ 20.19
- npm

## Como rodar

```bash
npm install
cp .env.example .env.local   # quando houver variáveis
npm run dev
```

Abrir <http://localhost:3000>.

## Scripts

| Script                                      | O que faz                          |
| ------------------------------------------- | ---------------------------------- |
| `npm run dev`                               | Servidor de desenvolvimento        |
| `npm run build`                             | Build de produção                  |
| `npm run start`                             | Executa o build de produção        |
| `npm run lint` / `lint:fix`                 | ESLint (verificar / corrigir)      |
| `npm run typecheck`                         | Verificação de tipos do TypeScript |
| `npm test` / `test:watch` / `test:coverage` | Testes unitários (Jest)            |

## Documentação

- [Mapa de implementação](docs/README.md): ordem das fases, status e guias passo a passo
- [Arquitetura](docs/architecture/ARCHITECTURE.md): decisões técnicas e padrões

## Estrutura

```text
src/
├── app/          # rotas (App Router)
├── components/   # componentes visuais (ui, layout, shared)
├── modules/      # domínios (dashboard, ...)
├── lib/          # infraestrutura e utilitários
└── styles/       # tokens, tema e estilos base
tests/
└── unit/         # testes Jest
```
````

### 4. Sobre o `AGENTS.md`

O `AGENTS.md` gerado pelo Next.js orienta assistentes de IA a consultar a
documentação da **versão instalada** (`node_modules/next/dist/docs/`), e não
o que lembram de versões antigas. O `next dev` recria esse bloco
automaticamente, então mantenha-o versionado. Regras próprias do projeto
podem ser adicionadas **fora** do bloco `BEGIN/END:nextjs-agent-rules`.

### 5. Atualizar o status

- Em [`README.md` da fase](README.md): marcar todos os checkboxes.
- Em [`docs/README.md`](../../README.md): mudar as fases 00 e 01 para ✅.

## Arquivos criados ou alterados

| Arquivo                                                     | Ação      | Descrição         |
| ----------------------------------------------------------- | --------- | ----------------- |
| `README.md`                                                 | Alterado  | README do projeto |
| `docs/README.md` e `docs/setup/01-setup-frontend/README.md` | Alterados | Status atualizado |

## ✅ Como testar (checklist final da fase)

**Automático**

- [ x ] `npm run typecheck`: sem erros
- [ x ] `npm run lint`: sem erros e sem avisos
- [ x ] `npm test`: 7 testes passando
- [ x ] `npm run build`: rotas `/`, `/dashboard`, `/studies`, `/finance`, `/pdi`, `/projects`

**Navegação** (`npm run start`)

- [ x ] `/` redireciona para `/dashboard`
- [ x ] Cada item da Sidebar abre sua página e fica destacado
- [ x ] Cada card do dashboard abre o módulo correspondente
- [ x ] Título da aba muda por página (“Financeiro | Admin”)

**Responsividade** (DevTools, `Ctrl+Shift+M`)

- [ x ] 375px: Sidebar só com ícones, 1 coluna de cards, botão do usuário só com ícone
- [ x ] 800px: 2 colunas de cards
- [ x ] 1366px: Sidebar com texto, 4 colunas de cards

**Acessibilidade** (só teclado, sem mouse)

- [ x ] `Tab` percorre Sidebar → botão do usuário com contorno de foco visível
- [ ] O menu do usuário abre com `Enter`, navega com as setas e fecha com `Esc`
- [ ] DevTools → Lighthouse → Accessibility em `/dashboard`: anotar a pontuação e corrigir os itens apontados

**Git**

- [ ] `git status`: sem `.env.local`, `node_modules/`, `.next/` ou `coverage/`

**Critério de aceite:** todos os itens marcados.

## ⚠️ Problemas comuns

| Sintoma                              | Causa provável       | Solução                                                               |
| ------------------------------------ | -------------------- | --------------------------------------------------------------------- |
| Lighthouse aponta contraste baixo    | Cor alterada no tema | Conferir contraste em <https://webaim.org/resources/contrastchecker/> |
| `npm run start` mostra versão antiga | Build desatualizado  | Rodar `npm run build` antes do `start`                                |

## Commit sugerido

```bash
git add README.md docs
git commit -m "docs: adiciona README do projeto e conclui fase 01 (frontend)"
```

Opcional: marcar o marco com uma _tag_:

```bash
git tag fase-01-frontend
```

## Próximo passo

A Fase 02 ([Banco e Prisma](../02-setup-banco-prisma/README.md)) será detalhada
quando você estiver pronta para começar. Antes dela, preencha as decisões da
seção “Antes de começar” do README da fase.

---

← [Passo anterior](10-jest-primeiros-testes.md) · [Índice da fase](README.md) · Próxima fase: [02 — Banco e Prisma](../02-setup-banco-prisma/README.md) →
