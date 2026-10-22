/**
 * Contrato do RAG documental da biblioteca do Controle Popular.
 *
 * Hoje o Seu Nonô responde com cartões curados. Este módulo é a outra perna:
 * texto extraído de PDF público, fatiado por página, com link oficial e
 * número da página para a resposta citar a fonte.
 *
 * Fonte: bibliotecas versionadas do portal (`biblioteca-pro-brumadinho`,
 * `biblioteca-ati`, `biblioteca-desastres`, `biblioteca-unificada`) e os PDFs
 * oficiais já catalogados nelas. O texto não é reescrito: é o que o PDF diz.
 */

export interface DocumentoRagMeta {
  id: string;
  titulo: string;
  tipo: string;
  categoria: string;
  tema: string;
  orgao: string;
  ano: number | null;
  data: string | null;
  urlOriginal: string;
  urlPdf: string | null;
  /** PDF j? coletado e lido do cache local, sem nova requisi??o. */
  arquivoLocal?: string | null;
  resumo: string;
  tags: string[];
  fonte: string;
}

export interface PaginaDocumento {
  numero: number;
  texto: string;
}

export interface DocumentoExtraido extends DocumentoRagMeta {
  paginas: PaginaDocumento[];
}

export interface TrechoDocumento {
  /** id estável: documento + página + posição do trecho. */
  id: string;
  docId: string;
  titulo: string;
  tipo: string;
  categoria: string;
  tema: string;
  orgao: string;
  ano: number | null;
  pagina: number;
  texto: string;
  urlOriginal: string;
  urlPdf: string | null;
  resumo: string;
  tags: string[];
  fonte: string;
}

export interface ConsultaDocumentos {
  texto: string;
  categoria?: string;
  tema?: string;
  ano?: number;
  limite?: number;
}

export interface ResultadoDocumento {
  trecho: TrechoDocumento;
  score: number;
  motivos: string[];
}

export interface MapaDocumentos {
  totalDocumentos: number;
  totalTrechos: number;
  porCategoria: { slug: string; contagem: number }[];
  porTema: { slug: string; contagem: number }[];
  porAno: { slug: string; contagem: number }[];
}

export interface IndiceDocumentos {
  documentos: readonly DocumentoRagMeta[];
  trechos: readonly TrechoDocumento[];
  porTermo: ReadonlyMap<string, readonly string[]>;
  idf: ReadonlyMap<string, number>;
  porCategoria: ReadonlyMap<string, readonly string[]>;
  porTema: ReadonlyMap<string, readonly string[]>;
  porAno: ReadonlyMap<string, readonly string[]>;
}
