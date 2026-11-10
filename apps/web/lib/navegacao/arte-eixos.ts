/**
 * @file arte-eixos.ts
 * @description Arte de aquarela de cada eixo do portal.
 *
 * Fonte única dos caminhos usados na home (`HeroEixos`) e nas páginas de
 * eixo/subfrente (`ArteEixo`). Os arquivos estão em
 * `public/images/eixos/` (aquarelas de biomas e fauna) e `public/capas/`.
 *
 * COLEÇÃO (08/11/2026): Pantanal, Caatinga, Mata Atlântica, Amazônia e Pampa
 * somam-se às quatro aquarelas originais (Cerrado, Águas, Serras e Arara).
 * Cada um dos 9 eixos usa uma arte DIFERENTE; a coleção de biomas também
 * alimenta a `GaleriaBiomas`. Trocar aqui basta para mudar a arte.
 */

export interface ArteEixo {
  src: string;
  alt: string;
}

export const ARTE_EIXO: Record<string, ArteEixo> = {
  casos: {
    src: "/images/eixos/pantanal-onca-tuiuiu.jpg",
    alt: "Onça-pintada à beira do rio com tuiuiú e vitórias-régias, em aquarela — os desastres que o portal acompanha",
  },
  direitos: {
    src: "/images/eixos/mata-atlantica-mico-leao-bromelias.jpg",
    alt: "Mico-leão-dourado entre bromélias na Mata Atlântica, em aquarela — a vida que os direitos protegem",
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
    src: "/images/eixos/caatinga-tatu-mandacaru.jpg",
    alt: "Tatu-bola e mandacarus floridos na Caatinga, em aquarela — o sertão e sua política",
  },
  economia: {
    src: "/images/eixos/pampa-veado-campeiro-coxilhas.jpg",
    alt: "Veado-campeiro em coxilhas douradas do Pampa, em aquarela — a economia do campo",
  },
  justica: {
    src: "/capas/home-page.webp",
    alt: "Onça-pintada na capa do portal",
  },
  internacional: {
    src: "/images/eixos/amazonia-boto-vitoria-regia.jpg",
    alt: "Boto-cor-de-rosa em igarapé com vitórias-régias, em aquarela — o olhar internacional",
  },
  dados: {
    src: "/images/eixos/nossos-rios-peixes-agua.jpg",
    alt: "Água do rio com peixes, em aquarela — os dados abertos do portal",
  },
  // Página de subfrente (não é eixo): a memória das lutas usa o Cerrado.
  memoria: {
    src: "/images/eixos/terra-e-territorios-ipe-lobo.jpg",
    alt: "Ipê-amarelo e lobo-guará no Cerrado, em aquarela — a memória das lutas",
  },
};

/** Arte do eixo com queda segura para a cachoeira do Cerrado. */
export function arteDoEixo(slug: string): ArteEixo {
  return ARTE_EIXO[slug] ?? ARTE_EIXO["meio-ambiente"];
}
