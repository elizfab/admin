# Admin — Mapa de Implementação

> **Projeto:** Admin (Personal Platform)\
> **Pasta local:** `~/repos/projetos-pessoais/portfolio/org-elizfab/_admin`\
> **Repositório remoto:** organização `elizfab` no GitHub (criado ao final)\
> **Documento de arquitetura:** [`architecture/ARCHITECTURE.md`](architecture/ARCHITECTURE.md)\
> **Última atualização:** 11/11/2026

Este mapa é o **ponto de partida** de toda a implementação. Ele mostra a ordem
das fases, o status de cada uma e onde está o passo a passo detalhado.

Pense no projeto como a construção de uma casa: o documento de arquitetura é a
**planta** (o que será construído e por quê); as pastas de `setup/` são o
**manual de obra** (como construir, em que ordem e como conferir se ficou
certo). Não se levantam paredes antes da fundação. Da mesma forma, nenhuma
fase começa antes de a anterior passar nos testes.

---

## 1. Como usar esta documentação

1. Siga as fases **na ordem numérica** (00, 01, 02…).
2. Dentro de cada fase, abra o `README.md` da pasta: ele lista os passos e o
   checklist da fase.
3. Execute **um passo por vez**. Todo passo termina com a seção
   **“Como testar”**; só avance quando o critério de aceite for atendido.
4. Ao concluir um passo, marque o checkbox no `README.md` da fase e faça o
   **commit sugerido** no final do passo.
5. Ao concluir uma fase, atualize a tabela de status abaixo.

### Convenções usadas nos guias

| Símbolo | Significado |
|---|---|
| `bash` em bloco de código | Comando para executar no terminal, na pasta `_admin` (salvo indicação) |
| ✅ | Critério de aceite: o que precisa acontecer para o passo estar concluído |
| ⚠️ | Atenção: erro comum ou cuidado de segurança |
| 💡 | Explicação conceitual (o “porquê”) |
| `src/...` | Caminho de arquivo, sempre relativo à raiz do projeto (`_admin`) |

---

## 2. Status das fases

Legenda: ⬜ não iniciada · 🟨 em andamento · ✅ concluída · 📋 planejada (passo a passo ainda não escrito) · 🔒 bloqueada (depende de decisão)

| Fase | Pasta | Objetivo | Status |
|---|---|---|---|
| 00 | [`setup/00-setup-ambiente`](setup/00-setup-ambiente/README.md) | Ferramentas, pasta do projeto e Git local | ✅ |
| 01 | [`setup/01-setup-frontend`](setup/01-setup-frontend/README.md) | Next.js, TypeScript, SCSS, design system, layout, dashboard mockado e testes unitários | ✅ |
| 02 | [`setup/02-setup-banco-prisma`](setup/02-setup-banco-prisma/README.md) | PostgreSQL local (Docker), Supabase, ERD, Prisma 7 e health check | ✅ |
| 03 | [`setup/03-setup-autenticacao`](setup/03-setup-autenticacao/README.md) | Better Auth: login, seed da administradora, sessão, logout, proxy, rate limiting e testes de segurança | ✅ |
| 04 | [`setup/04-setup-backend`](setup/04-setup-backend/README.md) | Módulo Projetos: Zod 4, erros padrão, repositório, serviço, API REST, Server Actions, telas e testes de isolamento | ✅ |
| 05 | [`setup/05-setup-testes-e2e`](setup/05-setup-testes-e2e/README.md) | Playwright (auth, navegação, CRUD, isolamento, acessibilidade) e integração com banco | ✅ |
| 06 | [`setup/06-setup-deploy`](setup/06-setup-deploy/README.md) | GitHub, Vercel, variáveis por ambiente e backup | ✅ |

> Todas as fases (00 a 06) estão **concluídas**: a aplicação está no ar em
> <https://admin-elizabetefabri.vercel.app/> (produção) com CI no GitHub
> Actions, bancos Supabase de produção e preview, e variáveis por ambiente
> documentadas em `VERCEL-ENV.md`. Rotinas contínuas (backup, keep-alive,
> operação) seguem os guias da fase 06.

### Correspondência com o documento de arquitetura

| Fase deste mapa | Fase da seção 21 do ARCHITECTURE.md |
|---|---|
| 00 + 01 | Fase 0 (Preparação) + Fase 1 (Design system e frontend base) + primeiro teste unitário |
| 02 | Fase 2 (Banco e Prisma) |
| 03 | Fase 3 (Autenticação e autorização) |
| 04 | Fase 4 (Backend e contratos) e Fase 5 (Primeiro módulo funcional) |
| 05 | Fase 6 (Testes: Playwright e integração) |
| 06 | Fase 6 (Deploy) |

