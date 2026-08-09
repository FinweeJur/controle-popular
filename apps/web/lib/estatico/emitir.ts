import { fatiar, type IndiceFatiado, type ManifestoFatias } from "./fatiar";

/**
 * Converte linhas num conjunto de arquivos prontos para gravar — a peça que
 * faltava entre `fatiar()` e `TabelaEstatica`.
 *
 * ═══ POR QUE ISTO EXISTIA COMO BURACO ═══
 *
 * `fatiar()` corta em fatias e `TabelaEstatica` lê `manifesto.json` +
 * `<n>.json`. As duas pontas estavam prontas e **nenhuma das duas escrevia
 * arquivo**: medido em 2026-08-09, `fatiar()` só era chamado no próprio teste e
 * `grep -rn TabelaEstatica` só achava a definição. Sem este módulo, as sete
 * páginas pesadas do §3 não tinham como existir.
 *
 * ═══ POR QUE DEVOLVE ARQUIVOS EM VEZ DE GRAVAR ═══
 *
 * Gravar é efeito colateral e exigiria `fs`, o que empurraria este código para
 * `scripts/` — e `vitest.config.ts` só coleta testes em `lib/**`. Devolvendo a
 * lista, a parte que decide NOMES e CONTEÚDO fica testável, e ao script sobra
 * só o laço de escrita. É a mesma divisão que o resto do projeto usa entre
 * consulta e apresentação.
 */

export interface ArquivoIndice {
  /** Nome relativo à base, incluindo extensão. */
  nome: string;
  conteudo: string;
}

/**
 * O manifesto vai num arquivo separado das fatias de propósito: o cliente
 * precisa saber QUANTAS fatias existem antes de baixar a primeira, senão teria
 * de descobrir por tentativa e erro (pedir `3.json` e tratar 404 como fim) —
 * e 404 tratado como fluxo normal esconde erro de verdade.
 */
export const NOME_MANIFESTO = "manifesto.json";

export function arquivosDoIndice<T>(
  linhas: T[],
  { orcamentoBytes }: { orcamentoBytes?: number } = {}
): ArquivoIndice[] {
  const indice: IndiceFatiado<T> = fatiar(linhas, { orcamentoBytes });
  return [
    { nome: NOME_MANIFESTO, conteudo: JSON.stringify(indice.manifesto) },
    ...indice.fatias.map((fatia, i) => ({
      nome: `${i}.json`,
      conteudo: JSON.stringify(fatia),
    })),
  ];
}

/**
 * Índice vazio — e ele PRECISA existir como arquivo.
 *
 * A tentação é não gravar nada quando a tabela está vazia. Aí o cliente pede
 * `manifesto.json`, leva 404, e mostra "erro ao carregar" para uma tabela que
 * simplesmente não tem linha. São coisas diferentes, e o leitor de um portal de
 * transparência precisa distinguir "não há contrato" de "não consegui buscar".
 *
 * Hoje isto não é hipótese: `votacoes_camara` e `congresso.votacoes` estão com
 * zero linha neste banco.
 */
export function arquivosDeIndiceVazio(): ArquivoIndice[] {
  const manifesto: ManifestoFatias = {
    total: 0,
    fatias: 0,
    linhasPorFatia: [],
    bytesPorFatia: [],
    orcamentoBytes: 0,
    avisos: [],
  };
  return [{ nome: NOME_MANIFESTO, conteudo: JSON.stringify(manifesto) }];
}
