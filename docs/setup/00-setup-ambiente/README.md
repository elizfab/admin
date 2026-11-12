# Fase 00 — Setup do Ambiente

> **Objetivo da fase:** garantir que a máquina tem as ferramentas certas e que
> a pasta `_admin` está versionada com Git **antes** de qualquer código.\
> **Tempo estimado:** 20 a 30 min\
> **Mapa geral:** [`docs/README.md`](../../README.md)

## Por que esta fase existe

💡 Antes de cozinhar, um chef confere se o fogão acende e se as panelas estão
limpas. Erros de ambiente (versão errada do Node, Git sem identidade) parecem
erros do projeto e fazem perder horas. Esta fase elimina essa dúvida logo no
início.

## Passos

| #   | Passo                                                                   | Status |
| --- | ----------------------------------------------------------------------- | ------ |
| 01  | [Verificar ferramentas](01-verificar-ferramentas.md)                    | ⬜     |
| 02  | [Preparar a pasta do projeto e o Git local](02-preparar-pasta-e-git.md) | ⬜     |

## Checklist da fase

- [ x ] Node.js ≥ 20.19 instalado
- [ x ] npm instalado
- [ x ] Git instalado, com `user.name` e `user.email` configurados
- [ x ] VS Code com as extensões recomendadas
- [ x ] Pasta `_admin` contendo `docs/`
- [ x ] `git init` executado em `_admin`, com branch `main`
- [ x ] Primeiro commit (documentação) realizado

## ✅ Critério de conclusão da fase

`git log --oneline` em `_admin` mostra o commit da documentação, e
`node --version` mostra uma versão ≥ 20.19.

---

[Mapa geral](../../README.md) · Próxima fase: [01 — Frontend](../01-setup-frontend/README.md) →
