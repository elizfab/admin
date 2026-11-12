# Passo 08 — Health check com verificação do banco

> **Fase:** 02 — Banco e Prisma\
> **Tempo estimado:** 30 min\
> **Depende de:** [Passo 07](07-cliente-prisma.md)

## Objetivo

Criar o endpoint `GET /api/v1/health`, que consulta o banco e responde
**200** quando está tudo bem ou **503** quando o banco está fora, sem expor
nenhum dado interno.

## 💡 Por que

O health check é o **termômetro** da aplicação: ferramentas de
monitoramento, a Vercel e você mesma perguntam “está viva?” sem precisar
fazer login. Por ser **público**, ele não pode revelar nada útil a um
atacante (host do banco, versão, mensagem de erro).

| Código | Significado aqui |
|---|---|
| `200 OK` | Aplicação e banco respondendo |
| `503 Service Unavailable` | Aplicação no ar, banco indisponível. Comunica um problema **temporário** |

### Route Handler

Um arquivo `route.ts` dentro de `app/api` vira um endpoint HTTP. Cada
função exportada (`GET`, `POST`…) atende um método. É o “balcão de
atendimento” para quem chega de fora (ARCHITECTURE.md, seção 9.1).

## Pré-requisitos

- Passo 07 concluído; banco local `healthy`.

## Passo a passo

### 1. Criar o Route Handler

```bash
mkdir -p src/app/api/v1/health
```

`src/app/api/v1/health/route.ts`:

```ts
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";

// Endpoint público de diagnóstico.
// Responde apenas o estado geral: nunca host, usuário, versão ou mensagem de erro.
export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({ status: "ok", database: "up", timestamp });
  } catch (error) {
    // O detalhe completo vai só para o log do servidor.
    console.error("[health] falha ao consultar o banco:", error);

    return NextResponse.json(
      { status: "degraded", database: "down", timestamp },
      { status: 503 },
    );
  }
}
```

| Trecho | Explicação |
|---|---|
| ``$queryRaw`SELECT 1` `` | A consulta mais simples possível: só confirma que o banco responde |
| `try/catch` | Sem ele, um erro de conexão viraria `500` com detalhes internos |
| `console.error(...)` | O detalhe fica **no log do servidor**, nunca na resposta |
| Prefixo `/api/v1` | Versão da API (seção 10): mudanças incompatíveis futuras vão para `/v2` sem quebrar quem usa a `v1` |

💡 O template `` $queryRaw`...` `` (com crases) é **seguro contra SQL
injection**: o Prisma trata as variáveis como parâmetros. Nunca monte SQL
concatenando strings.

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/app/api/v1/health/route.ts` | Criado | Endpoint de diagnóstico |

## ✅ Como testar

Com `npm run dev` rodando, em outro terminal:

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `curl -i http://localhost:3000/api/v1/health` | `HTTP/1.1 200` e `{"status":"ok","database":"up","timestamp":"..."}` |
| 2 | `npm run db:down` e repetir o `curl` | `HTTP/1.1 503` e `{"status":"degraded","database":"down",...}`. O terminal do `dev` mostra o erro completo |
| 3 | `npm run db:up`, aguardar `healthy` e repetir o `curl` | Volta para `200`, sem reiniciar a aplicação |
| 4 | Conferir a resposta do teste 2 | **Nenhum** host, porta, usuário ou mensagem de erro do banco |
| 5 | `npm run typecheck && npm run lint && npm test && npm run build` | Tudo passa; o build lista `ƒ /api/v1/health` |

**Critério de aceite:** os cinco testes passam. **Este é o critério de
conclusão da Fase 02.**

💡 O teste 3 prova que o *pool* de conexões se recupera sozinho. Testes
negativos (2) e de recuperação (3) valem tanto quanto o “caminho feliz” (1).

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `500` com `DATABASE_URL não está definida` | O `.env.local` não tem a variável, ou o `dev` foi iniciado antes de criá-la | Conferir o arquivo e reiniciar o `npm run dev` |
| `404` | Pasta ou arquivo com nome errado | O caminho deve ser exatamente `src/app/api/v1/health/route.ts` |

## Commit sugerido

```bash
git add src/app/api
git commit -m "feat(api): adiciona health check com verificação do banco"
```

Ao concluir, atualize o status da fase no [README da fase](README.md) e no
[mapa geral](../../README.md).

## Referências

- [Next.js — Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Prisma — Raw queries](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries)
- [MDN — 503 Service Unavailable](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status/503)
- ARCHITECTURE.md, seções 9.1, 10 e 12.5

---

← [Passo anterior](07-cliente-prisma.md) · [Índice da fase](README.md) · Próxima fase: [03 — Autenticação](../03-setup-autenticacao/README.md) →
