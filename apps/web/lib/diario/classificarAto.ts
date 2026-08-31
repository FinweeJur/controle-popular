/**
 * ═══ CLASSIFICADOR DE ATOS DO DIÁRIO OFICIAL ═══
 *
 * Dá o TIPO de uma matéria do diário oficial a partir do título (cabeçalho)
 * e, opcionalmente, da categoria original da fonte pública (fallback seguro),
 * por regras determinísticas e auditáveis.
 *
 * Taxonomia oficial fechada (7 tipos canônicos):
 *   decreto | portaria | edital | contrato | convenio | lei | outro
 *
 * ═══ A ORDEM DAS REGRAS É DECISÃO, NÃO ACASO ═══
 *
 * Precedência estrita:
 * 1. convenio  (CONVÊNIO, FOMENTO, COLABORAÇÃO, PARCERIA, ACORDO DE COOPERAÇÃO)
 * 2. contrato  (CONTRATO, ADITIVO, DISTRATO, RESCISÃO CONTRATUAL)
 * 3. lei       (LEI, LEI COMPLEMENTAR, LEI ORDINÁRIA — exceto PROJETO DE LEI)
 * 4. decreto   (DECRETO)
 * 5. portaria  (PORTARIA)
 * 6. edital    (LICITAÇÃO, EDITAL, CREDENCIAMENTO, DISPENSA, INEXIGIBILIDADE,
 *               CHAMAMENTO PÚBLICO, HOMOLOGAÇÃO, ADJUDICAÇÃO, IMPUGNAÇÃO,
 *               REGISTRO DE PREÇOS, RATIFICAÇÃO, PREGÃO, CONCORRÊNCIA, etc.)
 * 7. categoriaOriginal (fallback se o título for genérico, ex. DOM-PBH)
 * 8. outro     (fallback final se nenhuma regra casar)
 */

export type TipoAto =
  | "decreto"
  | "portaria"
  | "edital"
  | "contrato"
  | "convenio"
  | "lei"
  | "outro";

/**
 * Lista dos 7 tipos canônicos de ato do diário oficial.
 */
export const TIPOS_ATO: readonly TipoAto[] = [
  "decreto",
  "edital",
  "contrato",
  "convenio",
  "portaria",
  "lei",
  "outro",
] as const;

export const ROTULOS_TIPO: Record<TipoAto, string> = {
  decreto: "Decreto",
  edital: "Licitação/edital",
  contrato: "Contrato",
  convenio: "Convênio/parceria",
  portaria: "Portaria",
  lei: "Lei",
  outro: "Outro",
};

/**
 * O que cada tipo cobre — texto curto para tooltip/legenda/acessibilidade.
 */
export const DESCRICAO_TIPO: Record<TipoAto, string> = {
  decreto: "Decreto municipal (norma do Executivo).",
  edital: "Atos de licitação: aviso, credenciamento, dispensa, inexigibilidade, chamamento público, homologação, adjudicação, impugnação, registro de preço, ratificação.",
  contrato: "Contrato e termos aditivos de contrato (Prefeitura e Câmara).",
  convenio: "Convênio, termo de fomento e termo de colaboração (parcerias com repasse de recursos).",
  portaria: "Portaria municipal (decisão interna do Executivo).",
  lei: "Lei municipal (ordinária, complementar ou delegada).",
  outro: "Atos que não se encaixam nos tipos acima.",
};

/** Decodifica entidades HTML simples em texto puro. */
function decodificarHtml(s: string): string {
  return s
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&atilde;/gi, 'ã')
    .replace(/&eacute;/gi, 'é');
}

/** Normaliza o texto para busca de padrão: caixa alta e sem acentos. */
export function normalizarTituloAto(titulo: string | null | undefined): string {
  if (!titulo) return "";
  const semHtml = decodificarHtml(titulo);
  return semHtml
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g, " ")
    .toUpperCase();
}

const TEM_CONVENIO_PADRAO = /\b(CONVENIOS?|FOMENTO|COLABORACAO|COLABORACOES|PARCERIAS?|ACORDO DE COOPERACAO)\b/;
const TEM_CONTRATO_PADRAO = /\b(CONTRATOS?|DISTRATOS?|RESCISAO CONTRATUAL)\b/;

const TEM_LEI_INICIO = /^(?:LEIS?\b|LEI\s+(?:COMPLEMENTAR|MUNICIPAL|ESTADUAL|DELEGADA|ORDINARIA|ORGANICA)\b)/;
const TEM_DECRETO_INICIO = /^(?:DECRETOS?\b|DECRETO\s+(?:MUNICIPAL|ESTADUAL|LEGISLATIVO|EXECUTIVO|REGULAMENTAR|NUMERADO|DE)\b)/;
const TEM_PORTARIA_INICIO = /^(?:PORTARIAS?\b|PORTARIA\s+(?:SMS|SEMED|CONJUNTA|MUNICIPAL|DE)\b)/;

const TEM_DISPENSA_RH = /\bDISPENSA\s+DE\s+(?:CARGO|SERVIDOR|FUNCAO|COMISSAO|EMPREGADO|PESSOAL)\b/;

