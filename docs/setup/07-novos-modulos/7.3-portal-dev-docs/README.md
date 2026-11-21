# Portal Dev — Mapa de Implementação e Manutenção

> **Projeto:** Portal Dev (caderno de estudos em Docusaurus 3)\
> **Repositório:** `elizfab/portal-dev` (**privado** a partir da fase 04)\
> **Onde é lido:** no Admin, em `/portal`, somente com login ([ADR-007 do Admin](https://github.com/elizfab/admin/blob/main/docs/decisions/ADR-007-portal-dev-protegido.md))\
> **Última atualização:** 17/11/2026

Este mapa organiza o portal em **fases**, no mesmo formato da documentação do
Admin. 💡 O Admin é a biblioteca; o portal é a **editora**: aqui se escreve,
revisa e imprime o conteúdo; quem empresta (e confere a carteirinha) é o Admin.

## 1. Como usar

1. Fases 01 a 03 documentam o portal **como ele já é**: leia uma vez e use como
   referência ao escrever conteúdo.
2. A fase 04 é **implementação**: ela muda o portal para ser servido pelo Admin.
   Ela se intercala com a Fase 08 do Admin; siga a ordem do
   [README da fase 04](setup/04-integracao-admin/README.md).
3. Todo passo termina com **Como testar**; só avance quando o critério de aceite passar.

## 2. Status das fases

Legenda: ⬜ não iniciada · 🟨 em andamento · ✅ concluída

| Fase | Pasta | Objetivo | Status |
|---|---|---|---|
| 01 | [`setup/01-ambiente-e-estrutura`](setup/01-ambiente-e-estrutura/README.md) | Instalar, rodar e entender as pastas | ✅ (referência) |
| 02 | [`setup/02-conteudo`](setup/02-conteudo/README.md) | Criar páginas, categorias e usar os componentes | ✅ (referência) |
| 03 | [`setup/03-tema-e-configuracao`](setup/03-tema-e-configuracao/README.md) | `docusaurus.config.ts`, tema, busca e Mermaid | ✅ (referência) |
| 04 | [`setup/04-integracao-admin`](setup/04-integracao-admin/README.md) | Build para o Admin, release, deploy hook e repositório privado | ⬜ |

## 3. Estrutura do repositório

```text
portal-dev/
├── README.md
├── docs/                    ← esta documentação (como montar e manter o portal)
├── documentation/           ← anotações antigas em Markdown puro (fonte histórica)
├── frontend/                ← o site Docusaurus
│   ├── docs/                ← o CONTEÚDO do site (.mdx)
│   ├── src/                 ← componentes, tema (custom.css), home
│   ├── static/img/          ← logos e favicons
│   ├── templates/           ← modelo de página
│   ├── scripts/             ← write-build-info.mjs (fase 04)
│   └── docusaurus.config.ts
└── .github/workflows/deploy.yml   ← build, release e deploy hook (fase 04)
```

⚠️ Não confunda `docs/` (raiz: **esta** documentação) com `frontend/docs/` (o
**conteúdo** publicado no portal).

## 4. Versões validadas (17/11/2026)

| Ferramenta | Versão |
|---|---|
| Node.js | 22 (`frontend/.nvmrc`) |
| Docusaurus (`@docusaurus/*`) | 3.10.2 |
| React | 19 |
| TypeScript | ~6.0 |
| `@easyops-cn/docusaurus-search-local` | 0.55.x |

## 5. Como pedir ajuda

Envie: o passo (arquivo e número), o comando exato, a saída completa do
terminal, o que esperava e a saída de `node --version`. ⚠️ Nunca cole tokens
nem a URL do deploy hook.
