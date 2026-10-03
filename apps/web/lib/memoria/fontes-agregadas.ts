/**
 * Catálogo e agregação das fontes da memória popular.
 *
 * Papel no portal: a página `/memoria` citava, antes, uma fonte por verbete
 * — dezenas de rótulos, muitos "Wikipédia, <artigo> (1)". O dono pediu
 * (03/10/2026) a lista AGREGADA e reduzida a cinco rótulos de fonte, com a
 * contagem somada por rótulo:
 *
 *   MST — Calendário Histórico das Trabalhadoras/es (MST);
 *   MAB — Movimento dos Atingidos por Barragens;
 *   APIB — Articulação dos Povos Indígenas do Brasil;
 *   Aos que Virão (Blog);
 *   Wikipédia (todos os artigos somados em um só total).
 *
 * O NÚMERO NÃO É DIGITADO: sai da contagem real dos verbetes em
 * `agregarFontes()` (regra do AGENTS §8 — número na tela vem do dado).
 *
 * Decisão técnica: a classificação é por TEXTO da citação curta
 * (`fonteCurta`), sem campo novo no dado. Assim a curadoria continua a
 * fonte única da verdade e nenhum gerador precisa ser reexecutado.
 * Fonte terciária (Wikipédia/Wikidata) é reconhecida SEMPRE primeiro,
 * mesmo quando o verbete cita a APIB, para que o rótulo não troque a
 * ponte pela fonte (regra editorial, AGENTS §7).
 */

/** Os cinco rótulos reduzidos da lista de fontes. */
export type RotuloFonte = "MST" | "MAB" | "APIB" | "Aos que Virão" | "Wikipédia";

/** Definição de um rótulo de fonte: como a tela o nomeia e o linka. */
export interface DefinicaoFonte {
  /** Rótulo curto (o que aparece na lista agregada). */
  rotulo: RotuloFonte;
  /** Descrição por extenso, como o dono pediu. */
  descricao: string;
  /** Obra/coletânea de onde os fatos vêm (para o `title`/tooltip). */
  obra: string;
  /** Link institucional ou da fonte oficial. */
  url: string;
}

/**
 * O catálogo, na ordem em que o dono pediu a exibição:
 * MST · MAB · APIB · Aos que Virão · Wikipédia.
 */
export const FONTES_CATALOGO: readonly DefinicaoFonte[] = [
  {
    rotulo: "MST",
    descricao: "MST — Calendário Histórico das Trabalhadoras/es",
    obra: "Calendário Histórico dos Trabalhadores e Trabalhadoras (MST, 2009)",
    url: "https://mst.org.br/",
  },
  {
    rotulo: "MAB",
    descricao: "MAB — Movimento dos Atingidos por Barragens",
    obra: "Linha do tempo do MAB",
    url: "https://mab.org.br/linha-do-tempo/",
  },
  {
    rotulo: "APIB",
    descricao: "APIB — Articulação dos Povos Indígenas do Brasil",
    obra: "Histórico do Acampamento Terra Livre (ATL)",
    url: "https://apiboficial.org/historicoatl/",
  },
  {
    rotulo: "Aos que Virão",
    descricao: "Aos que Virão (Blog)",
    obra: "Calendário Insurgente, Blog Aos que Virão (2020)",
    url: "https://aosquevirao.home.blog/category/calendario-insurgente/",
  },
  {
    rotulo: "Wikipédia",
    descricao: "Wikipédia",
    obra: "Wikipédia, a enciclopédia livre (fonte terciária)",
    url: "https://pt.wikipedia.org/",
  },
];

/**
 * Classifica a citação curta de um verbete em um dos cinco rótulos.
 *
 * A ordem das checagens é deliberada:
 *  1. Wikipédia/Wikidata primeiro — é fonte terciária e não pode ser
 *     trocada pela fonte que o verbete eventualmente cita;
 *  2. MAB antes de MST, porque a citação do MAB também contém "MAB";
 *  3. APIB;
 *  4. Blog Aos que Virão (Calendário Insurgente);
 *  5. qualquer outra — o default é o Calendário do MST, que é a maior
 *     base e o único formato restante.
 */
export function rotuloDaFonte(fonteCurta: string): RotuloFonte {
  const f = fonteCurta ?? "";
  if (/wikip|wikidata/i.test(f)) return "Wikipédia";
  if (/MAB|Atingidos por Barragens/i.test(f)) return "MAB";
  if (/APIB|Povos Indígenas do Brasil/i.test(f)) return "APIB";
  if (/insurgente|Aos que Virão/i.test(f)) return "Aos que Virão";
  return "MST";
}

/** Uma linha da lista agregada: o rótulo e quantos verbetes ele sustenta. */
export interface FonteAgregada {
  definicao: DefinicaoFonte;
  total: number;
}

/**
 * Conta os verbetes por rótulo e devolve a lista na ordem do catálogo.
 * Rótulo sem nenhum verbete aparece com `total: 0` — a lacuna é
 * informação (AGENTS §7), nunca escondida.
 */
export function agregarFontes(fontesCurtas: Iterable<string>): FonteAgregada[] {
  const contagem = new Map<RotuloFonte, number>();
  for (const curta of fontesCurtas) {
    const rotulo = rotuloDaFonte(curta);
    contagem.set(rotulo, (contagem.get(rotulo) ?? 0) + 1);
  }
  return FONTES_CATALOGO.map((definicao) => ({
    definicao,
    total: contagem.get(definicao.rotulo) ?? 0,
  }));
}
