/**
 * @file apps/web/lib/universidades/tipos.ts
 * @description Modelo de dado do índice de pesquisa e extensão universitária.
 *
 * Papel no portal: alimenta a zona `/universidades`, um índice curado de
 * grupos de pesquisa e projetos de extensão das instituições brasileiras —
 * no estilo do guia da UFVJM, com cartão e link oficial em cada item.
 *
 * De onde vem este dado:
 * - Grupos de pesquisa: relatório oficial da PRPPG/UFVJM extraído do
 *   Diretório dos Grupos de Pesquisa do CNPq (DGP). O DGP bloqueia acesso
 *   automatizado; por isso a coleta é curada, instituição por instituição,
 *   com o relatório oficial baixado e lido à mão.
 * - Extensão: não existe cadastro nacional único. Cada instituição publica
 *   na própria plataforma (a UFVJM usa o SIEXC). Só entra projeto com página
 *   pública específica verificada.
 *
 * Régua (QUALIDADES-DA-INFORMACAO.md):
 * 1. todo registro carrega `fonteUrl` específica e `dataAcesso`;
 * 2. o número exibido no topo é calculado do dado (`resumirUniversidades`),
 *    nunca digitado à mão;
 * 3. a data de verificação viaja colada ao registro.
 *
 * O que este modelo NÃO faz: não mede produtividade, mérito nem ranking.
 * É catálogo com procedência. A ordem é a da fonte, não um pódio.
 */

/** Natureza administrativa da instituição. */
export type TipoInstituicao =
  | "federal"
  | "estadual"
  | "instituto-federal"
  | "cefet"
  | "comunitaria"
  | "privada";

/** Tipo de registro do acervo. */
export type TipoRegistro = "pesquisa" | "extensao";

/** Instituição de ensino e pesquisa coberta pelo índice. */
export interface Instituicao {
  /** Sigla única no acervo (ex.: "UFVJM"). É a chave de rota. */
  sigla: string;
  nome: string;
  tipo: TipoInstituicao;
  /** Unidade federativa da sede administrativa. */
  uf: string;
  /** Campus/municípios onde a instituição atua. */
  municipios: string[];
  /** Site oficial da instituição. */
  site: string;
  /**
   * Portais oficiais úteis (pesquisa, extensão, pós-graduação, dados abertos).
   * Cada link foi aberto e conferido na coleta.
   */
  links: { rotulo: string; url: string }[];
  /** Página ou documento que prova a existência e o recorte da instituição. */
  fonteUrl: string;
  /** Data (AAAA-MM-DD) em que os links foram conferidos. */
  dataAcesso: string;
}

/** Unidade acadêmica (faculdade, instituto, escola) de uma instituição. */
export interface Unidade {
  /** Sigla da instituição dona da unidade. */
  instituicao: string;
  sigla: string;
  nome: string;
  /** Campus a que a unidade pertence, quando a fonte informa. */
  campus?: string;
  /** Site próprio da unidade, quando existe e foi conferido. */
  site?: string;
}

/** Grupo de pesquisa cadastrado no DGP/CNPq, lido do relatório oficial. */
export interface GrupoPesquisa {
  /** Sigla da instituição dona do grupo. */
  instituicao: string;
  nome: string;
  /** Sigla curta do grupo, quando o próprio nome a traz. */
  sigla?: string;
  /** Área predominante declarada na fonte (ex.: "Agronomia"). */
  area: string;
  /** Líder do grupo, como publicado na fonte oficial. */
  lider: string;
  /** Ano de referência do relatório oficial de onde o grupo foi lido. */
  anoReferencia: number;
  fonteUrl: string;
  dataAcesso: string;
  /**
   * Observação fiel à fonte — por exemplo, nome truncado pelo próprio
   * relatório. Nunca é opinião sobre o grupo.
   */
  fonteNota?: string;
}

/** Projeto de extensão com página pública específica verificada. */
export interface ProjetoExtensao {
  instituicao: string;
  nome: string;
  area?: string;
  /** Página pública específica do projeto na plataforma da instituição. */
  url: string;
  /** Nome da plataforma (ex.: "SIEXC"). */
  plataforma: string;
  fonteUrl: string;
  dataAcesso: string;
}
