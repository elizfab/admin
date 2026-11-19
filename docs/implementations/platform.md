# Plataforma: regras validadas

> Autenticação, sessão, segurança, contrato da API, tema e deploy.

| ID | Regra | Por quê | Protegida por |
|---|---|---|---|
| PLAT-R01 | Cadastro público desligado (`disableSignUp: true`); contas só pelo seed | Portal pessoal, uma administradora | `src/lib/auth/auth.ts` (sem teste automático: **dívida T-0001**) |
| PLAT-R02 | Login de conta com `isActive = false` é recusado (hook de sessão) | Desativar acesso sem apagar dados | `src/lib/auth/auth.ts` (sem teste automático: **dívida T-0001**) |
| PLAT-R03 | Sessão expira em 8 h e é renovada a cada 1 h de uso | Limita janela de sessão roubada | `src/lib/auth/auth.ts` (sem teste automático: **dívida T-0001**) |
| PLAT-R04 | Rate limit no login: 5 tentativas por 60 s, guardado no banco | Força bruta; funciona entre instâncias da Vercel | `src/lib/auth/auth.ts` (sem teste automático: **dívida T-0001**) |
| PLAT-R05 | Páginas privadas validam a sessão no servidor (`requireSession`); o proxy só confere o cookie | Cookie falso passa pelo proxy | `tests/e2e/auth.spec.ts › redireciona visitante sem sessão` (cookie falso: **dívida T-0001**) |
| PLAT-R06 | Toda rota privada está no `matcher` de `src/proxy.ts` | Redireciona cedo quem não está logado | Checklist de registro (Code Review); sem teste automático |
| PLAT-R07 | API responde `{ data }` / `{ error: { code, message, fieldErrors? } }`; 400/401/404/409 | Contrato único para telas e integrações | `tests/unit/lib/http/api-response.test.ts`, E2E de cada módulo |
| PLAT-R08 | Erro inesperado: detalhe só no log; resposta genérica | Não vazar detalhes internos | `src/lib/http/api-response.ts` |
| PLAT-R09 | Headers de segurança: `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, CSP, HSTS | Proteções do navegador | `next.config.ts` (teste manual na Fase 06) |
| PLAT-R10 | Build de produção falha sem as variáveis obrigatórias; `typecheck` usa `SKIP_ENV_VALIDATION=1`, ignorado na Vercel | Deploy "verde" sem segredo | `src/lib/env/required-env.test.ts` |
| PLAT-R11 | Nenhuma cor fixa; tokens nos dois temas (`_light.scss`, `_dark.scss`) | Tema claro/escuro consistente | `tests/e2e/accessibility.spec.ts` (claro e escuro) |
| PLAT-R12 | Sem violações do axe nas telas privadas, nos dois temas | WCAG AA | `tests/e2e/accessibility.spec.ts` |
| PLAT-R13 | Datas sem hora gravadas à meia-noite UTC e formatadas em UTC; "hoje"/"mês" no fuso de São Paulo | Data não "volta um dia" | `tests/unit/lib/dates/month.test.ts` |
| PLAT-R14 | Dinheiro em centavos inteiros; texto "1.234,56" convertido sem `parseFloat` | Sem erro de ponto flutuante | `tests/unit/lib/money/money.test.ts` |
| PLAT-R15 | `vercel-build` aplica migrations (`prisma migrate deploy`) antes do `next build` | Produção nunca roda com banco desatualizado | `package.json` (CI) |
| PLAT-R16 | `/finance`, `/finance/construction`, `/projects` e `/studies` têm "Voltar ao início" para o Dashboard (adicionada em T-0009) | Volta sem depender da sidebar (escondida no celular) | `tests/unit/components/shared/BackLink.test.tsx`, `tests/e2e/navigation.spec.ts` |
| PLAT-R17 | Arquivo novo ou alterado de `src/lib`, `src/modules`, `src/components` tem ≥ 95% de linhas, comandos, ramos e funções; o total não cai abaixo de `coverage-baseline.json`; commits só de formatação não contam (adicionada em T-0010) | Mudança sempre testada | `tests/unit/scripts/coverage-rules.test.ts`; etapa "Conferir cobertura" da CI |
| PLAT-R18 | Código no formato do Prettier; o pre-commit formata os arquivos do commit e a CI recusa arquivo fora do formato (adicionada em T-0011) | PR sem diff de indentação | Etapa "Formatação" da CI (`npm run format:check`) |
| PLAT-R19 | Merge na `develop` abre (ou atualiza) o PR `develop → main`; o merge na `main` é manual; nesse PR a cobertura confere só o total (adicionada em T-0016) | Release visível sem clique; produção continua decisão humana | `tests/unit/scripts/coverage-rules.test.ts › checksChangedFiles`; `.github/workflows/release-pr.yml` |
