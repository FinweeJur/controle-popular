import analise from "@/data/analises/rio-doce.json";
import jurisprudencia from "@/data/jurisprudencia-buscador-resumo.json";
import mab from "@/data/mab-publicacoes.json";
import {
  COBERTURA_ACORDO_RIO_DOCE,
  RIO_DOCE_POR_ANO,
  RIO_DOCE_POR_INICIATIVA,
  RIO_DOCE_POR_ORGAO,
} from "@/lib/ambiental/ckan-mg-mariana";
import { COBERTURA_BIBLIOTECA_DESASTRES } from "@/lib/ambiental/desastres-cobertura";
import {
  NOTICIAS_DESASTRES,
  NOTICIAS_DESASTRES_GERADO_EM,
} from "@/lib/ambiental/desastres-noticias";

/**
 * Números e recortes da página `/riodoce/analise`.
 *
 * ═══ O QUE ESTE ARQUIVO FAZ ═══
 *
 * Junta, num só lugar, os agregados que a análise integrada exibe. Nenhum
 * total é digitado à mão: empenhos, valores, órgãos e iniciativas vêm de
 * `lib/ambiental/ckan-mg-mariana.ts` (arquivo gerado do CKAN MG); as
 * contagens de acervo vêm dos dados versionados; os textos de tese vêm do
 * markdown de `data/analises/rio-doce.json`.
 *
 * ═══ REGRA DE PAYLOAD ═══
 *
 * O arquivo é importado só por componentes de SERVIDOR. As coleções grandes
 * (biblioteca, notícias, MAB) são reduzidas a números aqui e nunca viram
 * prop de componente de cliente (AGENTS.md, regra 5.1).
 */

export const C = COBERTURA_ACORDO_RIO_DOCE;

export const ANOS = RIO_DOCE_POR_ANO;

/** Órgãos ordenados por empenho; a barra usa o maior como régua. */
export const ORGAOS = [...RIO_DOCE_POR_ORGAO].sort(
  (a, b) => b.valorEmpenhado - a.valorEmpenhado,
);

export const ORGAOS_TOP = ORGAOS.slice(0, 8).map((orgao) => ({
  ...orgao,
  fatiaDoTotal: (orgao.valorEmpenhado / C.valorEmpenhadoTotal) * 100,
}));

export const MAIOR_ORGAO = ORGAOS[0]?.valorEmpenhado ?? 1;

export const INICIATIVAS_TOP = [...RIO_DOCE_POR_INICIATIVA]
  .sort((a, b) => b.valorEmpenhado - a.valorEmpenhado)
  .slice(0, 8);

export const INICIATIVAS_SEM_EMPENHO = RIO_DOCE_POR_INICIATIVA.filter(
  (item) => item.valorEmpenhado === 0,
).length;

export const PERCENTUAL_PAGO =
  (C.valorPagoTotal / C.valorEmpenhadoTotal) * 100;

const ITENS_MAB = (mab as { itens?: { caso: string | null }[] }).itens ?? [];

export const MAB = {
  total: ITENS_MAB.length,
  mariana: ITENS_MAB.filter((item) => item.caso === "mariana").length,
  geradoEm: (mab as { geradoEm?: string }).geradoEm?.slice(0, 10) ?? "",
};

export const NOTICIAS = {
  total: NOTICIAS_DESASTRES.length,
  mariana: NOTICIAS_DESASTRES.filter((item) => item.desastre === "mariana")
    .length,
  geradoEm: NOTICIAS_DESASTRES_GERADO_EM.slice(0, 10),
};

export const BIBLIOTECA = {
  total: COBERTURA_BIBLIOTECA_DESASTRES.total,
  mariana: COBERTURA_BIBLIOTECA_DESASTRES.porDesastre.mariana,
  medidoEm: COBERTURA_BIBLIOTECA_DESASTRES.medidoEm,
};

export const JURIS = {
  tjes: jurisprudencia.porTribunal.TJES,
  tjmg: jurisprudencia.porTribunal.TJMG,
  geradoEm: jurisprudencia.geradoEm.slice(0, 10),
};

/**
 * Números do PID no balanço da Samarco de 22/10/2026, como registrados no
 * markdown da análise (`## As vias de indenização individual`). Ficam aqui
 * para a seção 04 e os cartões-resumo não divergirem entre si.
 */
export const PID = {
  indenizacoes: 321_000,
  valorPorPessoa: 35_000,
  pessoas: 648_000,
  pago: 36_600_000_000,
  data: "22/10/2026",
} as const;

export const ANALISE = analise as {
  titulo: string;
  geradoEm: string;
  markdown: string;
};

/** Markdown sem o `# título`, que a página já desenha no hero. */
export function semTitulo(markdown: string): string {
  return markdown.replace(/^#\s+.*\r?\n/, "").trim();
}

/** Trecho antes de um `## título`; devolve "" quando o título não existe. */
export function antesDoTitulo(markdown: string, titulo: string): string {
  const indice = markdown.indexOf(`## ${titulo}`);
  return indice === -1 ? "" : markdown.slice(0, indice).trim();
}

/** Conteúdo de um `## título` até o próximo `## `. */
export function secao(markdown: string, titulo: string): string {
  const marca = `## ${titulo}`;
  const inicio = markdown.indexOf(marca);
  if (inicio === -1) return "";
  const resto = markdown.slice(inicio + marca.length);
  const proximo = resto.indexOf("\n## ");
  return (proximo === -1 ? resto : resto.slice(0, proximo)).trim();
}

const CORPO = semTitulo(ANALISE.markdown);

/** Os cinco parágrafos sobre a pluma, a saúde e a pesca. */
export const TEXTO_LITORAL = antesDoTitulo(CORPO, "Como ler estas tabelas");

/** Método das tabelas de jurisprudência (22 temas, 79 teses, achados). */
export const METODO_JURIS = secao(CORPO, "Como ler estas tabelas");

/** Tabela Brumadinho × Rio Doce e a leitura do conjunto. */
export const TESES_COMPARADAS = secao(
  CORPO,
  "Brumadinho e Rio Doce, lado a lado",
);

/** Tabela dos oito temas mais frequentes do Rio Doce por sentido. */
export const TESES_SENTIDO = secao(CORPO, "As teses do Rio Doce por sentido");

/** Tabela PIM/NOVEL/PID e o parágrafo do PID de 22/10/2026. */
export const VIAS_INDENIZACAO = secao(CORPO, "As vias de indenização individual");
