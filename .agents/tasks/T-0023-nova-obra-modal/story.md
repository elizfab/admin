# T-0023 — "Nova obra" em modal ao lado do Voltar

| Campo | Valor |
|---|---|
| Tipo | change |
| Módulos | construction |
| Tamanho | P |
| Tier | @coding-2 |
| Estado (Kanban) | Em desenvolvimento (pronto, sem commit a pedido da Liza) |
| Criada em | 2026-11-20 |
| Branch / PR | `feature/t-0020-financeiro-construcao` · sem commit |

## Pedido (palavras da Liza, `todo.md` item 6)

> Na página de Construção, ao lado do botão Voltar, um botão Nova obra que abre um modal para cadastrar a obra, reutilizando estrutura, campos, regras e comportamentos atuais, sem duplicar código.

## Aprovação (Gate G1)

- [x] Pedido escrito da Liza (`todo.md`, 2026-11-20)

## Desenho

- `src/modules/construction/components/NewConstructionProjectDialog/` (`.tsx`, `.types.ts`):
  botão "Nova obra" + `Dialog` (o mesmo modal do Dashboard) com o **mesmo** `ProjectSettingsForm`
  e a **mesma** `createProjectAction` (Zod, sessão, redirect fora do try). Nada duplicado.
- Salvar leva à configuração da obra nova (comportamento que já existia); o modal some com a navegação.
- Erro de validação fica no modal; "Fechar"/Esc/clique fora cancelam sem criar; reabrir traz o formulário limpo.
- O formulário que ficava solto embaixo da lista saiu (substituído pelo modal).
- Limitação: o `ProjectSettingsForm` não tem botão "Cancelar"; o cancelamento é o "Fechar" (×),
  Esc ou clique fora. Acrescentar "Cancelar" exigiria alterar `SettingsForms.tsx` (275 linhas, 0%
  de cobertura → R16 cobraria o arquivo inteiro). Fica como sugestão para a T-0015.

## Testes

| Cenário | Teste | Estado |
|---|---|---|
| Abre com os campos, envia, erro sem fechar, Fechar limpa | `NewConstructionProjectDialog.test.tsx` | 🔴 → ✅ |
| Fluxo real: valida, cria, vai para a configuração, card na grid | `construction.spec.ts › Nova obra abre o modal…` | ✅ |
| Fechar não cria nada | `construction.spec.ts › Fechar o modal não cria nada` | ✅ |
| axe com o modal aberto (claro e escuro) | `accessibility.spec.ts` | ✅ |

## Gates

| Gate | Estado | Evidência |
|---|---|---|
| G1 Spec | ✅ | Acima |
| G2 Testes vermelhos | ✅ | Componente não existia |
| G3 Pipeline verde | ✅ | typecheck, format, lint, 250 unit, 60 E2E, 276 Jest com cobertura, coverage:check (2026-11-20) |
| G4 Review | ⬜ | No PR, depois do commit da Liza |
| G5 QA | ✅ PASS |
| G6 Registro | ✅ | OBRA-R19 nova, CHANGELOG |

## Handoffs

### Handoff: @coding → Liza (2026-11-20)
- Feito: acima; **sem commit e sem push** (pedido da Liza).
- Próximo passo: revisar o diff, comitar com as mensagens sugeridas no fim do `todo.md` e dar push.
