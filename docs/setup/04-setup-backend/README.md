# Fase 04 — Backend, Contratos e Primeiro Módulo (Projetos)

> **Objetivo da fase:** o módulo **Projetos** cria, lista, edita e exclui
> registros persistidos, **apenas da própria usuária**, com entradas
> inválidas rejeitadas no servidor e testes cobrindo as regras.\
> **Tempo estimado:** 6 a 8 horas, divididas em sessões\
> **Depende de:** [Fase 03 — Autenticação](../03-setup-autenticacao/README.md) concluída\
> **Arquitetura:** ARCHITECTURE.md, seções 9, 10, 13.4, 15 e 22\
> **Mapa geral:** [`docs/README.md`](../../README.md)

## 💡 As camadas, como numa cozinha de restaurante

| Camada | Analogia | Neste projeto | Pode… | Não pode… |
|---|---|---|---|---|
| Interface | O salão | Páginas e componentes | Mostrar dados, coletar formulários | Acessar o banco |
| Entrada (ações e endpoints) | O garçom | Server Actions e Route Handlers | Checar sessão, validar com Zod, chamar o serviço | Conter regra de negócio |
| Serviço | O chef | `modules/projects/services` | Aplicar as regras (dona, nome único) | Saber de HTTP ou de formulário |
| Repositório | O estoquista | `modules/projects/repositories` | Ler e gravar no banco, **sempre filtrando pela dona** | Decidir regras |
| Persistência | A despensa | Prisma + PostgreSQL | Garantir integridade (FK, `UNIQUE`) | — |

💡 O garçom não cozinha e o chef não atende mesa. Quando cada camada faz
só o seu papel, dá para trocar o salão (uma tela nova, ou um app que consome
a API) sem mexer na receita (o serviço).

```text
 Navegador ──formulário──▶ Server Action ─┐
                                          ├─▶ Serviço ──▶ Repositório ──▶ Prisma ──▶ PostgreSQL
 App externo ──HTTP JSON──▶ Route Handler ┘
```

As **duas portas de entrada** (Server Action e Route Handler) usam o
**mesmo** schema Zod e o **mesmo** serviço. A regra existe em um lugar só.

## Ordem dos passos

| # | Passo | O que entrega | Status |
|---|---|---|---|
| 01 | [Modelo `Project` no banco](01-modelo-project.md) | Tabela `project` com dona e nome único | ✅ |
| 02 | [Zod 4 e schemas de validação](02-zod-schemas.md) | Contratos de entrada + 7 testes | ✅ |
| 03 | [Padrão de erros e respostas](03-erros-e-respostas.md) | `AppError`, `{ data }` / `{ error }` + 5 testes | ✅ |
| 04 | [Repositório](04-repositorio.md) | Acesso a dados isolado por dona | ✅ |
| 05 | [Serviço e API pública do módulo](05-servico.md) | Regras de negócio + 7 testes | ✅ |
| 06 | [Route Handlers `/api/v1/projects`](06-route-handlers.md) | API REST com 5 operações | ✅ |
| 07 | [Server Actions](07-server-actions.md) | Criar, editar e excluir pela interface | ✅ |
| 08 | [Componentes de UI: Button, AlertDialog e PageHeader](08-componentes-ui.md) | Peças reutilizáveis | ✅ |
| 09 | [Telas de Projetos](09-telas-projetos.md) | Lista, novo, editar, excluir e página 404 | ✅ |
| 10 | [Validação final e testes de isolamento](10-validacao-final.md) | Prova de que uma usuária não vê os dados de outra | ✅ |

## Checklist da fase

- [x] Modelo `Project` com `@@unique([ownerId, name])` e migration aplicada
- [x] Zod 4 instalado; schemas de criação e atualização testados
- [x] Respostas da API no formato `{ data }` / `{ error: { code, message } }`
- [x] Erros inesperados nunca expõem detalhes (testado)
- [x] Repositório filtrando **toda** consulta por `ownerId`
- [x] Serviço com regras: dona, nome único e “não encontrado” para projeto alheio
- [x] `GET/POST /api/v1/projects` e `GET/PATCH/DELETE /api/v1/projects/:id`
- [x] Server Actions validando sessão, dados e permissão
- [x] Telas: lista, criar, editar e excluir (com confirmação)
- [x] Teste de isolamento entre duas usuárias: **404** para projeto alheio
- [x] 29 testes unitários passando; bateria de segurança com 16 ok

## ✅ Critério de conclusão da fase

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

Mais o roteiro de testes do [passo 10](10-validacao-final.md), com tudo conforme o esperado.

## Versões validadas (11/11/2026)

| Ferramenta | Versão |
|---|---|
| zod | 4.6.7 |
| Next.js | 16.4.6 |
| radix-ui (AlertDialog) | 1.8.1 |

---

← Fase anterior: [03 — Autenticação](../03-setup-autenticacao/README.md) · [Mapa geral](../../README.md) · Próxima fase: [05 — Testes E2E](../05-setup-testes-e2e/README.md) →
