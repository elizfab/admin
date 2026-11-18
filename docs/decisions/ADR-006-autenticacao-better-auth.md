# ADR-007 — Portal Dev protegido, servido pelo Admin

| Campo        | Valor                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------ |
| **Status**   | Aceita                                                                                     |
| **Data**     | 17/11/2026                                                                                 |
| **Resolve**  | Decisão pendente da seção 19.2 do ARCHITECTURE.md ("Estratégia de proteção do Docusaurus") |
| **Decisora** | Liza (Elizabete Fabri)                                                                     |

## Contexto

O Portal Dev (repositório `elizfab/portal-dev`) é um site Docusaurus
publicado no GitHub Pages, **público**. O ARCHITECTURE.md (seção 19.1)
já registrava o problema: o GitHub Pages não tem autenticação, e esconder o
link no dashboard não impede o acesso direto à URL. A seção 19.2 exigia que a
proteção acontecesse **antes de entregar os arquivos**, nunca com um
formulário de login só no frontend.

Fatos que pesaram:

- O Admin já tem sessão validada no banco (Better Auth, ADR-006).
- O repositório do Admin é **público** (exigência do plano Hobby da Vercel
  para repositórios de organização), então o build do portal **não pode**
  ser commitado nele.
- O proxy do Admin é **otimista**: só confere se o cookie existe. Arquivos em
  `public/` seriam entregues pela CDN sem validação real de sessão.
- O build do portal tem cerca de 12 MB e 330 arquivos (2,5 MB compactado).

## Decisão

1. O `portal-dev` passa a ser **privado**, e o GitHub Pages é **desligado**.
2. O CI do `portal-dev` gera o build com `baseUrl: /portal/` e o publica como
   asset da release `portal-build`; depois aciona o **deploy hook** do Admin.
3. O `vercel-build` do Admin baixa esse asset com um **token de leitura**
   (`PORTAL_DEV_TOKEN`) e o extrai em `.portal/` (fora de `public/`, fora do Git).
4. Um **Route Handler** `/portal/[[...path]]` entrega os arquivos **somente
   depois de validar a sessão no banco**, com `Cache-Control: private`.
5. A página `/documentation` do Admin lista as seções a partir do
   `portal-build.json` gerado pelo CI do portal.

## Alternativas consideradas

| Alternativa                            | Por que não                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------------- |
| Manter público, com atalho no Admin    | Não atende ao pedido de proteção; conteúdo indexável                                |
| Cloudflare Access na frente do Pages   | Segundo login, domínio próprio obrigatório, sessão separada da do Admin             |
| Copiar o build para `public/` do Admin | `public/` é servido sem validar a sessão, e o repositório do Admin é público        |
| Renderizar os `.mdx` dentro do Admin   | Reescrever sidebar, busca, Mermaid e tema do Docusaurus: muito esforço, pouco ganho |
| Vercel Deployment Protection           | Recurso pago e independente da conta do Admin                                       |

## Consequências

**Positivas**

- Uma só sessão: quem está logado no Admin lê o portal; quem não está, vai para o `/login`.
- O conteúdo deixa de ser público (repositório e site).
- O Docusaurus continua igual para escrever (busca, sidebar, Mermaid, tema).

**Negativas e mitigação**

| Custo                                                                        | Mitigação                                                                                     |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Cada arquivo do portal passa por uma função e uma consulta de sessão         | Assets com hash ficam no cache do navegador por 1 ano (`immutable`); só HTML e JSON revalidam |
| O deploy do Admin depende do GitHub (download do pacote)                     | Falha explícita no build; o deploy anterior continua no ar                                    |
| Publicar conteúdo novo exige um deploy do Admin                              | Deploy hook automático no CI do portal                                                        |
| O link "← Admin" do portal aponta para a URL de produção também nos previews | Aceito: é só um atalho de navegação                                                           |
| Token com prazo de validade                                                  | Data de expiração anotada; renovação no passo 06 da Fase 08                                   |

## Referências

- ARCHITECTURE.md, seção 19
- Fase 08 — [`setup/08-portal-dev`](../setup/08-portal-dev/README.md)
- [Next.js — `outputFileTracingIncludes`](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