/** Padrões que identificam com precisão atos de licitação/edital. */
const PADROES_LICITACAO: readonly RegExp[] = [
  /\bLICITA(?:CAO|COES|TORI[AO]S?|NTES?|DOS?|R)\b/,
  /\bEDITAIS?\b/,
  /\bCREDENCIAMENTOS?\b/,
  /\bCHAMAMENTOS?\s+PUBLICOS?\b|\bCHAMAMENTO\s+PUBLICO\b/,
  /\bHOMOLOGA(?:CAO|COES)\b/,
  /\bADJUDICA(?:CAO|COES)\b/,
  /\bIMPUGNA(?:CAO|COES)\b/,
  /\bREGISTRO\s+DE\s+PRECOS?\b/,
  /\bRATIFICA(?:CAO|COES)\b/,
  /\bPREG(?:AO|OES)\b/,
  /\bCONCORRENCIAS?\b/,
  /\bTOMADA\s+DE\s+PRECOS?\b/,
  /\bCONVITES?\b/,
  /\bCOTACAO\s+ELETRONICA\b/,
  /\bLEIL(?:AO|OES)\b/,
  /\bINEXIGIBILIDADES?\b/,
  /\bDISPENSA\b/,
];

function temPalavraDeLicitacao(normalizado: string): boolean {
  if (TEM_DISPENSA_RH.test(normalizado)) {
    const semDispensa = normalizado.replace(TEM_DISPENSA_RH, "");
    return PADROES_LICITACAO.some((re) => re.test(semDispensa));
  }
  return PADROES_LICITACAO.some((re) => re.test(normalizado));
}

const TEM_LEI_GERAL = /\bLEIS?\s+(?:COMPLEMENTAR\s+|MUNICIPAL\s+|ESTADUAL\s+|DELEGADA\s+|ORDINARIA\s+|ORGANICA\s+)?N[ºO°\.]?\s*[0-9]|\bLEIS\b|\bLEI\s+(?:COMPLEMENTAR|MUNICIPAL|ESTADUAL|DELEGADA|ORDINARIA|ORGANICA)\b/;
const TEM_DECRETO_GERAL = /\bDECRETOS?\b/;
const TEM_PORTARIA_GERAL = /\bPORTARIAS?\b/;

function casarTipoPorTexto(n: string): TipoAto {
  if (!n) return "outro";

  // 1. Convênios e Parcerias (precedência máxima: fomento, colaboração, parceria, convênio)
  if (TEM_CONVENIO_PADRAO.test(n)) {
    return "convenio";
  }

  // 2. Contratos, Termos Aditivos e Distratos (precedência sobre editais e atos normativos)
  if (TEM_CONTRATO_PADRAO.test(n)) {
    return "contrato";
  }

  // 3. Atos normativos que iniciam explicitamente com o tipo (LEI, DECRETO, PORTARIA)
  if (TEM_LEI_INICIO.test(n) && !n.includes("PROJETO DE LEI") && !n.startsWith("PROJETO DE")) {
    return "lei";
  }
  if (TEM_DECRETO_INICIO.test(n) && !n.includes("PROJETO DE DECRETO") && !n.startsWith("PROJETO DE")) {
    return "decreto";
  }
  if (TEM_PORTARIA_INICIO.test(n) && !n.includes("PROJETO DE PORTARIA") && !n.startsWith("PROJETO DE")) {
    return "portaria";
  }

  // 4. Editais e Licitações (precedência sobre citações acessórias de Leis ou Decretos no corpo do texto)
  if (temPalavraDeLicitacao(n)) {
    return "edital";
  }

  // 5. Atos normativos no corpo do título (quando não forem editais/licitações)
  if (
    (TEM_LEI_GERAL.test(n) || n.startsWith("LEI")) &&
    !n.includes("PROJETO DE LEI") &&
    !n.startsWith("PROJETO DE")
  ) {
    return "lei";
  }
  if (TEM_DECRETO_GERAL.test(n) && !n.includes("PROJETO DE DECRETO") && !n.startsWith("PROJETO DE")) {
    return "decreto";
  }
  if (TEM_PORTARIA_GERAL.test(n) && !n.includes("PROJETO DE PORTARIA") && !n.startsWith("PROJETO DE")) {
    return "portaria";
  }

  return "outro";
}

/**
 * Classifica o tipo de um ato a partir do título (e opcionalmente da categoria original).
 * Retorna sempre um dos 7 tipos canônicos de TipoAto. Nunca lança exceção.
 *
 * @param titulo Título ou cabeçalho do ato
 * @param categoriaOriginal Categoria fornecida pelo sistema de origem (ex: DOM-PBH)
 */
export function classificarAto(
  titulo: string | null | undefined,
  categoriaOriginal?: string | null
): TipoAto {
  if (!titulo && !categoriaOriginal) return "outro";

  // Se veio um texto com várias frases ou linhas, analisa primeiro o cabeçalho
  const primeiroTrecho = titulo ? (titulo.split(/\r?\n|\.\s/)[0] ?? titulo) : "";
  const nPrimeiro = normalizarTituloAto(primeiroTrecho);
  const tipoPrimeiro = casarTipoPorTexto(nPrimeiro);
  if (tipoPrimeiro !== "outro") {
    return tipoPrimeiro;
  }

  const nTitulo = normalizarTituloAto(titulo);
  const tipoTitulo = casarTipoPorTexto(nTitulo);

  if (tipoTitulo !== "outro") {
    return tipoTitulo;
  }

  // Fallback seguro se o título for genérico (ex: "EXTRATO", "CONVOCAÇÃO", etc.)
  if (categoriaOriginal) {
    const nCategoria = normalizarTituloAto(categoriaOriginal);
    const tipoCategoria = casarTipoPorTexto(nCategoria);
    if (tipoCategoria !== "outro") {
      return tipoCategoria;
    }
  }

  return "outro";
}
