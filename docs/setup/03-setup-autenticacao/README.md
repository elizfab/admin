# Fase 03 — Autenticação e Autorização (Better Auth)

> **Objetivo da fase:** **não é possível acessar dados privados sem sessão
> válida e autorização**, e isso é comprovado com testes de acesso direto
> a páginas e endpoints.\
> **Tempo estimado:** 5 a 7 horas, divididas em sessões\
> **Depende de:** [Fase 02 — Banco e Prisma](../02-setup-banco-prisma/README.md) concluída\
> **Decisão:** [ADR-006 — Better Auth](../../decisions/ADR-006-autenticacao-better-auth.md)\
> **Arquitetura:** ARCHITECTURE.md, seção 11 (princípios de segurança)

## 💡 Autenticação × autorização

- **Autenticação** é a portaria: “quem é você?”. Login, senha, sessão.
- **Autorização** é a chave de cada sala: “você pode entrar **aqui**?”. Papel (`role`), dona do registro.

E a regra de ouro do projeto (princípio 1): **esconder o botão não tranca a
sala**. Toda verificação acontece **no servidor**.

## As três camadas de proteção desta fase

| Camada | Onde | O que faz | É segura sozinha? |
|---|---|---|---|
| 1. `proxy.ts` | Antes da página | Sem cookie de sessão → redireciona para `/login` | ❌ Não valida o cookie; só agiliza |
| 2. `requireSession()` | Layout privado | Valida a sessão **no banco** | ✅ Para páginas |
| 3. `getSession()` em cada endpoint/action | Route Handlers e Server Actions | `401` sem sessão válida | ✅ Para dados |

💡 Pense num prédio: o porteiro (proxy) olha se você **tem** um crachá; o
leitor eletrônico da sala (servidor) confere se o crachá é **válido**. Um
crachá falsificado passa pelo porteiro, mas não abre a porta (validado no
passo 10).

## Ordem dos passos

| # | Passo | O que entrega | Status |
|---|---|---|---|
| 01 | [Registrar a decisão (ADR)](01-registrar-decisao-adr.md) | ADR-006 aceito | ✅ |
| 02 | [Instalar e configurar o Better Auth](02-instalar-configurar-better-auth.md) | `lib/auth/auth.ts` e variáveis | ✅ |
| 03 | [Gerar as tabelas de autenticação](03-gerar-tabelas-auth.md) | `session`, `account`, `verification`, `rateLimit` | ✅ |
| 04 | [Rota de autenticação e cliente](04-rota-e-cliente.md) | `/api/auth/*` e `auth-client.ts` | ✅ |
| 05 | [Seed da conta administradora](05-seed-administradora.md) | Conta criada com senha em hash | ✅ |
| 06 | [Sessão no servidor e layout protegido](06-sessao-no-servidor.md) | `requireSession()` e raiz condicional | ✅ |
| 07 | [Tela de login](07-tela-de-login.md) | `/login` funcional + testes | ✅ |
| 08 | [Logout e usuário real no Header](08-logout.md) | “Sair” funcionando | ✅ |
| 09 | [Proxy (Next.js 16)](09-proxy.md) | Redirecionamento otimista | ✅ |
| 10 | [Endpoint protegido e testes de segurança](10-testes-de-seguranca.md) | `/api/v1/me` + bateria de 13 testes | ✅ |

## Checklist da fase

- [x] ADR-006 revisado e aceito
- [x] `better-auth` instalado; `BETTER_AUTH_SECRET` gerado
- [x] Cadastro público **desabilitado**
- [x] Tabelas do Better Auth criadas via CLI + migration
- [x] Administradora criada pelo seed (idempotente)
- [x] `/login` funcionando, com mensagem de erro genérica
- [x] Layout privado protegido no servidor
- [x] Logout encerra a sessão **no banco**
- [x] `proxy.ts` redirecionando quem não tem cookie
- [x] `/api/v1/me` responde `401` sem sessão
- [x] Rate limiting: `429` após 5 tentativas em 1 minuto
- [x] Conta desativada (`isActive = false`) não consegue logar
- [x] 13 testes unitários passando

## ✅ Critério de conclusão da fase

A bateria de testes do [passo 10](10-testes-de-seguranca.md) passa por
completo, e:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

## Versões validadas (11/11/2026)

| Ferramenta | Versão |
|---|---|
| better-auth | 1.7.21 |
| CLI `auth` | 1.7.21 |
| server-only | 0.0.1 |

---

← Fase anterior: [02 — Banco e Prisma](../02-setup-banco-prisma/README.md) · [Mapa geral](../../README.md) · Próxima fase: [04 — Backend](../04-setup-backend/README.md) →
