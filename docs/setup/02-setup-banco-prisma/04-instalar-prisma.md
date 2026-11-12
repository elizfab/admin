# Passo 04 — Instalar o Prisma 7

> **Fase:** 02 — Banco e Prisma\
> **Tempo estimado:** 10 min\
> **Depende de:** [Passo 03](03-modelagem-e-erd.md)

## Objetivo

Instalar o Prisma ORM **7** e o driver do PostgreSQL, com as versões fixadas.

## 💡 Por que

### O que cada pacote faz

O Prisma é um **tradutor**: você escreve `prisma.user.findUnique(...)` em
TypeScript, e ele gera o SQL, envia ao banco e devolve objetos **tipados**.

| Pacote | Tipo | Papel |
|---|---|---|
| `prisma` | dev | CLI: migrations, `generate`, Studio |
| `@prisma/client` | runtime | Base do client gerado |
| `@prisma/adapter-pg` | runtime | Liga o Prisma ao driver `pg` (*driver adapter*, obrigatório no Prisma 7) |
| `pg` | runtime | Driver oficial do PostgreSQL para Node.js |
| `dotenv` | dev | Carrega o `.env.local` para o CLI do Prisma |
| `tsx` | dev | Executa scripts TypeScript (o seed, na Fase 03) |
| `@types/pg` | dev | Tipos TypeScript do `pg` |

### ⚠️ Por que `@7` explícito em todos os comandos

Em 11/11/2026, a tag `latest` do pacote `prisma` no npm aponta para uma
versão **8.0.0 release candidate** (ainda não estável), enquanto o
`@prisma/client` está na 7.10.1. Um `npm install prisma` sem versão
instalaria um CLI 8 incompatível com o client 7. Além disso, o adapter do
Better Auth (Fase 03) ainda **não suporta** o Prisma 8. O próprio guia
oficial do Prisma 7 instala o CLI com `prisma@prev` pelo mesmo motivo.

💡 É como comprar uma peça de carro: você pede o modelo **exato**, e não “a
mais nova da loja”, que pode ser de outro carro.

## Pré-requisitos

- Passo 03 concluído.
- Node.js ≥ 20.19 e TypeScript ≥ 5.4 (requisitos do Prisma 7).

## Passo a passo

### 1. Instalar as dependências de runtime

```bash
npm install @prisma/client@7 @prisma/adapter-pg@7 pg
```

### 2. Instalar as dependências de desenvolvimento

```bash
npm install -D prisma@7 dotenv tsx @types/pg
```

### 3. Conferir as versões

```bash
npx prisma --version
```

Esperado: `prisma` e `@prisma/client` com o **mesmo** número `7.x.x`.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `package.json` / `package-lock.json` | Alterado | Novas dependências |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npx prisma --version` | `prisma : 7.x.x` e `@prisma/client : 7.x.x` (iguais) |
| 2 | `npm ls prisma @prisma/client @prisma/adapter-pg` | Os três em `7.x.x` |

**Critério de aceite:** nenhuma dependência do Prisma em `8.x` ou `rc`.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `prisma : 8.0.0-rc...` | Instalou sem `@7` | `npm install -D prisma@7` |
| Versões diferentes entre CLI e client | Instalações em momentos diferentes | Reinstalar os três com `@7` |

## Commit sugerido

```bash
git add package.json package-lock.json
git commit -m "chore(db): instala Prisma 7 e driver PostgreSQL"
```

## Referências

- [Prisma — Upgrade to v7](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Prisma 7 + Next.js](https://www.prisma.io/docs/guides/v7/frameworks/nextjs)
- [Better Auth — Prisma adapter](https://www.better-auth.com/docs/adapters/prisma)

---

← [Passo anterior](03-modelagem-e-erd.md) · [Índice da fase](README.md) · [Próximo passo](05-configurar-prisma.md) →
