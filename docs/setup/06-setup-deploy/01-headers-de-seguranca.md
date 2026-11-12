# Passo 01 — Headers de segurança

> **Fase:** 06 — Deploy\
> **Tempo estimado:** 30 min\
> **Depende de:** [Fase 05 concluída](../05-setup-testes-e2e/README.md)

## Objetivo

Fazer toda resposta da aplicação sair com headers que mandam o navegador
**fechar portas** que ele deixaria abertas por padrão (item obrigatório da
seção 11.10).

## 💡 Por que

Os headers são **instruções de segurança coladas em cada entrega**: “não
abra este pacote dentro de outro”, “não adivinhe o conteúdo”, “só aceite por
HTTPS”. O navegador obedece. Custam uma linha cada e bloqueiam ataques
inteiros.

| Header | Ataque que bloqueia | 💡 Analogia |
|---|---|---|
| `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` | *Clickjacking*: seu painel dentro de um `<iframe>` invisível num site malicioso, com a pessoa clicando sem saber | Proibir que coloquem uma película falsa sobre o caixa eletrônico |
| `X-Content-Type-Options: nosniff` | O navegador “adivinhar” que um texto é script e executá-lo | Ler o rótulo, não cheirar o pote |
| `Referrer-Policy: strict-origin-when-cross-origin` | Vazar URLs internas (ex.: `/projects/<id>/edit`) para outros sites | Ao sair, dizer só de que prédio veio, não o andar e a sala |
| `Permissions-Policy` | Uso indevido de câmera, microfone, localização | Desligar os aparelhos que a casa não usa |
| CSP `form-action 'self'`, `base-uri 'self'`, `object-src 'none'` | Formulário desviado para outro domínio, `<base>` injetado, plugins antigos | Só aceitar entregas no próprio endereço |
| `Strict-Transport-Security` | Rebaixar a conexão para HTTP e interceptar | “Daqui em diante, só por HTTPS” |
| `poweredByHeader: false` | Anunciar a tecnologia usada | Não pendurar a planta da casa na porta |

### Por que uma CSP “básica”, e não uma completa

Uma CSP completa (`script-src` com *nonce*) bloqueia scripts injetados, mas
exige gerar um valor aleatório por requisição no `proxy.ts` e propagá-lo
aos scripts do Next.js. É um passo avançado, registrado como melhoria
futura. A CSP adotada aqui protege contra os ataques da tabela **sem risco
de quebrar** a aplicação (validado pela suíte E2E inteira).

## Pré-requisitos

- Fase 05 concluída.

## Passo a passo

### 1. Substituir o `next.config.ts`

Esta é a versão **deste passo**. O passo 02 acrescenta a validação de
variáveis ao mesmo arquivo.

```ts
import type { NextConfig } from "next";

/**
 * Headers de segurança aplicados a todas as respostas.
 * Cada um fecha uma "porta" que o navegador deixaria aberta por padrão.
 */
const securityHeaders = [
  // Não deixa o navegador "adivinhar" o tipo de arquivo (evita executar texto como script).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Proíbe exibir o site dentro de <iframe> de outros sites (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Ao clicar num link externo, envia só o domínio, nunca o caminho completo.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desliga APIs do navegador que o painel não usa.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // CSP básica: sem iframes externos, sem <object>, formulários só para o próprio site.
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  // Força HTTPS por 2 anos nas próximas visitas (ignorado em http://localhost).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Não anuncia "X-Powered-By: Next.js" (menos informação para atacantes).
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
```

## Arquivos criados ou alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `next.config.ts` | Alterado | Headers de segurança e `poweredByHeader: false` |

## ✅ Como testar

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | `npm run build && npm run start` e, em outro terminal, `curl -sI http://localhost:3000/login` | Os 6 headers da tabela aparecem; **não** aparece `X-Powered-By` |
| 2 | `npm run test:e2e` | `20 passed`: os headers não quebraram login, formulários nem navegação |
| 3 | Opcional, após o deploy (passo 08): <https://securityheaders.com> com a URL de produção | Nota A ou superior |

**Critério de aceite:** os testes 1 e 2 passam.

## ⚠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Formulário para de enviar | Ação apontando para outro domínio, bloqueada por `form-action 'self'` | Formulários do projeto usam Server Actions no próprio domínio; confira o `action` |
| Site precisa ser embutido em outro (ex.: Docusaurus em iframe) | `frame-ancestors 'none'` | Troque por `frame-ancestors https://dominio-permitido` e ajuste o `X-Frame-Options` |

## Commit sugerido

```bash
git add next.config.ts
git commit -m "feat(security): adiciona headers de segurança"
```

## Referências

- [Next.js — headers](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers)
- [Next.js — Content Security Policy](https://nextjs.org/docs/app/guides/content-security-policy)
- [OWASP — HTTP Security Response Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)
- [MDN — CSP](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CSP)
- ARCHITECTURE.md, seção 11.10

---

[Índice da fase](README.md) · [Próximo passo](02-validacao-de-variaveis.md) →
