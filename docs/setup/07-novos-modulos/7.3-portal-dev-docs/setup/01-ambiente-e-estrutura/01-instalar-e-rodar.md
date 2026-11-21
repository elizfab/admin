# Passo 01 — Instalar e rodar

> **Fase:** 01 — Ambiente e estrutura\
> **Tempo estimado:** 15 min\
> **Depende de:** Node.js 22 instalado

## Objetivo

Ter o portal rodando localmente com recarga automática e saber os comandos do dia a dia.

## 💡 Por que a porta 3001 e o endereço `/portal/`

O portal é servido pelo Admin em `/portal/` (fase 04). 💡 Para o ensaio ser
igual à apresentação, o dev usa o **mesmo endereço**: assim, um link que
funciona no `npm start` também funciona no Admin. A porta é **3001** porque a
3000 é do Admin; os dois podem rodar juntos.

## Pré-requisitos

- `node --version` mostra `v22.x` (o `frontend/.nvmrc` fixa a versão; com `nvm`, rode `nvm use` na pasta `frontend`).

## Passo a passo

### 1. Instalar

```bash
cd frontend
npm ci
```

💡 `npm ci` instala **exatamente** o que está no `package-lock.json` (o mesmo que o CI usa).
Use `npm install` só quando for adicionar ou atualizar uma dependência.

### 2. Comandos

| Comando | Para quê |
|---|---|
| `npm start` | Dev com hot reload em `http://localhost:3001/portal/` |
| `npm run build` | Gera o site em `build/`; **falha** se houver link quebrado |
| `npm run serve -- --port 3001` | Serve o `build/` (é aqui que a **busca** funciona) |
| `npm run typecheck` | Confere os tipos TypeScript |
| `npm run build:admin` | Build + `portal-build.json` (fase 04) |
| `npm run clear` | Limpa o cache do Docusaurus quando algo "não atualiza" |

## Arquivos criados ou alterados

Nenhum.

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm start` | Abre `http://localhost:3001/portal/` com a home "Portal Dev" |
| 2 | Edite um texto em `docs/intro.mdx` e salve | A página atualiza sozinha |
| 3 | `npm run typecheck && npm run build` | Sem erros; pasta `build/` criada |

**Critério de aceite:** os 3 testes passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Port 3001 is already in use` | Outro `npm start` aberto | Feche-o, ou `npm start -- --port 3002` |
| Busca não mostra resultados no `npm start` | A busca local só é gerada no build | Use `npm run build && npm run serve -- --port 3001` |
| Build falha com `Broken link` | Link para página inexistente (`onBrokenLinks: 'throw'`) | Corrija o link apontado na mensagem |
| Mudança não aparece | Cache do Docusaurus | `npm run clear` e `npm start` |

## Commit sugerido

Nenhum.

## Referências

- [Docusaurus — Installation](https://docusaurus.io/docs/installation)
- [Docusaurus — CLI](https://docusaurus.io/docs/cli)

---

← [Índice da fase](README.md) · [Próximo passo](02-estrutura.md) →
