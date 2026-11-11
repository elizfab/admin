# Fase 04 — Backend, Contratos e Primeiro Módulo

> **Status:** 📋 Planejada — o passo a passo será escrito quando a fase começar.\
> **Depende de:** [Fase 03 — Autenticação](../03-setup-autenticacao/README.md) concluída\
> **Arquitetura:** ARCHITECTURE.md, seções 9, 10, 15 e 21 (Fases 4 e 5)

## Objetivo da fase

Operações de domínio funcionando com **validação (Zod), autenticação,
autorização e persistência**, organizadas em camadas, e um primeiro módulo
completo (sugestão: Projetos).

## 💡 As camadas, como numa cozinha de restaurante

| Camada | Analogia | No código |
|---|---|---|
| Interface | O salão | Páginas e componentes |
| Ações e endpoints | O garçom que anota o pedido | Server Actions e Route Handlers |
| Serviços | O chef que aplica a receita | `modules/<x>/services` |
| Acesso a dados | O estoquista | `modules/<x>/repositories` |
| Persistência | A despensa | Prisma + PostgreSQL |

O garçom não cozinha e o chef não vai à despensa no meio do salão. Cada
camada fala apenas com a vizinha.

## Antes de começar (decisões e informações necessárias)

- [ ] Módulo inicial (Projetos ou Estudos)
- [ ] Requisitos funcionais do módulo: o que se cadastra, lista, edita e exclui
- [ ] Formato padrão de resposta e de erro da API

## Passos previstos

| # | Passo | Status |
|---|---|---|
| 01 | Instalar o Zod e criar os schemas compartilhados | 📋 |
| 02 | Padrão de respostas e erros (sem detalhes internos) | 📋 |
| 03 | Repositório e serviço do módulo inicial | 📋 |
| 04 | Server Actions (criar, editar, excluir) | 📋 |
| 05 | Route Handlers `/api/v1/...` necessários | 📋 |
| 06 | Telas do módulo, substituindo o mock | 📋 |
| 07 | Testes unitários de schemas e serviços | 📋 |

## ✅ Critério de conclusão da fase

O módulo inicial cria, lista, edita e exclui registros persistidos, apenas
do próprio usuário, com entradas inválidas rejeitadas no servidor e testes
cobrindo os casos positivos e negativos.

---

← [Fase anterior](../03-setup-autenticacao/README.md) · [Mapa geral](../../README.md) · [Próxima fase](../05-setup-testes-e2e/README.md) →
