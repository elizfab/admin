# Fase 06 — Repositório Remoto, Deploy e Operação

> **Status:** 📋 Planejada — o passo a passo será escrito quando a fase começar.\
> **Depende de:** [Fase 05 — Testes E2E](../05-setup-testes-e2e/README.md) concluída\
> **Arquitetura:** ARCHITECTURE.md, seções 3.3 e 18

## Objetivo da fase

Aplicação publicada, protegida e com fluxo de validação reproduzível:
GitHub (organização `elizfab`) → Preview na Vercel → produção.

## 💡 Por que o repositório remoto vem só agora

Todo o histórico já existe no Git local desde a Fase 00. Conectar ao GitHub
é só “enviar o álbum de fotos” que já foi montado: nada se perde, e cada
commit chega com sua mensagem original.

## Antes de começar (decisões e informações necessárias)

- [ ] Nome definitivo do repositório na organização `elizfab` (sugestão: `personal-platform-admin`)
- [ ] Repositório privado (confirmado na arquitetura)
- [ ] Banco de produção: Supabase Free ou outro PostgreSQL gerenciado
- [ ] Política de backup e recuperação
- [ ] Domínio personalizado (opcional)

## Passos previstos

| # | Passo | Status |
|---|---|---|
| 01 | Criar o repositório privado e conectar (`git remote add` + `git push`) | 📋 |
| 02 | Proteger a branch `main` | 📋 |
| 03 | Projeto na Vercel conectado ao repositório | 📋 |
| 04 | Variáveis de ambiente por ambiente (Development, Preview e Production) | 📋 |
| 05 | Migrations em produção (`prisma migrate deploy`) | 📋 |
| 06 | Preview Deploy e validação | 📋 |
| 07 | Production Deploy (somente com autorização explícita) | 📋 |
| 08 | Backup e recuperação documentados e testados | 📋 |

## ✅ Critério de conclusão da fase

Um *pull request* gera um Preview funcional; o merge em `main` publica em
produção; a URL de produção exige login; e existe um backup restaurado com
sucesso pelo menos uma vez.

---

← [Fase anterior](../05-setup-testes-e2e/README.md) · [Mapa geral](../../README.md)
