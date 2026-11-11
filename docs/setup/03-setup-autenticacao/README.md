# Fase 03 — Autenticação e Autorização

> **Status:** 🔒 Bloqueada por decisão — passo a passo escrito após a escolha da biblioteca.\
> **Depende de:** [Fase 02 — Banco e Prisma](../02-setup-banco-prisma/README.md) concluída\
> **Arquitetura:** ARCHITECTURE.md, seção 11 (especialmente 11.0)

## Objetivo da fase

**Não é possível acessar dados privados sem sessão válida e autorização**,
testando inclusive o acesso direto a URLs, Server Actions e endpoints.

## 💡 Autenticação × autorização

- **Autenticação** é a portaria: “quem é você?”.
- **Autorização** é a chave de cada sala: “você pode entrar *aqui*?”.

Esconder um botão no frontend não tranca a sala. A verificação precisa
acontecer no servidor, em toda operação (princípio 1).

## Antes de começar (decisões e informações necessárias)

- [ ] **Biblioteca:** Auth.js v5 (beta, em manutenção pelo time do Better Auth) ou Better Auth (ver seção 11.0); registrar em um ADR
- [ ] Método de login: e-mail e senha (Credentials)?
- [ ] Haverá mais de uma conta além da administradora?
- [ ] Duração da sessão (proposta atual: 8 horas)
- [ ] Estratégia de rate limiting no login

## Passos previstos

| # | Passo | Status |
|---|---|---|
| 01 | Registrar a decisão da biblioteca (ADR-006 revisado) | 📋 |
| 02 | Instalar e configurar a biblioteca e as variáveis de ambiente | 📋 |
| 03 | Hash de senha e verificação no servidor | 📋 |
| 04 | Tela de login `(public)/login` e layout público | 📋 |
| 05 | Sessão, logout e expiração | 📋 |
| 06 | Proteção do layout privado e `proxy.ts` (Next.js 16) | 📋 |
| 07 | Helper `requireAuth` para Route Handlers e Server Actions | 📋 |
| 08 | Rate limiting no login | 📋 |
| 09 | Testes de acesso direto sem sessão | 📋 |

## Pontos de atenção já conhecidos

- Next.js 16: `middleware.ts` virou `proxy.ts` (função `proxy`); exemplos
  antigos com `export { auth as middleware }` precisam ser adaptados.
- O `proxy.ts` melhora a navegação, mas **não substitui** a verificação em
  cada operação de dados.
- O menu do usuário (Header) já tem o item “Sair (em breve)” reservado.

## ✅ Critério de conclusão da fase

Sem sessão: páginas privadas redirecionam para `/login`, e endpoints e
actions respondem `401`. Com sessão encerrada, o acesso é negado.

---

← [Fase anterior](../02-setup-banco-prisma/README.md) · [Mapa geral](../../README.md) · [Próxima fase](../04-setup-backend/README.md) →
