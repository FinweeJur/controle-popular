/**
 * O acervo público da perícia judicial da UFMG sobre o rompimento da Barragem
 * I (Brumadinho, 25/01/2019), já tipado e com tema atribuído.
 *
 * NÃO É O MESMO ACERVO QUE `documentos.ts`
 *
 * São duas fontes da UFMG e o portal usa as duas:
 *   · `documentos.ts` — peças do PROCESSO judicial, vindas do Solr da
 *     *Plataforma* (`plataforma.projetobrumadinho.ufmg.br`).
 *   · este — os RESULTADOS TÉCNICOS produzidos pelos pesquisadores, do site
 *     do projeto (`projetobrumadinho.ufmg.br`).
 */

export type { DocumentoPericiaUfmg, SecaoPericia } from "./temas-acervo";
export { SECAO_PERICIA_LABEL, SECAO_PERICIA_ORDEM } from "./pericia-rotulos";
import type { EstudoPericiaComTema } from "./pericia-rotulos";
export type { EstudoPericiaComTema };
