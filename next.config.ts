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
