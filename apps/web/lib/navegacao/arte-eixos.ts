/**
 * @file arte-eixos.ts
 * @description Arte de aquarela de cada eixo do portal.
 *
 * Fonte única dos caminhos usados na home (`HeroEixos`) e nas páginas de
 * eixo/subfrente (`ArteEixo`). Os arquivos estão em
 * `public/images/eixos/` (fauna e Cerrado) e `public/capas/`.
 *
 * Não há imagem gerada nesta entrega: a conta de geração está sem saldo
 * (08/11/2026). Eixo sem arte própria herda a mais próxima; trocar aqui
 * basta quando houver arte nova.
 */

export interface ArteEixo {
  src: string;
  alt: string;
}

export const ARTE_EIXO: Record<string, ArteEixo> = {
  casos: {
    src: "/images/eixos/nossos-rios-peixes-agua.jpg",
    alt: "Água de rio com peixes, em aquarela — os desastres que o portal acompanha",
  },
  direitos: {
    src: "/images/eixos/direitos-em-movimento-arara.jpg",
    alt: "Arara-vermelha sobre rio e floresta, em aquarela",
  },
  "meio-ambiente": {
    src: "/images/eixos/serras-cachoeira-fauna.jpg",
    alt: "Cachoeira com antas e tamanduá no Cerrado, em aquarela",
  },
  cidades: {
    src: "/capas/cities-poco-dantas.webp",
    alt: "Poço Dantas entre casas e serras, em aquarela",
  },
  politica: {
    src: "/capas/reserva-gemini.webp",
    alt: "Lagoa cercada por serras e comunidade, em aquarela",
  },
  economia: {
    src: "/images/eixos/terra-e-territorios-ipe-lobo.jpg",
    alt: "Ipê-amarelo e lobo-guará no Cerrado, em aquarela",
  },
  justica: {
    src: "/capas/home-page.webp",
    alt: "Onça-pintada na capa do portal",
  },
  internacional: {
    src: "/capas/terras-arara.webp",
    alt: "Arara em voo sobre rio e floresta, em aquarela",
  },
  dados: {
    src: "/capas/ambiente-rios.webp",
    alt: "Água do rio com peixes, em aquarela — os dados abertos do portal",
  },
  // Página de subfrente (não é eixo): a memória das lutas usa o ipê com o
  // lobo-guará, a mesma arte de "economia e território".
  memoria: {
    src: "/images/eixos/terra-e-territorios-ipe-lobo.jpg",
    alt: "Ipê-amarelo e lobo-guará no Cerrado, em aquarela — a memória das lutas",
  },
};

/** Arte do eixo com queda segura para a cachoeira do Cerrado. */
export function arteDoEixo(slug: string): ArteEixo {
  return ARTE_EIXO[slug] ?? ARTE_EIXO["meio-ambiente"];
}
