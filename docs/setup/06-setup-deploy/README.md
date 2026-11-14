# Fase 06 — Repositório, CI, Deploy e Operação

> **Objetivo da fase:** a aplicação está **publicada e protegida**, com um
> caminho reproduzível do commit à produção (GitHub → CI → Preview →
> Produção), backup testado e um roteiro para quando algo der errado.\
> **Tempo estimado:** 6 a 8 horas, divididas em sessões\
> **Depende de:** [Fase 05 — Testes](../05-setup-testes-e2e/README.md) concluída\
> **Arquitetura:** ARCHITECTURE.md, seções 3, 11.10, 12 e 18\
> **Mapa geral:** [`docs/README.md`](../../README.md)

## 💡 O caminho do código até a produção

```text
 seu computador ──git push──▶ GitHub ──▶ CI (GitHub Actions)
                                  │        typecheck · lint · 34 unitários · 20 E2E · 4 integração
                                  │
                                  └──▶ Vercel
                                         ├─ branch ≠ main → PREVIEW   (banco Supabase de preview)
                                         └─ main          → PRODUÇÃO  (banco Supabase de produção)
```

💡 É uma **linha de montagem com inspeção**: cada peça (commit) passa
pelos inspetores (CI) e por um carro de teste (preview) antes de ir para a
concessionária (produção).

## Decisões desta fase

| Decisão     | Valor adotado                                           | Pode mudar?                            |
| ----------- | ------------------------------------------------------- | -------------------------------------- |
| Repositório | `elizfab/admin`, **privado**                            | Sim: troque o nome nos comandos        |
| Domínio     | `https://admin.vercel.app` (gratuito, da Vercel)        | Domínio próprio é opcional (passo 07)  |
| Bancos      | 2 projetos Supabase Free: **produção** e **preview**    | O plano Free permite 2 projetos ativos |
| Região      | São Paulo: Supabase `sa-east-1` e funções Vercel `gru1` | Mantenha **as duas na mesma região**   |

## Limitações dos planos gratuitos (descobertas na pesquisa desta fase)

| Plano                     | Limitação                                                                 | Como o projeto lida                                |
| ------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------- |
| GitHub Free (organização) | **Não** permite branch protection nem rulesets em repositório **privado** | Fluxo disciplinado com PR + CI visível (passo 05)  |
| Supabase Free             | Pausa o projeto após ~7 dias com pouca atividade no banco                 | Workflow diário de _keep-alive_ (passo 09)         |
| Supabase Free             | **Sem** backup diário                                                     | Script de backup + teste de restauração (passo 09) |
| Supabase                  | Conexão direta só por **IPv6**; a Vercel não faz conexões IPv6            | `DIRECT_URL` com o _session pooler_ (IPv4)         |
| Vercel Hobby              | Rollback só para o deploy **imediatamente anterior**                      | Roteiro de incidentes (passo 10)                   |
| Vercel Hobby              | Previews protegidos por login da Vercel; produção pública                 | Correto aqui: a aplicação já exige login próprio   |

## Ordem dos passos

| #   | Passo                                                               | O que entrega                                             | Status |
| --- | ------------------------------------------------------------------- | --------------------------------------------------------- | ------ |
| 01  | [Headers de segurança](01-headers-de-seguranca.md)                  | 6 headers em todas as respostas                           | ⬜     |
| 02  | [Validação de variáveis no build](02-validacao-de-variaveis.md)     | Build falha cedo se faltar segredo                        | ⬜     |
| 03  | [Preparar o projeto para a Vercel](03-preparar-para-vercel.md)      | Versão do Node, `vercel.json`, URL dinâmica para previews | ⬜     |
| 04  | [Repositório no GitHub](04-repositorio-github.md)                   | `elizfab/admin` privado, com histórico                    | ⬜     |
| 05  | [CI no GitHub Actions e fluxo de trabalho](05-ci-github-actions.md) | Testes automáticos a cada push e PR                       | ⬜     |
| 06  | [Bancos Supabase de produção e preview](06-bancos-supabase.md)      | 2 projetos, Data API desligada                            | ⬜     |
| 07  | [Projeto na Vercel e variáveis](07-projeto-vercel.md)               | Variáveis por ambiente, região, proteção                  | ⬜     |
| 08  | [Primeiro deploy e verificação](08-primeiro-deploy.md)              | Preview e produção no ar, administradora criada           | ⬜     |
| 09  | [Backup, restauração e keep-alive](09-backup-e-keepalive.md)        | Backup criptografado e restauração testada                | ⬜     |
| 10  | [Operação e checklist de go-live](10-operacao-e-go-live.md)         | Roteiro de incidentes + checklist final                   | ⬜     |

## ✅ Critério de conclusão da fase

- Um _pull request_ gera CI verde e um preview funcional, com login.
- O merge na `main` publica em produção, e `/api/v1/health` responde `200`.
- A bateria `security-check.sh` passa **contra a produção**.
- Existe um backup de produção **restaurado com sucesso** pelo menos uma vez.

## Versões validadas (11/11/2026)

| Item                                 | Versão / valor                                                               |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| Node.js (`.nvmrc`)                   | 22                                                                           |
| GitHub Actions                       | `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4` |
| PostgreSQL no CI                     | 16 (igual ao Docker local)                                                   |
| `pg_dump` / `pg_restore` dos scripts | Imagem `postgres:17-alpine` (ajustável)                                      |

> **O que foi validado aqui, e o que só pode ser validado na sua conta:** o
> CI foi executado localmente com `CI=true` (mesmos comandos e banco), os
> headers, a validação de variáveis, a URL dinâmica de preview, os cookies
> `__Secure-`, o `vercel-build` e os scripts de backup e restauração foram
> testados de verdade. A criação das contas, dos projetos e das variáveis no
> GitHub, no Supabase e na Vercel acontece nos painéis, e cada passo traz um
> teste para você confirmar.

---

← Fase anterior: [05 — Testes](../05-setup-testes-e2e/README.md) · [Mapa geral](../../README.md)
