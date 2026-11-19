/**
 * @file Leitura honesta da ementa: texto inteiro ou trecho.
 *
 * POR QUE ESTE MÓDULO EXISTE
 *
 * A ementa publicada em `/jurisprudencia` vem da fonte oficial já recortada.
 * Medido em 10/11/2026 sobre os 23.569 casos do acervo:
 *
 * - 4.970 casos têm ementa de 499/500 caracteres terminando em "…" — o
 *   tribunal entregou só o começo do texto. O exemplo que abriu o chamado é
 *   o processo 0032284-30.2018.8.13 (TJMG), de 500 caracteres, terminando em
 *   "I. CASO EM EXAME 1. Apelação cível prin…";
 * - 7 casos batem no teto de 12.000 caracteres do gerador do portal e param
 *   no meio de uma palavra, sem reticências;
 * - os demais trazem a ementa completa.
 *
 * O componente só marcava corte quando `ementa.length >= 12000`. Os 4.970
 * trechos de 500 caracteres passavam como "Ementa:" inteira e o leitor saía
 * com a impressão de que o acórdão terminava ali.
 *
 * COMO O CORTE É RECONHECIDO
 *
 * 1. `…` ou `...` no FIM do texto: é o recorte da fonte ou do gerador.
 *    Reticências no MEIO da frase não contam — o teste é ancorado no fim.
 * 2. Texto entre 480 e 520 caracteres SEM pontuação final: é o limite de
 *    ~500 da fonte, mesmo quando o coletor não acrescentou reticências.
 *    A faixa é larga de propósito: a fonte corta em 499 ou 500 caracteres
 *    conforme o encoding, e 480 pega o corte ligeiramente menor.
 * 3. 12.000 caracteres ou mais: é o teto do gerador do portal, que corta
 *    até no meio da palavra.
 *
 * O que NÃO é corte: uma ementa completa de 500 caracteres terminada em
 * ponto (há 5 no acervo). Por isso a regra 2 exige a ausência de pontuação
 * final, em vez de olhar só o tamanho.
 */

export type MotivoTruncamento = "reticencias" | "limite-fonte" | "limite-gerador";

export interface AnaliseEmenta {
  /** Texto sem espaços nas pontas — é o que a tela renderiza. */
  texto: string;
  truncada: boolean;
  caracteres: number;
  motivo: MotivoTruncamento | null;
}

/** Faixa do recorte de ~500 caracteres feito pela fonte oficial. */
export const LIMITE_FONTE_MIN = 480;
export const LIMITE_FONTE_MAX = 520;
/** Teto do gerador do portal: acima dele o texto foi cortado pelo build. */
export const LIMITE_GERADOR = 12000;

/**
 * Reticências no fim, tolerando aspas, parênteses e colchetes de fechamento.
 * `…` (U+2026) e `...` (três pontos) contam; `....` também, pela mesma regra.
 */
const RETICENCIAS_NO_FIM = /(?:…|\.\.\.)["'”’»)\]]*$/;

/**
 * Fim de texto "fechado": pontuação de frase ou delimitador de fechamento.
 * O parêntese conta porque as súmulas do TST terminam em "(ex-OJ nº …)";
 * sem isso, quatro súmulas completas de ~500 caracteres virariam "trecho".
 */
const FIM_DE_FRASE = /(?:[.!?…:;]["'”’»)\]]*|["'”’»)\]])$/;

const SEM_CORTE = (texto: string): AnaliseEmenta => ({
  texto,
  truncada: false,
  caracteres: texto.length,
  motivo: null,
});

export function analisarEmenta(ementa: string | null | undefined): AnaliseEmenta {
  const texto = (ementa ?? "").trim();
  if (!texto) return SEM_CORTE(texto);

  if (texto.length >= LIMITE_GERADOR) {
    return { texto, truncada: true, caracteres: texto.length, motivo: "limite-gerador" };
  }

  if (RETICENCIAS_NO_FIM.test(texto)) {
    return { texto, truncada: true, caracteres: texto.length, motivo: "reticencias" };
  }

  const naFaixaDaFonte =
    texto.length >= LIMITE_FONTE_MIN && texto.length <= LIMITE_FONTE_MAX;
  if (naFaixaDaFonte && !FIM_DE_FRASE.test(texto)) {
    return { texto, truncada: true, caracteres: texto.length, motivo: "limite-fonte" };
  }

  return SEM_CORTE(texto);
}
