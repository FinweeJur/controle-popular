import type { MetadataRoute } from "next";

/**
 * `/admin` some daqui (por padrão `[municipio]`, cobre as 6 cidades) porque
 * é o painel de moderação — ferramenta interna atrás de token
 * (`PainelAdmin.tsx`), não conteúdo pra indexar. As rotas de API já não têm
 * `page.tsx`/entram no sitemap, mas ficam de fora daqui também por clareza.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/*/admin", "/*/api/"],
    },
    sitemap: "https://controlepopular.com.br/sitemap.xml",
  };
}
