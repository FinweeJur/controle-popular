// GERADO por `scripts/extrair-clipping-ij.mts` a partir de
// `painel-paraopeba.html` (`const CLIPPING_DATA`, a página
// `page-clipping` do painel). Não editar à mão: rode o script de novo
// quando o painel-fonte mudar.
//
// Acervo histórico do painel-fonte — o portal NÃO recalcula, NÃO consulta
// API e NÃO atualiza sozinho. Como em `clipping.ts`, `PERIODO_CLIPPING_IJ`
// existe para toda tela rotular o acervo pelo período real que ele cobre.
// Os `resumo` são de autoria de quem montou o painel-fonte, não do Controle
// Popular, e chegam aqui sem uma vírgula de edição.
//
// ═══ TRÊS ACERVOS DE CLIPPING, TRÊS CURADORIAS ═══
//
// `clipping.ts` guarda o clipping geral, classificado por tipo de veículo.
// `clipping-ati.ts` guarda o das assessorias técnicas independentes. Este
// guarda o que as três instituições de justiça signatárias do Acordo —
// MPMG, MPF e DPMG — publicaram sobre a reparação, classificado por eixo.
//
// São curadorias distintas, medido: dos 59 itens daqui,
// 1 repete uma URL dos 149 de `clipping.ts`
// e nenhum repete URL dos 46 de `clipping-ati.ts`;
// nenhum título se repete em nenhum dos dois.
// Por isso os três arrays convivem sem deduplicação — juntá-los apagaria a
// classificação temática que só existe aqui.
//
// A cobertura também é outra: este acervo começa em 2019-04-05 e o
// clipping geral só em 2024-04-08, 5 anos depois. É aqui, e só aqui, que
// o portal alcança a assinatura do Acordo de R$ 37,6 bi, em fevereiro de 2021.
//
// ═══ O CAMPO `grupo`, QUE NENHUM OUTRO ACERVO DO PORTAL TEM ═══
//
// 36 dos 59 itens trazem `grupo`: é o mesmo FATO noticiado pelas três
// instituições em paralelo (a assinatura do Acordo, uma decisão do STJ), e o
// painel-fonte marcou isso à mão. São 13 fatos distintos. Sem esse campo,
// a mesma decisão vira três notícias soltas e o acervo parece maior do que é.
//
// Ressalva de fidelidade: o painel-fonte AINDA agrupava, na hora de
// desenhar, itens sem `grupo` que compartilhassem a mesma URL. Isso é
// decisão de tela, não dado — só o `grupo` explícito atravessou para cá.

/** Instituição de justiça signatária do Acordo que publicou o material. */
export type SiglaInstituicaoJustica = "mpmg" | "mpf" | "dpmg";

export const INSTITUICAO_JUSTICA_LABEL: Record<SiglaInstituicaoJustica, string> = {
  mpmg: "MPMG",
  mpf: "MPF",
  dpmg: "DPMG",
};

/** Nome por extenso, como o painel-fonte escreve no cabeçalho de cada item. */
export const INSTITUICAO_JUSTICA_NOME: Record<SiglaInstituicaoJustica, string> = {
  mpmg: "Ministério Público de Minas Gerais",
  mpf: "Ministério Público Federal",
  dpmg: "Defensoria Pública do Estado de Minas Gerais",
};

/** Eixo temático da reparação, como o painel-fonte classificou. */
export type TemaClippingIj = "acao_penal" | "indenizacao" | "acordo" | "consulta_popular" | "ptr_auxilio";

export const TEMA_CLIPPING_IJ_LABEL: Record<TemaClippingIj, string> = {
  acao_penal: "Ação Penal",
  indenizacao: "Indenização",
  acordo: "Acordo / Reparação",
  consulta_popular: "Consulta Popular",
  ptr_auxilio: "PTR / Auxílio",
};

/** Ordem de exibição por tema — a mesma que o painel-fonte usava. */
export const TEMA_CLIPPING_IJ_ORDEM: TemaClippingIj[] = ["acao_penal", "indenizacao", "acordo", "consulta_popular", "ptr_auxilio"];

export interface NoticiaInstituicaoJustica {
  id: string;
  /** Qual das três instituições de justiça publicou. */
  instituicao: SiglaInstituicaoJustica;
  /** Eixo temático da reparação sob o qual o painel-fonte classificou. */
  tema: TemaClippingIj;
  titulo: string;
  /** Resumo escrito por quem montou o painel-fonte, não pelo Controle Popular. */
  resumo: string;
  data: string;
  /** Veículo que publicou — nem sempre igual ao rótulo da instituição. */
  fonte: string;
  url: string;
  /** Mesmo fato noticiado por mais de uma instituição, quando o painel marcou. */
  grupo?: string;
}

/** Cobertura real do acervo — usar para rotular a tela, nunca "notícias de hoje". */
export const PERIODO_CLIPPING_IJ = {
  de: "2019-04-05",
  ate: "2026-05-05",
} as const;

/**
 * Contagens do acervo, para páginas SERVIDOR que só mostram números. O array
 * `CLIPPING_IJ` fica reservado aos componentes de CLIENTE; paridade travada
 * por teste em `dados.test.ts` (ver `COBERTURA_CLIPPING` em `clipping.ts`).
 */
export const COBERTURA_CLIPPING_IJ = {
  total: 59,
} as const;

