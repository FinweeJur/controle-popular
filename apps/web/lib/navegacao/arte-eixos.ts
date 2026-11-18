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
 *
 * DUAS MEDIDAS (18/11/2026): a home mostra a arte em cartão de 345 px e os
 * originais tinham 1376 px e ~240 KB. Com `loading="lazy"`, quem rolava até a
 * seção via o cartão sem arte enquanto o arquivo chegava — e os eixos 5, 6, 8
 * e 9 saíam vazios na captura de tela do dono. Agora `srcHero` aponta para a
 * miniatura de 720 px em `public/images/eixos/hero/` (66% menor), gerada por
 * `scripts/otimizar-artes-eixos.py`; o original segue nas faixas largas.
 */

export interface ArteEixo {
  /** Arquivo grande, para faixas de página inteira (`ArteEixo`). */
  src: string;
  /** Miniatura de 720 px, para o cartão da home. Cai para `src` se faltar. */
  srcHero?: string;
  alt: string;
}

const HERO = "/images/eixos/hero";

export const ARTE_EIXO: Record<string, ArteEixo> = {
  casos: {
    src: "/images/eixos/pantanal-onca-tuiuiu.jpg",
    srcHero: `${HERO}/pantanal-onca-tuiuiu.jpg`,
    alt: "Onça-pintada à beira do rio com tuiuiú e vitórias-régias, em aquarela — os desastres que o portal acompanha",
  },
  direitos: {
    src: "/images/eixos/mata-atlantica-mico-leao-bromelias.jpg",
    srcHero: `${HERO}/mata-atlantica-mico-leao-bromelias.jpg`,
    alt: "Mico-leão-dourado entre bromélias na Mata Atlântica, em aquarela — a vida que os direitos protegem",
  },
  "meio-ambiente": {
    src: "/images/eixos/serras-cachoeira-fauna.jpg",
    srcHero: `${HERO}/serras-cachoeira-fauna.jpg`,
    alt: "Cachoeira com antas e tamanduá no Cerrado, em aquarela",
  },
  cidades: {
    src: "/capas/cities-poco-dantas.webp",
    srcHero: `${HERO}/cities-poco-dantas.webp`,
    alt: "Poço Dantas entre casas e serras, em aquarela",
  },
  politica: {
    src: "/images/eixos/caatinga-tatu-mandacaru.jpg",
    srcHero: `${HERO}/caatinga-tatu-mandacaru.jpg`,
    alt: "Tatu-bola e mandacarus floridos na Caatinga, em aquarela — o sertão e sua política",
  },
  economia: {
    src: "/images/eixos/pampa-veado-campeiro-coxilhas.jpg",
    srcHero: `${HERO}/pampa-veado-campeiro-coxilhas.jpg`,
    alt: "Veado-campeiro em coxilhas douradas do Pampa, em aquarela — a economia do campo",
  },
  justica: {
    src: "/capas/home-page.webp",
    srcHero: `${HERO}/home-page.webp`,
    alt: "Onça-pintada na capa do portal",
  },
  internacional: {
    src: "/images/eixos/amazonia-boto-vitoria-regia.jpg",
    srcHero: `${HERO}/amazonia-boto-vitoria-regia.jpg`,
    alt: "Boto-cor-de-rosa em igarapé com vitórias-régias, em aquarela — o olhar internacional",
  },
  dados: {
    src: "/images/eixos/nossos-rios-peixes-agua.jpg",
    srcHero: `${HERO}/nossos-rios-peixes-agua.jpg`,
    alt: "Água do rio com peixes, em aquarela — os dados abertos do portal",
  },
  // Página de subfrente (não é eixo): a memória das lutas usa o Cerrado.
  memoria: {
    src: "/images/eixos/terra-e-territorios-ipe-lobo.jpg",
    srcHero: `${HERO}/terra-e-territorios-ipe-lobo.jpg`,
    alt: "Ipê-amarelo e lobo-guará no Cerrado, em aquarela — a memória das lutas",
  },
};

/** Arte do eixo com queda segura para a cachoeira do Cerrado. */
export function arteDoEixo(slug: string): ArteEixo {
  return ARTE_EIXO[slug] ?? ARTE_EIXO["meio-ambiente"];
}

/** Miniatura usada no cartão da home; herda o original quando não há. */
export function arteDoHeroEixo(eixo: ArteEixo): string {
  return eixo.srcHero ?? eixo.src;
}
