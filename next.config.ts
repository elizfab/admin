import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

import { assertProductionEnv } from "./src/lib/env/required-env";

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

// Função (e não objeto): o Next.js informa a fase. Só o build de produção
// exige as variáveis; o `dev` e os testes seguem funcionando sem elas.
export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) {
    assertProductionEnv(process.env);
  }

  return nextConfig;
}
