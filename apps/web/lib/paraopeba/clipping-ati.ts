// GERADO por `scripts/extrair-clipping-ati.mts` a partir de
// `painel-paraopeba (V1).html` (`const ATI_DATA`, a página `page-clipati`).
// Não editar à mão: rode o script de novo quando o painel-fonte mudar.
//
// Acervo histórico do painel-fonte — o portal NÃO recalcula, NÃO consulta
// API e NÃO atualiza sozinho. Como em `clipping.ts`, `PERIODO_CLIPPING_ATI`
// existe para toda tela rotular o acervo pelo período real que ele cobre.
//
// ═══ O QUE ESTE ARQUIVO TEM QUE `clipping.ts` NÃO TEM ═══
//
// `clipping.ts` guarda o clipping geral, classificado por tipo de veículo
// (imprensa, institucional, movimento, assessoria). Este guarda a curadoria
// separada que o painel mantinha na página das ATIs, com duas chaves que o
// outro acervo não tem: **qual ATI produziu** (`ati`) e **sob qual tema da
// reparação** (`tema`). São curadorias distintas, medido: dos 46 itens
// daqui, 2 apontam para uma URL que também aparece nos 149 de
// `clipping.ts`, e nenhum título se repete. Por isso os dois arrays convivem
// sem deduplicação — juntá-los apagaria a classificação temática.
//
// As três ATIs foram eleitas pelas comunidades atingidas e dividem as cinco
// regiões do processo: AEDAS (Regiões 1 e 2), NACAB (Região 3) e Instituto
// Guaicuy (Regiões 4 e 5).

/** Sigla da Assessoria Técnica Independente que produziu o material. */
export type SiglaAti = "aedas" | "nacab" | "guaicuy";

export const ATI_LABEL: Record<SiglaAti, string> = {
  aedas: "AEDAS",
  nacab: "NACAB",
  guaicuy: "Guaicuy",
};

/** Região do processo em que cada ATI atua — do cabeçalho do painel-fonte. */
export const ATI_REGIOES: Record<SiglaAti, string> = {
  aedas: "Regiões 1 e 2",
  nacab: "Região 3",
  guaicuy: "Regiões 4 e 5",
};

/** Eixo temático da reparação, como o painel-fonte classificou. */
export type TemaAti = "pericias" | "ershre" | "ambiental" | "indenizacao" | "participacao" | "ati";

export const TEMA_ATI_LABEL: Record<TemaAti, string> = {
  pericias: "Perícias Judiciais",
  ershre: "Risco à Saúde (ERSHRE)",
  ambiental: "Reparação Ambiental",
  indenizacao: "Indenização Individual",
  participacao: "Participação Popular",
  ati: "Direito à ATI",
};

/** Ordem de exibição por tema — a mesma que o painel-fonte usava. */
export const TEMA_ATI_ORDEM: TemaAti[] = ["pericias", "ershre", "ambiental", "indenizacao", "participacao", "ati"];

export interface NoticiaAti {
  id: string;
  /** Qual das três ATIs produziu o material. */
  ati: SiglaAti;
  /** Eixo temático da reparação sob o qual o painel-fonte classificou. */
  tema: TemaAti;
  titulo: string;
  /** Resumo escrito por quem montou o painel-fonte, não pelo Controle Popular. */
  resumo: string;
  data: string;
  /** Veículo/organização que publicou — nem sempre igual ao rótulo da ATI. */
  fonte: string;
  url: string;
  tags: string[];
}

/** Cobertura real do acervo — usar para rotular a tela, nunca "notícias de hoje". */
export const PERIODO_CLIPPING_ATI = {
  de: "2021-02-05",
  ate: "2026-02-13",
} as const;

/**
 * Contagens do acervo, para páginas SERVIDOR que só mostram números. O array
 * `CLIPPING_ATI` fica reservado aos componentes de CLIENTE; paridade travada
 * por teste em `dados.test.ts` (ver `COBERTURA_CLIPPING` em `clipping.ts`).
 */
export const COBERTURA_CLIPPING_ATI = {
  total: 46,
} as const;

