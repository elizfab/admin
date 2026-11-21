# Fase 04 — Integração com o Admin

> **Objetivo da fase:** o portal deixa de ser publicado no GitHub Pages e passa a
> ser servido pelo **Admin** em `/portal`, só para quem está logado. O
> repositório fica **privado**.\
> **Tempo estimado:** 2 horas (somando os passos do Admin, 5 a 7 horas)\
> **Decisão:** [ADR-007 do Admin](https://github.com/elizfab/admin/blob/main/docs/decisions/ADR-007-portal-dev-protegido.md)\
> **Mapa geral:** [`docs/README.md`](../../README.md)

## 💡 O papel do portal-dev nesta mudança

💡 O portal-dev é a **editora**: escreve, imprime (build) e despacha a caixa
(release `portal-build`). O Admin é a **biblioteca**: busca a caixa, guarda no
acervo restrito e só empresta a quem mostra a carteirinha (sessão).

```text
push na main ─▶ CI: typecheck → build:admin → tar ─▶ release "portal-build"
                                                  └─▶ deploy hook ─▶ Admin baixa e publica
```

## Ordem dos passos (intercalada com o Admin)

| # | Onde | Passo | Status |
|---|---|---|---|
| 1 | Admin | Fase 08, passo 01 (ADR-007) | ⬜ |
| 2 | **portal-dev** | [01 — Build para o Admin](01-build-para-o-admin.md) | ⬜ |
| 3 | **portal-dev** | [02 — CI e release](02-ci-e-release.md) | ⬜ |
| 4 | Admin | Fase 08, passos 02 a 07, até o item 3 do passo 07 (produção servindo o portal) | ⬜ |
| 5 | **portal-dev** | [03 — Tornar privado e desligar o Pages](03-tornar-privado.md) | ⬜ |
| 6 | Admin | Fase 08, passo 07, itens 5 e 6 (ciclo completo) | ⬜ |

⚠️ O passo 03 (privado) vem **depois** de o Admin servir o portal em produção:
assim o conteúdo nunca fica fora do ar.

## Checklist da fase

- [ ] `baseUrl` e URL do site vindos do ambiente (`PORTAL_BASE_URL`, `PORTAL_URL`)
- [ ] Link **← Admin** na navbar
- [ ] `npm run build:admin` gera o `build/portal-build.json`
- [ ] CI publica `portal-build.tar.gz` na release `portal-build` e chama o deploy hook
- [ ] Repositório privado e GitHub Pages desligado
- [ ] Links antigos para `elizfab.github.io/portal-dev` removidos

---

← [Fase 03](../03-tema-e-configuracao/README.md) · [Mapa geral](../../README.md) · [Passo 01](01-build-para-o-admin.md) →