---

## 3. Estrutura da documentação

```text
docs/
├── README.md                      ← este mapa
├── architecture/
│   └── ARCHITECTURE.md            ← arquitetura e decisões (revisão 1.4)
├── decisions/
│   └── ADR-006-autenticacao-better-auth.md
└── setup/
    ├── MODELO-DE-PASSO.md         ← modelo para novos guias
    ├── 00-setup-ambiente/
    ├── 01-setup-frontend/
    ├── 02-setup-banco-prisma/
    ├── 03-setup-autenticacao/
    ├── 04-setup-backend/
    ├── 05-setup-testes-e2e/
    └── 06-setup-deploy/
```

---

## 4. Versões validadas

Os comandos das Fases 01 a 05 foram **executados e validados em 11/11/2026** com as
versões abaixo. Versões mais novas podem funcionar, mas se algo divergir do
guia, compare primeiro com esta tabela.

| Ferramenta | Versão validada |
|---|---|
| Node.js | 22.23.4 (mínimo do projeto: 20.19) |
| npm | 10.9.9 |
| Next.js | 16.4.6 |
| React / React DOM | 19.3.0 |
| TypeScript | 5.9.3 |
| ESLint | 9.39.5 |
| sass | 1.108.2 |
| lucide-react | 1.72.0 |
| radix-ui | 1.8.1 |
| Jest / jest-environment-jsdom | 30.5.2 |
| @testing-library/react | 16.3.3 |
| @testing-library/jest-dom | 7.0.1 |
| PostgreSQL | 16 |
| prisma / @prisma/client / @prisma/adapter-pg | 7.10.1 (**fixar `@7`**) |
| better-auth / CLI `auth` | 1.7.21 |
| zod | 4.6.7 |
| @playwright/test | 1.65.0 |
| @axe-core/playwright | 4.14.0 |

---

## 5. Decisões

### Tomadas

| Decisão | Registro |
|---|---|
| Autenticação com Better Auth (substitui Auth.js) | [ADR-006](decisions/ADR-006-autenticacao-better-auth.md) |
| PostgreSQL local (Docker) para desenvolvimento; Supabase para Preview/Produção | ARCHITECTURE.md, seção 12.7 |
| Data API do Supabase desativada | ARCHITECTURE.md, seção 12.6 |

### Pendentes

| Decisão | Necessária antes de | Onde está descrita |
|---|---|---|
| Supabase Free ou outro PostgreSQL gerenciado para produção | Fase 06 | ARCHITECTURE.md, seção 2.1 |
| Estratégia de proteção do Docusaurus | Fase de expansão | ARCHITECTURE.md, seção 19.2 |
| Política de backup e recuperação | Fase 06 | ARCHITECTURE.md, seção 12.4 |

---

## 6. Como pedir ajuda quando um passo não funcionar

Envie estas informações. Elas permitem diagnosticar o problema sem
adivinhação:

1. **Qual passo:** nome do arquivo (ex.: `01-setup-frontend/04-sass-scss-modules.md`) e o número do item.
2. **O comando executado**, exatamente como foi digitado.
3. **A saída completa do terminal**, incluindo o erro (copie o texto, não só um print).
4. **O que você esperava** que acontecesse.
5. **Versões:** saída de `node --version` e `npm --version`.
6. Se for erro visual: um print da tela e o tamanho da janela.

⚠️ Antes de colar qualquer saída, confira se ela não contém senhas, tokens ou
strings de conexão. Nesse caso, substitua o valor por `***`.

---

## 7. Versões desta documentação

Cada pacote de documentação entregue é **cumulativo**: a versão nova contém
tudo das anteriores, revisado. Não é preciso guardar as versões antigas.

| Versão | Data | Fases com passo a passo |
|---|---|---|
| v1 | 11/11/2026 | 00 e 01 |
| v2 | 11/11/2026 | 00 a 03 |
| v3 | 11/11/2026 | 00 a 04 |
| v4 | 11/11/2026 | 00 a 05 |

**Como atualizar:**

1. Apague a pasta `docs/` atual.
2. Extraia o pacote novo na raiz do projeto, recriando `docs/`.
3. Restaure, se houver, os arquivos **seus** que estavam em `docs/` (ex.:
   `architecture/database-erd.drawio`): `git checkout -- docs/architecture/database-erd.drawio`.
4. Revise e faça o commit:

```bash
git status
git add docs
git commit -m "docs: atualiza documentação para v4 (fase 05)"
```

💡 A organização **por fases** está em `docs/setup/` (pastas `00-` a `06-`).
O histórico de **versões** da documentação fica no Git.
