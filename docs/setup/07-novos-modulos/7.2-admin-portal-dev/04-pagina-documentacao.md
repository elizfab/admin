# Passo 04 — Página Documentação

> **Fase:** 08 — Portal Dev protegido\
> **Tempo estimado:** 30 min\
> **Depende de:** [Passo 03](03-servir-com-sessao.md)

## Objetivo

Trocar o "Em breve" de `/documentation` por uma página que abre o portal,
lista as seções e mostra **qual versão** do portal está publicada.

## 💡 De onde vêm as seções

O CI do `portal-dev` grava `portal-build.json` dentro do pacote: o commit, a
data do build e uma seção por pasta de `docs/` (rótulo do `_category_.json`).
💡 É a **etiqueta da caixa**: o Admin sabe o que chegou sem abrir os livros.
Quando você cria uma categoria nova no portal, ela aparece aqui sozinha no
próximo deploy.

```json
{
  "commit": "80ecb03",
  "builtAt": "2026-11-17T20:09:37.990Z",
  "sections": [{ "label": "Frontend", "href": "/portal/docs/frontend" }]
}
```

### Por que `<a>` e não `<Link>`

O `<Link>` do Next.js faz navegação **interna**: em vez de pedir a página
inteira, ele busca só os dados da próxima página do Next.js (o *RSC payload*).
`/portal` não é uma página do Next.js, é um Route Handler que devolve o HTML do
Docusaurus. Com `<Link>`, a navegação falharia. Com `<a>`, o navegador carrega
o portal de verdade.

O ESLint do Next.js reclama de `<a>` apontando para uma rota interna
(`no-html-link-for-pages`). Aqui a exceção é **consciente**, e por isso fica
desligada só naquela linha, com o motivo escrito.

## Pré-requisitos

- Passo 03 concluído.

## Passo a passo

### 1. Substituir a página

`src/app/(private)/documentation/page.tsx`:

```tsx
import { ArrowRight, BookOpen } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { buttonClassName } from "@/components/ui/Button/Button";
import { readPortalBuildInfo } from "@/lib/portal/portal-files";

import styles from "./page.module.scss";

export const metadata: Metadata = {
    title: "Documentação",
};

const builtAtFormatter = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
});

/*
 * Links para /portal usam <a> e NÃO <Link>: /portal é um Route Handler que
 * devolve o HTML do Docusaurus. O <Link> tentaria uma navegação interna do
 * Next.js (buscando um "RSC payload") e não encontraria uma página.
 */
export default async function DocumentationPage() {
    const info = await readPortalBuildInfo();

    if (!info) {
        return (
            <EmptyState
                icon={<BookOpen size={32} aria-hidden="true" />}
                headingLevel="h1"
                title="Documentação"
                description="O Portal Dev não foi publicado neste ambiente. Localmente, rode npm run portal:fetch."
            />
        );
    }

    return (
        <div className={styles.page}>
            <PageHeader
                title="Documentação"
                description="Portal Dev: caderno de estudos com documentação técnica. Acesso só com login."
                action={
                    // eslint-disable-next-line @next/next/no-html-link-for-pages -- /portal é Route Handler (ver comentário acima)
                    <a href="/portal/" className={buttonClassName("primary")}>
                        <BookOpen size={16} aria-hidden="true" />
                        Abrir o Portal Dev
                    </a>
                }
            />

            <section aria-labelledby="sections-title">
                <h2 id="sections-title" className={styles.sectionsTitle}>
                    Seções
                </h2>
                <ul className={styles.sections}>
                    {info.sections.map((section) => (
                        <li key={section.href}>
                            <a href={section.href} className={styles.section}>
                                {section.label}
                                <ArrowRight size={14} aria-hidden="true" />
                            </a>
                        </li>
                    ))}
                </ul>
            </section>

            <p className={styles.meta}>
                Versão publicada: commit <code>{info.commit}</code>, gerada em{" "}
                {builtAtFormatter.format(new Date(info.builtAt))}.
            </p>
        </div>
    );
}
```

`src/app/(private)/documentation/page.module.scss`:

```scss
@use "@/styles/abstracts" as *;

.page {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.sectionsTitle {
  margin: 0 0 $space-3;
  font-size: $font-size-md;
}

.sections {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: $space-3;
  margin: 0;
  padding: 0;
  list-style: none;
}

.section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding: $space-4;
  font-weight: 600;
  color: var(--text-color);
  text-decoration: none;
  background: var(--card-background);
  border: 1px solid var(--border);
  border-radius: $radius-md;

  &:hover {
    border-color: var(--accent-color);
  }

  &:focus-visible {
    @include focus-ring;
  }

  svg {
    flex-shrink: 0;
    color: var(--text-color-secondary);
  }
}

.meta {
  margin: 0;
  font-size: $font-size-xs;
  color: var(--text-color-secondary);
}
```

### 2. Card do dashboard

Em `src/modules/dashboard/data/modules.mock.ts`, o card de Documentação deixa
de ser "Aplicação externa":

```ts
        description: "Portal Dev: caderno de estudos, protegido por login.",
        href: "/documentation",
        icon: BookOpen,
        status: "available",
```

💡 O item **Estudos** da sidebar (`/studies`) continua como "Em breve". Se você
quiser que Estudos **seja** o portal (como diz a seção 1 do ARCHITECTURE.md),
basta trocar o `href` dele em `navigation.ts` para `/documentation` e ajustar o
`navigation.spec.ts`. Decida isso antes do commit, para não refazer os testes.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/app/(private)/documentation/page.tsx` | Substituído | Seções, botão e versão |
| `src/app/(private)/documentation/page.module.scss` | Criado | Grade de seções (tokens de tema) |
| `src/modules/dashboard/data/modules.mock.ts` | Alterado | Documentação "Disponível" |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Dashboard → card **Documentação** | Abre `/documentation` com 10 seções e "Versão publicada: commit …" |
| 2 | **Abrir o Portal Dev** | Home do portal |
| 3 | Clicar numa seção (ex.: Backend) | Página da categoria no portal |
| 4 | Navbar do portal → **← Admin** | Volta ao dashboard do Admin |
| 5 | Apagar `.portal/` e recarregar `/documentation` | "O Portal Dev não foi publicado neste ambiente…" |

**Critério de aceite:** os 5 testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Clicar em "Abrir o Portal Dev" mostra 404 do Next.js | `<Link>` no lugar de `<a>` | Use `<a href="/portal/">` |
| "← Admin" vai para a produção durante o dev | O build do portal foi gerado com a URL de produção | Para o dev, gere com `PORTAL_URL=http://localhost:3000` (`portal-dev`, fase 04) |
| Seções desatualizadas | `.portal/` antigo | Baixe/extraia de novo (`npm run portal:fetch`) |

## Commit sugerido

```bash
git add "src/app/(private)/documentation" src/modules/dashboard
git commit -m "feat(docs): página Documentação com as seções do portal"
```

## Referências

- [Next.js — `<Link>`](https://nextjs.org/docs/app/api-reference/components/link)
- [Next.js ESLint — `no-html-link-for-pages`](https://nextjs.org/docs/messages/no-html-link-for-pages)

---

← [Passo anterior](03-servir-com-sessao.md) · [Índice da fase](README.md) · [Próximo passo](05-testes.md) →
