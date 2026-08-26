import dadosPericia from "../../../../etl/betim/dados/pericia-ufmg.json";
import {
  temasDoDocumentoPericia,
  type DocumentoPericiaUfmg,
  type SecaoPericia,
} from "./temas-acervo";
import type { TemaAjri } from "./auditoria-ajri";

/**
 * O acervo público da perícia judicial da UFMG sobre o rompimento da Barragem
 * I (Brumadinho, 25/01/2019), já tipado e com tema atribuído.
 *
 * �.��.��.� N�fO �? O MESMO ACERVO QUE `documentos.ts` �.��.��.�
 *
 * São duas fontes da UFMG e o portal usa as duas:
 *   · `documentos.ts` �?" peças do PROCESSO judicial, vindas do Solr da
 *     *Plataforma* (`plataforma.projetobrumadinho.ufmg.br`).
 *   · este �?" os RESULTADOS T�?CNICOS produzidos pelos pesquisadores, do site
 *     do projeto (`projetobrumadinho.ufmg.br`).
 * Página que trata os dois como um só desinforma: uma petição não é laudo.
 *
 * �.��.��.� 445 ARQUIVOS, 7 DE SUBST�,NCIA �.��.��.�
 *
 * A varredura foi completa (555 páginas, fila zerada �?" não é amostra). Mas o
 * acervo é quase todo apparato administrativo: 101 editais de chamada, 262
 * papéis por chamada, ~34 listas de equipe, 8 perfis de divulgação. Os
 * documentos que trazem RESULTADO são os 7 do `node/582`, publicados em
 * nov/2025.
 *
 * Esse número desconfortável fica exposto em `RESUMO_DO_ACERVO` e a página
 * tem de dizê-lo ao visitante. Um acervo de 445 itens que insinua 445 laudos
 * mente por omissão.
 */

export type { DocumentoPericiaUfmg, SecaoPericia } from "./temas-acervo";
export { SECAO_PERICIA_LABEL, SECAO_PERICIA_ORDEM } from "./pericia-rotulos";
import type { EstudoPericiaComTema } from "./pericia-rotulos";
export type { EstudoPericiaComTema };

interface LinhaBruta {
  url: string;
  nome_arquivo: string;
  secao: string;
  citado_em: string[];
  ano_mes_do_caminho: string | null;
}

const BRUTO = dadosPericia as unknown as {
  coletado_em: string;
  fonte: string;
  paginas_visitadas: number;
  paginas_na_fila_ao_parar: number;
  total: number;
  por_secao: Record<string, number>;
  documentos: LinhaBruta[];
};

/** O acervo inteiro, tipado. A página lista tudo; a ponte usa só o que tem tema. */
/**
 * Os números que a página precisa dizer em voz alta. Vêm do dataset, não de
 * texto escrito à mão que envelhece sem ninguém notar.
 */



/**
 * ACERVO_PERICIA/ESTUDOS_PERICIA_COM_TEMA/RESULTADOS_PERICIA/RESUMO_DO_ACERVO
 * saíram daqui em 2026-08-25 (teto de 3 MiB gzip do Worker, erro 10027):
 * o JSON bruto agora é lido em build por pericia-ufmg-dados.ts (server-only)
 * e servido como asset public/data/estudos-pericia.json para o cliente.
 */
