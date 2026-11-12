# Fase 05 — Testes E2E e de Integração

> **Objetivo da fase:** os fluxos reais (login, navegação, CRUD, isolamento
> entre usuárias e acessibilidade) são testados **automaticamente no
> navegador**, contra um banco de teste isolado, e o repositório é testado
> contra o PostgreSQL real.\
> **Tempo estimado:** 5 a 7 horas, divididas em sessões\
> **Depende de:** [Fase 04 — Backend](../04-setup-backend/README.md) concluída\
> **Arquitetura:** ARCHITECTURE.md, seções 16.5, 17 e 22.5\
> **Mapa geral:** [`docs/README.md`](../../README.md)

## 💡 A pirâmide de testes do projeto

| Nível | Ferramenta | Testa | Velocidade | Fase |
|---|---|---|---|---|
| **Unitário** | Jest | Uma peça isolada (função, componente, regra com dublês) | Milissegundos | 01–04 |
| **Integração** | Jest + PostgreSQL de teste | Peças reais juntas (repositório + Prisma + banco) | Décimos de segundo | **05** |
| **E2E** | Playwright | O sistema inteiro, como uma pessoa usaria | Segundos | **05** |

💡 O teste unitário confere **cada peça** do motor; o de integração confere
se as peças **encaixam**; o E2E dá a **partida no carro** e anda pelo
quarteirão. Muitos testes na base (baratos e rápidos), poucos no topo
(caros, mas os mais realistas).

### O que só o E2E consegue pegar

- Cookies de sessão, redirecionamentos e o `proxy.ts` funcionando juntos.
- *Async* Server Components, que o Jest não suporta (seção 16.5).
- Acessibilidade da página **renderizada** (contraste, rótulos, ARIA).
- O formulário que perde o texto digitado (o bug da Fase 04).

## Um banco só para testes

```text
admin_dev   ← desenvolvimento (seus dados de trabalho; os testes NUNCA tocam)
admin_test  ← testes E2E e de integração (apagado e recriado a cada execução)
```

Os dois ficam no **mesmo** container Docker da Fase 02. O banco de teste é
criado automaticamente na primeira execução, e uma **trava** recusa qualquer
banco cujo nome não termine em `_test`.

## Ordem dos passos

| # | Passo | O que entrega | Status |
|---|---|---|---|
| 01 | [Ambiente de teste e banco isolado](01-ambiente-de-teste.md) | `e2e-env.ts` com a trava `_test` | ⬜ |
| 02 | [Instalar e configurar o Playwright](02-instalar-playwright.md) | `playwright.config.ts`, scripts e ignores | ⬜ |
| 03 | [Preparação do banco e das sessões](03-global-setup-e-sessoes.md) | Banco limpo + 2 usuárias logadas | ⬜ |
| 04 | [Testes de autenticação](04-testes-autenticacao.md) | Login, erro, logout | ⬜ |
| 05 | [Testes de navegação](05-testes-navegacao.md) | Sidebar, dashboard, 404 | ⬜ |
| 06 | [Testes do CRUD de projetos](06-testes-projetos.md) | Criar, validar, renomear, excluir | ⬜ |
| 07 | [Testes de isolamento entre usuárias](07-testes-isolamento.md) | Roteiro da Fase 04 automatizado | ⬜ |
| 08 | [Testes de acessibilidade com axe](08-testes-acessibilidade.md) | WCAG 2.1 A/AA em 5 páginas | ⬜ |
| 09 | [Testes de integração com banco (Jest)](09-testes-integracao.md) | Repositório contra o PostgreSQL real | ⬜ |
| 10 | [Rotina, depuração e validação final](10-rotina-e-validacao.md) | Relatório, trace viewer, checklist | ⬜ |

## Checklist da fase

- [ ] Banco `admin_test` criado automaticamente, com a trava `_test`
- [ ] Playwright instalado, com o Chromium baixado
- [ ] `npm run test:e2e`: **20 testes** passando
- [ ] Rodar duas vezes seguidas passa nas duas (os testes são repetíveis)
- [ ] Prova do alarme: o bug de isolamento é detectado pelo E2E **e** pela integração
- [ ] `npm run test:integration`: **4 testes** passando
- [ ] `npm test` continua com **29** (unitários), sem rodar E2E nem integração
- [ ] `npm run lint` ignora os relatórios do Playwright

## ✅ Critério de conclusão da fase

```bash
npm run typecheck && npm run lint && npm test
npm run test:integration
npm run test:e2e
```

Tudo passando, com o banco local rodando (`npm run db:up`).

## Pontos de atenção

- **Integração contínua (CI):** rodar estes testes automaticamente a cada
  *push* depende do repositório no GitHub, por isso fica na Fase 06.
- **Conta de teste da Fase 04** (`teste@example.com`, no banco de
  desenvolvimento): deixa de ser necessária. Os testes usam contas próprias
  no `admin_test`.

## Versões validadas (11/11/2026)

| Ferramenta | Versão |
|---|---|
| @playwright/test | 1.65.0 |
| Chromium (Playwright) | 158 |
| @axe-core/playwright | 4.14.0 |

---

← Fase anterior: [04 — Backend](../04-setup-backend/README.md) · [Mapa geral](../../README.md) · Próxima fase: [06 — Deploy](../06-setup-deploy/README.md) →
