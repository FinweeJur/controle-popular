/**
 * ═══ CLASSIFICADOR DE ATOS DO DIÁRIO OFICIAL ═══
 *
 * Dá o TIPO de uma matéria do diário oficial a partir do título (cabeçalho),
 * por regex — determinístico e auditável, no mesmo espírito de
 * `etl/betim/etl/temas.py`: "é edital porque o título contém LICITAÇÃO".
 *
 * Regras calibradas contra 70 títulos REAIS do diário oficial de Diamantina
 * (Prefeitura e Câmara, via SIGPub/AMM-MG, julho de 2026 — extração em
 * 16/08/2026). A amostra inteira está fixada em `classificarAto.test.ts`;
 * quem muda uma regra tem que justificar contra ela.
 *
 * ═══ POR QUE "EDITAL" COBRE MAIS QUE EDITAL ═══
 *
 * A taxonomia é a do plano (`docs/planos/diario-oficial-plano.md`):
 *
 *   decreto | portaria | edital | contrato | convenio | lei | outro
 *
 * Na prática do diário, `edital` é o balaio do processo de licitação
 * inteiro — aviso de licitação, credenciamento, dispensa, inexigibilidade,
 * chamamento público, homologação, adjudicação e impugnação são todos atos
 * de uma licitação, e o resumo do portal ("saíram 2 editais de licitação")
 * os conta juntos. Os rótulos em `ROTULOS_TIPO` dizem isso ao leitor.
 *
 * ═══ A ORDEM DAS REGRAS É DECISÃO, NÃO ACASO ═══
 *
 * "EXTRATO DE CONTRATO AO PROCESSO LICITATÓRIO" contém os dois mundos
 * (CONTRATO e LICITAÇÃO): é CONTRATO, porque o ato publicado é o contrato.
 * "TERMO DE HOMOLOGAÇÃO AO CONTRATO" também. Por isso as regras de
 * convênio e contrato vêm ANTES do balaio de licitação — caso contrário
 * homologação de contrato viraria edital.
 */

export type TipoAto =
  | "decreto"
  | "portaria"
  | "edital"
  | "contrato"
  | "convenio"
  | "lei"
  | "outro";

/** Ordem de exibição no portal (a mais comentada primeiro, "outro" por último). */
export const TIPOS_ATO: TipoAto[] = [
  "decreto",
  "edital",
  "contrato",
  "convenio",
  "portaria",
  "lei",
  "outro",
];

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
 * O que cada tipo cobre — texto curto, para tooltip/legenda.
 */
export const DESCRICAO_TIPO: Record<TipoAto, string> = {
  decreto: "Decreto municipal (norma do Executivo).",
  edital: "Atos de licitação: aviso, credenciamento, dispensa, inexigibilidade, chamamento público, homologação, adjudicação, impugnação.",
  contrato: "Contrato e termos aditivos de contrato (Prefeitura e Câmara).",
  convenio: "Convênio, termo de fomento e termo de colaboração (parcerias com repasse de recursos).",
  portaria: "Portaria municipal (decisão interna do Executivo).",
  lei: "Lei municipal.",
  outro: "Atos que não se encaixam nos tipos acima.",
};

/** Normaliza o título para a busca de padrão: caixa alta e sem acentos. */
export function normalizarTituloAto(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

const TEM_FOMENTO_OU_COLABORACAO = /\b(FOMENTO|COLABORACAO)\b/;
const TEM_CONVENIO = /\bCONVENIO\b/;

/** Palavras que marcam o processo de licitação, em ordem de leitura. */
const PALAVRAS_DE_LICITACAO = [
  "LICIT",
  "EDITAL",
  "CREDENCIAMENTO",
  "DISPENSA",
  "INEXIGIBILIDADE",
  "CHAMAMENTO PUBLICO",
  "HOMOLOGACAO",
  "ADJUDICACAO",
  "IMPUGNACAO",
];

function temPalavraDeLicitacao(normalizado: string): boolean {
  return PALAVRAS_DE_LICITACAO.some((p) => normalizado.includes(p));
}

/**
 * Classifica o tipo de um ato pelo título. Nunca lança: tudo que não bate
 * nas regras é `outro` — calar (outro) é melhor que errar o tipo.
 */
export function classificarAto(titulo: string): TipoAto {
  const n = normalizarTituloAto(titulo);

  if (TEM_CONVENIO.test(n) || TEM_FOMENTO_OU_COLABORACAO.test(n)) {
    return "convenio";
  }

  if (n.includes("CONTRATO")) {
    return "contrato";
  }

  if (n.startsWith("LEI")) {
    return "lei";
  }

  if (n.startsWith("DECRETO")) {
    return "decreto";
  }

  if (n.startsWith("PORTARIA")) {
    return "portaria";
  }

  if (temPalavraDeLicitacao(n)) {
    return "edital";
  }

  return "outro";
}
