# Fase 08 — Portal Dev protegido dentro do Admin

> **Objetivo da fase:** o Portal Dev (Docusaurus, repositório `elizfab/portal-dev`)
> deixa de ser público no GitHub Pages e passa a ser servido pelo Admin em
> **`/portal`**, **somente para quem está logado**, com a sessão validada no
> servidor antes de qualquer arquivo ser entregue.\
> **Tempo estimado:** 5 a 7 horas, divididas em sessões\
> **Depende de:** [Fase 07](../07-novos-modulos/README.md) concluída (os testes de navegação e o dashboard já têm Projetos)\
> **Decisão:** [ADR-007](../../decisions/ADR-007-portal-dev-protegido.md) (resolve a seção 19.2 do ARCHITECTURE.md)\
> **Repositório parceiro:** `elizfab/portal-dev`, com o passo a passo dele em `portal-dev/docs/` (fase 04 de lá)

## 💡 A ideia, como numa biblioteca com acervo restrito

Hoje o portal é uma **estante na calçada**: qualquer pessoa que passa lê. A
Fase 08 leva os livros para dentro da biblioteca (o Admin):

| Papel | Na biblioteca | Neste projeto |
|---|---|---|
| Editora | Imprime os livros e manda a caixa | CI do `portal-dev` gera o build e publica na release `portal-build` |
| Caminhão | Busca a caixa na editora com uma autorização | `scripts/fetch-portal.mjs` baixa a release com o `PORTAL_DEV_TOKEN` |
| Acervo restrito | Sala fechada, fora da vista do público | Pasta `.portal/` (fora de `public/` e fora do Git) |
| Bibliotecária | Confere a carteirinha **no sistema** antes de entregar cada livro | Route Handler `/portal/[[...path]]` valida a sessão no banco |
| Porteiro | Só olha se você tem uma carteirinha na mão | O proxy (cookie existe?) |

⚠️ O porteiro sozinho não basta: uma carteirinha **falsa** passaria por ele.
Por isso a entrega fica com a bibliotecária, que consulta o banco. É também por
isso que o portal **não** vai para `public/`: tudo ali é entregue sem consulta.

```text
 portal-dev (privado)                       Admin (Vercel)
 ───────────────────                        ──────────────────────────────────────────
 push na main                               vercel-build
   └─ CI: build:admin ──▶ release ──token──▶   1. fetch-portal.mjs → .portal/
          "portal-build"                       2. prisma migrate deploy
   └─ deploy hook ─────────────────────────▶   3. next build (copia .portal/ para a função)

 Navegador ──▶ /portal/docs/intro ──▶ proxy (cookie?) ──▶ Route Handler
                                                          ├─ getSession() no banco
                                                          ├─ sem sessão → 307 /login
                                                          └─ com sessão → arquivo de .portal/
                                                             (Cache-Control: private)
```

## Ordem dos passos (os dois repositórios)

A ordem foi pensada para o portal **nunca ficar fora do ar**: o GitHub Pages só
é desligado no final, depois de o Admin já servir o portal em produção.

| # | Onde | Passo | O que entrega | Status |
|---|---|---|---|---|
| 01 | Admin | [Decisão e arquitetura](01-decisao-e-arquitetura.md) | ADR-007 registrada | ⬜ |
| — | portal-dev | Fase 04, passos 01 e 02 (em `portal-dev/docs/`) | Build com `baseUrl: /portal/` e release `portal-build` | ⬜ |
| 02 | Admin | [Baixar o pacote do portal](02-baixar-o-pacote.md) | `scripts/fetch-portal.mjs` e `.portal/` | ⬜ |
| 03 | Admin | [Servir o portal com sessão](03-servir-com-sessao.md) | Route Handler `/portal`, cache privado, proxy | ⬜ |
| 04 | Admin | [Página Documentação](04-pagina-documentacao.md) | `/documentation` com seções e versão publicada | ⬜ |
| 05 | Admin | [Testes](05-testes.md) | 15 unitários + 5 E2E (com portal falso) | ⬜ |
| 06 | Admin + portal-dev | [Token, deploy hook e variáveis](06-token-e-variaveis.md) | `PORTAL_DEV_TOKEN`, `ADMIN_DEPLOY_HOOK`, `ADMIN_URL` | ⬜ |
| 07 | Admin + portal-dev | [Deploy e fim do acesso público](07-deploy-e-validacao.md) | Produção servindo `/portal`; repositório privado; Pages desligado | ⬜ |

## Checklist da fase

- [ ] ADR-007 no repositório (`docs/decisions/`)
- [ ] Release `portal-build` com o `portal-build.tar.gz` gerado pelo CI do portal
- [ ] `.portal/` no `.gitignore`; `npm run portal:fetch` funcionando com `PORTAL_ARCHIVE`
- [ ] `/portal/*` responde **307 → /login** sem sessão, inclusive com cookie falso
- [ ] Todas as respostas do portal com `Cache-Control: private` e `X-Robots-Tag: noindex`
- [ ] Caminhos com `..` respondem 404 (sem sair da pasta `.portal/`)
- [ ] `/documentation` mostra as seções e a versão publicada
- [ ] `PORTAL_DEV_TOKEN` (somente leitura, só no `portal-dev`) na Vercel; `ADMIN_DEPLOY_HOOK` no GitHub
- [ ] Produção servindo o portal; `portal-dev` **privado**; GitHub Pages **desligado**

## Números da fase (validados em 17/11/2026)

| Suíte | Antes (fim da Fase 07) | Depois |
|---|---|---|
| Unitários | 79 | **94** |
| Integração | 8 | **8** |
| E2E | 30 | **35** |

## Arquivos da fase (Admin)

```text
docs/decisions/ADR-007-portal-dev-protegido.md      ← Criado
scripts/fetch-portal.mjs                            ← Criado (baixa e extrai o pacote)
src/lib/portal/portal-files.ts                      ← Criado (qual arquivo, tipo e cache)
src/app/portal/[[...path]]/route.ts                 ← Criado (entrega com sessão)
src/app/(private)/documentation/page.tsx            ← Substituído (era "Em breve")
src/app/(private)/documentation/page.module.scss    ← Criado
src/modules/dashboard/data/modules.mock.ts          ← Alterado (Documentação "Disponível")
src/proxy.ts                                        ← Alterado (+ /portal/:path*)
next.config.ts                                      ← Alterado (outputFileTracingIncludes)
package.json                                        ← Alterado (portal:fetch, vercel-build)
.gitignore                                          ← Alterado (/.portal/)
eslint.config.mjs                                   ← Alterado (ignora .portal/**)
.env.example                                        ← Alterado (PORTAL_ARCHIVE, PORTAL_DEV_TOKEN)
tests/unit/lib/portal/portal-files.test.ts          ← Criado
tests/e2e/portal.spec.ts                            ← Criado
tests/e2e/fixtures/portal/                          ← Criado (portal falso)
tests/e2e/support/e2e-env.ts                        ← Alterado (PORTAL_DIR)
```

---

← [Fase 07](../07-novos-modulos/README.md) · [Mapa geral](../../README.md) · [Passo 01](01-decisao-e-arquitetura.md) →
