import type { MetadataRoute } from "next";

/**
 * robots.ts — política de crawling do Controle Popular
 *
 * Princípio: portal de transparência pública.
 * Pesquisa sem fins comerciais é bem-vinda; vigilância, coleta de dados
 * pessoais e raspagem para enriquecimento de perfil são vedadas.
 *
 * Rotas de painel e API interna ficam fora do índice.
 * O arquivo público /robots.txt (em public/) repete as mesmas regras
 * com uma nota editorial legível por humanos.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Bots de IA (treinamento comercial) ──────────────────────────────
      // O conteúdo é dado público; coleta para treinamento de modelos
      // comerciais não é o uso cívico que a licença permite.
      { userAgent: "GPTBot",        disallow: ["/"] },
      { userAgent: "CCBot",         disallow: ["/"] },
      { userAgent: "anthropic-ai",  disallow: ["/"] },
      { userAgent: "Google-Extended", disallow: ["/"] },
      { userAgent: "Omgilibot",     disallow: ["/"] },
      { userAgent: "FacebookBot",   disallow: ["/"] },

      // ── Buscadores de pesquisa pública ───────────────────────────────────
      {
        userAgent: ["Googlebot", "Bingbot", "DuckDuckBot", "Slurp"],
        allow: "/",
        disallow: [
          "/*/admin",
          "/*/api/",
          "/painel/",
          "/api/painel/",
        ],
      },

      // ── Regra geral (todos os outros) ────────────────────────────────────
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/*/admin",
          "/*/api/",
          "/painel/",
          "/api/painel/",
        ],
      },
    ],
    sitemap: "https://controlepopular.com.br/sitemap.xml",
    host: "https://controlepopular.com.br",
  };
}
