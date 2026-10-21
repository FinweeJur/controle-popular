/**
 * Tipos da jurimetria do TJMG para o RAG do Controle Popular.
 *
 * Fonte oficial: acórdãos e ementas publicados pelo TJMG; a normalização
 * nasce no repositório `tjmg-jurimetria` e chega aqui como JSON já validado.
 * O portal não lê PDF nem CSV cru: lê o contrato `acervo-jurimetria.json`.
 *
 * Decisões técnicas:
 * - `resultado` e `nexo` usam `nao_classificado` em vez de inventar valor
 *   para `pendente`; a ausência é informação, não categoria.
 * - `normas` e `danos` são ids canônicos; `normasBrutas` preserva o texto
 *   original para auditoria e não alimenta facetas.
 * - `ementa` é o texto oficial, sem reescrita por LLM.
 */

export type TribunalJurimetria = "TJMG";

export type ResultadoJurimetria =
  | "favoravel"
  | "desfavoravel"
  | "parcial"
  | "indeterminado"
  | "nao_classificado";

export type NexoJurimetria =
  | "afirmado"
  | "negado"
  | "misto"
  | "nao_abordado"
  | "nao_classificado";

export type ConfiancaJurimetria = "alta" | "media" | "baixa";
export type FonteJurimetria = "pdf" | "ementa";

export interface DecisaoJurimetria {
  /** Id estável, derivado de acórdão + processo + data + classe. */
  id: string;
  tribunal: TribunalJurimetria;
  /** Temas canônicos usados pelo mapa e pelos filtros. */
  temas: string[];
  /** Slugs originais do coletor, preservados para auditoria. */
  temasFonte: string[];
  processo: string;
  numeroAcordao: string | null;
  classe: string;
  relator: string;
  dataJulgamento: string | null;
  dataPublicacao: string | null;
  comarca: string | null;
  resultado: ResultadoJurimetria;
  nexo: NexoJurimetria;
  /** Ids canônicos de `NORMAS`. */
  normas: string[];
  /** Texto original do campo `normas`, sem virar faceta. */
  normasBrutas: string[];
  /** Ids canônicos de `DANOS`. */
  danos: string[];
  valorIndenizacao: number | null;
  fonte: FonteJurimetria;
  confianca: ConfiancaJurimetria;
  ementa: string;
  urlEspelho: string | null;
  arquivoTxt: string | null;
}

export interface TemaConfig {
  slug: string;
  label: string;
  descricao: string;
  /** Slugs antigos ou plurais que apontam para este tema. */
  aliases: string[];
  palavrasChave: string[];
  sinonimos: string[];
  normas: string[];
  danos: string[];
  relacionados: string[];
}

export interface NormaConfig {
  id: string;
  label: string;
  /** Termos normalizados que identificam a norma no texto bruto. */
  termos: string[];
}

export interface DanoConfig {
  id: string;
  label: string;
  /** Termos normalizados que identificam o dano no texto bruto. */
  termos: string[];
}

export interface FonteMapa {
  repositorio: string;
  commit: string | null;
  arquivos: string[];
}

export interface EntradaMapa {
  geradoEm: string;
  fonte: FonteMapa;
}

export interface TemaMapa extends TemaConfig {
  decisoes: number;
  rota: string;
  casosGuia: string[];
}

export interface FacetaMapa {
  slug: string;
  label: string;
  contagem: number;
  rota?: string;
}

export interface CoberturaMapa {
  total: number;
  comInteiroTeor: number;
  semFonte: number;
  porResultado: Record<ResultadoJurimetria, number>;
  porConfianca: Record<ConfiancaJurimetria, number>;
}

export interface MapaJurimetria {
  geradoEm: string;
  fonte: FonteMapa;
  cobertura: CoberturaMapa;
  temas: TemaMapa[];
  normas: FacetaMapa[];
  danos: FacetaMapa[];
  comarcas: FacetaMapa[];
  resultados: FacetaMapa[];
  anos: FacetaMapa[];
}

export interface ConsultaJurimetria {
  texto?: string;
  tema?: string;
  norma?: string;
  dano?: string;
  comarca?: string;
  resultado?: ResultadoJurimetria;
  ano?: number;
  limite?: number;
}

export interface ResultadoConsulta {
  decisao: DecisaoJurimetria;
  score: number;
  motivos: string[];
}

export interface IndiceJurimetria {
  decisoes: readonly DecisaoJurimetria[];
  porId: ReadonlyMap<string, DecisaoJurimetria>;
  porTema: ReadonlyMap<string, readonly string[]>;
  porNorma: ReadonlyMap<string, readonly string[]>;
  porDano: ReadonlyMap<string, readonly string[]>;
  porComarca: ReadonlyMap<string, readonly string[]>;
  porResultado: ReadonlyMap<string, readonly string[]>;
  porAno: ReadonlyMap<string, readonly string[]>;
  porTermo: ReadonlyMap<string, readonly string[]>;
  idf: ReadonlyMap<string, number>;
}
