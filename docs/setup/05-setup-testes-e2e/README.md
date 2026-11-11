# Fase 05 — Testes E2E e de Integração

> **Status:** 📋 Planejada — o passo a passo será escrito quando a fase começar.\
> **Depende de:** [Fase 04 — Backend](../04-setup-backend/README.md) concluída\
> **Arquitetura:** ARCHITECTURE.md, seções 16.5, 17 e 22.5

## Objetivo da fase

Fluxos reais testados no navegador com Playwright (login, navegação,
autorização e CRUD) e testes de integração com um banco de teste isolado.

## 💡 Por que E2E, se já existem testes unitários

O teste unitário confere cada **peça** do motor; o E2E dá a **partida no
carro** e anda pelo quarteirão. Alguns problemas só aparecem com tudo junto:
cookies de sessão, redirecionamentos, *async* Server Components (que o Jest
não suporta).

## Antes de começar (decisões e informações necessárias)

- [ ] Banco de teste: Supabase separado, Docker local ou schema isolado
- [ ] Navegadores a testar (sugestão: Chromium; depois, Firefox e WebKit)

## Passos previstos

| # | Passo | Status |
|---|---|---|
| 01 | Instalar o Playwright (`npm init playwright@latest`) com testes em `tests/e2e/` | 📋 |
| 02 | Usuário e dados de teste isolados | 📋 |
| 03 | Fluxos de autenticação (login válido e inválido, logout, sessão encerrada) | 📋 |
| 04 | Acesso direto a URLs privadas sem sessão | 📋 |
| 05 | Navegação entre módulos | 📋 |
| 06 | CRUD do módulo inicial | 📋 |
| 07 | Testes de integração com banco (Jest em `tests/integration/`) | 📋 |

## Pontos de atenção já conhecidos

- O `jest.config.ts` já ignora `tests/e2e/` (configurado na Fase 01, passo 10).
- Nunca executar testes destrutivos contra o banco de produção.

## ✅ Critério de conclusão da fase

`npx playwright test` passa com todos os fluxos obrigatórios da seção 17.2 do
ARCHITECTURE.md.

---

← [Fase anterior](../04-setup-backend/README.md) · [Mapa geral](../../README.md) · [Próxima fase](../06-setup-deploy/README.md) →
