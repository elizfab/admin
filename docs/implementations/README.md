# Implementações: regras já validadas

> **Fonte da verdade do comportamento** de cada módulo. Uma regra aqui foi
> implementada, testada e aprovada. Nenhum agente muda uma regra deste registro
> sem um `proposal.md` (OpenSpec) com o delta **MODIFIED/REMOVED** aprovado pela Liza.

💡 É o **livro de regras do condomínio**: qualquer morador novo (ou agente)
consulta antes de reformar; mudar uma regra exige assembleia (proposta aprovada),
não uma decisão de quem está com a ferramenta na mão.

| Módulo | Arquivo | Prefixo |
|---|---|---|
| Plataforma (auth, segurança, API, tema) | [`platform.md`](platform.md) | `PLAT` |
| Dashboard | [`dashboard.md`](dashboard.md) | `DASH` |
| Projetos | [`projects.md`](projects.md) | `PROJ` |
| Financeiro | [`finance.md`](finance.md) | `FIN` |
| Financeiro → Obra | [`construction.md`](construction.md) | `OBRA` |

## Formato de uma regra

| ID | Regra | Por quê | Protegida por |
|---|---|---|---|
| `FIN-R01` | Texto da regra, verificável | Motivo em uma frase | `tests/…` (arquivo › nome do teste) |

## Como atualizar (Documentation, Gate G6)

1. **ADDED:** nova linha com o próximo ID do módulo.
2. **MODIFIED:** troque o texto, **mantenha o ID**, acrescente `(alterada em T-NNNN)`.
3. **REMOVED:** apague a linha e registre no `docs/CHANGELOG.md` (seção *Removido*).
4. Toda regra precisa de pelo menos um teste em "Protegida por". Regra sem teste = dívida registrada no `WIP.md`.
