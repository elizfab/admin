# Passo 01 — Decisão e arquitetura

> **Fase:** 08 — Portal Dev protegido\
> **Tempo estimado:** 30 min\
> **Depende de:** [Fase 07](../07-novos-modulos/README.md) concluída

## Objetivo

Registrar a decisão (ADR-007) e entender **por que** cada peça existe antes de
escrever código: onde o portal fica guardado, quem o entrega e como a sessão
é conferida.

## 💡 Por que esta arquitetura, e não uma mais simples

A seção 19 do ARCHITECTURE.md já deixava duas regras:

1. A proteção precisa acontecer **antes de entregar os arquivos**.
2. Um formulário de login só no frontend de um site estático **não protege**
   nada (o HTML já foi entregue; basta desligar o JavaScript).

Daí saem as decisões, uma por pergunta:

| Pergunta | Resposta | 💡 Por quê |
|---|---|---|
| Onde o portal é publicado? | No próprio Admin, em `/portal` | Mesma sessão, mesmo domínio: nenhum segundo login |
| Onde o build fica guardado? | `.portal/`, fora do Git | O repositório do Admin é **público**; commitar o build vazaria o conteúdo |
| Por que não `public/`? | Arquivos de `public/` são entregues sem passar pela validação da sessão | O proxy só confere se o cookie **existe** (passo 03 testa um cookie falso) |
| Como o build chega ao Admin? | Release `portal-build` do `portal-dev`, baixada no deploy com um token de leitura | O `portal-dev` ficará privado; só quem tem o token baixa |
| Como o conteúdo novo aparece? | O CI do portal chama o **deploy hook** do Admin | Publicar no portal = um push; o resto é automático |
| A CDN pode guardar cópias? | **Não**: `Cache-Control: private` em tudo | Uma cópia na CDN seria entregue a qualquer pessoa, sem sessão |

💡 Por que o portal precisa ser **gerado** com `baseUrl: /portal/`? O Docusaurus gera links absolutos com o
`baseUrl` (por exemplo `/portal/assets/js/main.js`). Se ele fosse gerado para
`/`, os links apontariam para `/assets/...`, rotas que o Admin não conhece. O
endereço onde o site vai morar faz parte do build.

## Pré-requisitos

- Fase 07 concluída e CI verde.

## Passo a passo

### 1. Criar a ADR

Crie `docs/decisions/ADR-007-portal-dev-protegido.md` com o conteúdo do pacote
desta fase (ele já vem pronto em `docs/decisions/`).

### 2. Marcar a decisão como tomada

Em `docs/README.md`, seção 5:

- Na tabela **Tomadas**, acrescente:

```markdown
| Portal Dev privado, servido pelo Admin em `/portal` com sessão | [ADR-007](decisions/ADR-007-portal-dev-protegido.md) |
```

- Na tabela **Pendentes**, remova a linha "Estratégia de proteção do Docusaurus".

### 3. Ler a ordem dos dois repositórios

Releia a tabela "Ordem dos passos" do [README da fase](README.md). Os passos
alternam entre `admin` e `portal-dev`, e o GitHub Pages só é desligado no
passo 07, depois de o Admin já estar servindo o portal.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `docs/decisions/ADR-007-portal-dev-protegido.md` | Criado | A decisão, alternativas e consequências |
| `docs/README.md` | Alterado | Decisão movida de "Pendentes" para "Tomadas" |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Explicar em voz alta por que o portal não vai para `public/` | Você cita o proxy otimista e o repositório público |

**Critério de aceite:** a ADR está no repositório e você sabe dizer o papel de
cada peça do diagrama do README.

## Commit sugerido

```bash
git checkout develop && git pull && git checkout -b feat/portal
git add docs/decisions/ADR-007-portal-dev-protegido.md docs/README.md
git commit -m "docs(adr): ADR-007 Portal Dev protegido, servido pelo Admin"
```

## Referências

- ARCHITECTURE.md, seção 19
- [Docusaurus — `baseUrl`](https://docusaurus.io/docs/api/docusaurus-config#baseUrl)

---

← [Índice da fase](README.md) · [Próximo passo](02-baixar-o-pacote.md) →
