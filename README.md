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
| 00 | [`setup/00-setup-ambiente`](setup/00-setup-ambiente/README.md) | Ferramentas, pasta do projeto e Git local | ⬜ |
| 01 | [`setup/01-setup-frontend`](setup/01-setup-frontend/README.md) | Next.js, TypeScript, SCSS, design system, layout, dashboard mockado e testes unitários | ⬜ |
| 02 | [`setup/02-setup-banco-prisma`](setup/02-setup-banco-prisma/README.md) | Supabase, PostgreSQL, Prisma, ERD e seed | 📋 |
| 03 | [`setup/03-setup-autenticacao`](setup/03-setup-autenticacao/README.md) | Login, sessão, proteção de rotas e autorização | 🔒 decisão Auth.js × Better Auth |
| 04 | [`setup/04-setup-backend`](setup/04-setup-backend/README.md) | Zod, serviços, repositórios, Route Handlers e Server Actions | 📋 |
| 05 | [`setup/05-setup-testes-e2e`](setup/05-setup-testes-e2e/README.md) | Playwright e testes de integração | 📋 |
| 06 | [`setup/06-setup-deploy`](setup/06-setup-deploy/README.md) | GitHub, Vercel, variáveis por ambiente e backup | 📋 |

> As fases 02 a 06 estão **planejadas**: cada pasta já descreve o escopo e os
> critérios de conclusão, mas o passo a passo só será escrito quando a fase
> começar, com as versões das ferramentas conferidas naquele momento.
> Isso segue a regra da seção 24 do documento de arquitetura: não antecipar
> implementação.

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
│   └── ARCHITECTURE.md            ← arquitetura e decisões (revisão 1.1)
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

Os comandos da Fase 01 foram **executados e validados em 11/11/2026** com as
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

---

## 5. Decisões pendentes

| Decisão | Necessária antes de | Onde está descrita |
|---|---|---|
| Auth.js v5 (beta) ou Better Auth | Fase 03 | ARCHITECTURE.md, seção 11.0 |
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
