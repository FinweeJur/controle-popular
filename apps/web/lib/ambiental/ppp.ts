/**
 * Módulo de Parcerias Público-Privadas (PPPs) e concessões de Minas Gerais.
 *
 * Papel no portal: processar a base versionada `data/ppp-mg.json` — 20 contratos
 * do Estado de MG cujo objeto cita "concessão" ou "parceria público-privada".
 * Calcula agregados, filtra, ordena, exporta CSV e gera o microresumo cívico
 * exibido na página `/ambiental/ppp`.
 *
 * Fonte oficial: Portal da Transparência de Minas Gerais, base de contratos
 * publicada como dado aberto em `dados.mg.gov.br` (CKAN). A URL canônica de
 * consulta é https://www.transparencia.mg.gov.br/contratos.
 *
 * ═══ DECISÕES TÉCNICAS (por que o código é assim) ═══
 *
 * 1. O JSON entra por import estático (`@/data/ppp-mg.json`), não por `fs`.
 *    Assim este módulo é isomórfico: o componente de cliente reusa as mesmas
 *    funções puras sem arrastar `node:fs` para o bundle do navegador. São 20
 *    registros (~24 KiB), longe do teto que exige paginação no servidor.
 *
 * 2. O campo `natureza` separa TRÊS coisas que a fonte mistura no mesmo
 *    conjunto: o instrumento da concessão em si, os contratos de supervisão e
 *    os de estruturação/estudos. Só `instrumento_concessao` é a PPP; os outros
 *    dois são apoio. Os rótulos deixam isso explícito em toda a interface.
 *
 * 3. Dinheiro em `number` e formatação só na borda (tela/CSV). A base não tem
 *    centavos de origem para justificar biblioteca decimal; nenhuma soma é
 *    usada para decisão financeira, apenas para leitura pública.
 */

import baseBruta from "@/data/ppp-mg.json";
import { formatCurrencyCompactaBR, formatDateBR, formatNumberBR } from "@/lib/betim/format";

/** Tipos aceitos no campo `natureza` do contrato, conforme a base da fonte. */
export type NaturezaPpp =
  | "instrumento_concessao"
  | "supervisao_verificacao"
  | "estruturacao_estudos";

/** Um contrato da base de concessões/PPPs do Estado de MG. */
export interface ContratoPpp {
  id: string;
  numeroContrato: string;
  numeroProcesso: string;
  ano: number;
  objeto: string;
  natureza: NaturezaPpp | string;
  setor: string;
  concessionaria: string;
  cnpjConcessionaria: string;
  valorInicial: number;
  valorAtual: number;
  dataInicio: string;
  dataFim: string;
  orgao: string;
  unidadeGestora: string;
  situacao: string;
  esfera: string;
  fonte: string;
  fonteUrl: string;
}

/** Metadados que acompanham a base — inclusive a ressalva editorial. */
export interface MetadadosPpp {
  titulo: string;
  fonte: string;
  fonteUrl: string;
  geradoEm: string;
  total: number;
  porNatureza: Record<string, number>;
  porSetor: Record<string, number>;
  ressalva: string;
}

/** Formato completo do arquivo versionado. */
export interface BasePppMg {
  metadados: MetadadosPpp;
  contratos: ContratoPpp[];
}

/** Agregados calculados sobre um recorte da base. */
export interface MetricasPpp {
  total: number;
  valorInicialTotal: number;
  valorAtualTotal: number;
  /** Contratos cuja `situacao` começa com "Vigente" na base da fonte. */
  vigentes: number;
  /** Quantidade de órgãos distintos que assinam os contratos do recorte. */
  orgaos: number;
  porNatureza: Record<string, number>;
  porSetor: Record<string, number>;
}

/** Rótulos em português das naturezas — ver decisão técnica 2 no cabeçalho. */
export const ROTULO_NATUREZA: Record<NaturezaPpp, string> = {
  instrumento_concessao: "Instrumento de concessão",
  supervisao_verificacao: "Supervisão/verificação",
  estruturacao_estudos: "Estudo/estruturação",
};

/** Rótulos legíveis para os setores presentes na base. */
export const ROTULO_SETOR: Record<string, string> = {
  rodovias: "Rodovias",
  mobilidade: "Mobilidade",
  imobiliario: "Imobiliário",
  educacao: "Educação",
  seguranca_cidadania: "Segurança e cidadania",
  outros: "Outros",
};

/** Devolve o rótulo da natureza; se vier valor desconhecido, devolve a chave crua. */
export function rotuloNatureza(natureza: string): string {
  return ROTULO_NATUREZA[natureza as NaturezaPpp] ?? natureza;
}

/** Devolve o rótulo do setor; se vier valor desconhecido, devolve a chave crua. */
export function rotuloSetor(setor: string): string {
  return ROTULO_SETOR[setor] ?? setor;
}

/**
 * Minúsculas sem acento — busca tolerante a acentuação e caixa.
 * Ex.: "concessão" e "concessao" casam com o mesmo termo.
 */
function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Carrega a base versionada de concessões/PPPs de Minas Gerais.
 * @returns `{ metadados, contratos }` — nunca `null`; a base está no bundle.
 */
export function carregarPppsMg(): BasePppMg {
  return baseBruta as unknown as BasePppMg;
}

/**
 * Filtra os contratos por busca textual e facetas.
 *
 * A busca é tolerante a acento e caixa e cobre objeto, concessionária, número
 * do contrato, número do processo e órgão. As facetas ignoram o sentinela
 * "todos"/"todas", de forma que o valor default do `<select>` não esconde nada.
 *
 * @param contratos Base a filtrar (normalmente o retorno de `carregarPppsMg`).
 * @param filtros Busca e facetas; campos ausentes ou sentinela não filtram.
 */
export function filtrarPpps(
  contratos: ContratoPpp[],
  filtros: {
    busca?: string;
    natureza?: string;
    setor?: string;
    situacao?: string;
  } = {}
): ContratoPpp[] {
  const busca = filtros.busca ? normalizarTexto(filtros.busca.trim()) : "";

  return contratos.filter((item) => {
    if (busca) {
      const alvo = normalizarTexto(
        [
          item.objeto,
          item.concessionaria,
          item.numeroContrato,
          item.numeroProcesso,
          item.orgao,
        ].join(" ")
      );
      if (!alvo.includes(busca)) return false;
    }
    if (filtros.natureza && filtros.natureza !== "todas" && item.natureza !== filtros.natureza) {
      return false;
    }
    if (filtros.setor && filtros.setor !== "todos" && item.setor !== filtros.setor) {
      return false;
    }
    if (filtros.situacao && filtros.situacao !== "todas" && item.situacao !== filtros.situacao) {
      return false;
    }
    return true;
  });
}

/**
 * Calcula os agregados do recorte informado.
 *
 * `vigentes` conta apenas situações declaradas "Vigente..." pela fonte — não
 * compara com a data de hoje, porque a base não garante vigência real.
 */
export function calcularMetricasPpp(contratos: ContratoPpp[]): MetricasPpp {
  const metricas: MetricasPpp = {
    total: contratos.length,
    valorInicialTotal: 0,
    valorAtualTotal: 0,
    vigentes: 0,
    orgaos: 0,
    porNatureza: {},
    porSetor: {},
  };

  const orgaos = new Set<string>();

  for (const item of contratos) {
    metricas.valorInicialTotal += item.valorInicial || 0;
    metricas.valorAtualTotal += item.valorAtual || 0;
    if (item.situacao.toLowerCase().startsWith("vigente")) metricas.vigentes += 1;
    if (item.orgao) orgaos.add(item.orgao);

    metricas.porNatureza[item.natureza] = (metricas.porNatureza[item.natureza] ?? 0) + 1;
    metricas.porSetor[item.setor] = (metricas.porSetor[item.setor] ?? 0) + 1;
  }

  metricas.orgaos = orgaos.size;
  return metricas;
}

/** Escapa um campo para CSV entre aspas, dobrando as aspas internas. */
function campoCsv(valor: string | number): string {
  return `"${String(valor).replace(/"/g, '""')}"`;
}

/**
 * Gera o CSV do recorte informado, com BOM UTF-8 (`\uFEFF`) e separador `;`.
 *
 * O BOM e o `;` são o que fazem o Excel brasileiro abrir o arquivo com acentos
 * corretos e colunas separadas sem pedir importação manual. Datas saem em
 * dd/mm/aaaa; dinheiro com vírgula decimal.
 */
export function gerarCsvPpp(contratos: ContratoPpp[]): string {
  const cabecalho = [
    "Nº Contrato",
    "Processo",
    "Ano",
    "Objeto",
    "Natureza",
    "Setor",
    "Concessionária",
    "CNPJ",
    "Valor Inicial (R$)",
    "Valor Atual (R$)",
    "Início",
    "Fim",
    "Órgão",
    "Unidade Gestora",
    "Situação",
    "Esfera",
    "Fonte",
    "Fonte (URL)",
  ].join(";");

  const linhas = contratos.map((c) =>
    [
      campoCsv(c.numeroContrato),
      campoCsv(c.numeroProcesso),
      c.ano,
      campoCsv(c.objeto),
      campoCsv(rotuloNatureza(c.natureza)),
      campoCsv(rotuloSetor(c.setor)),
      campoCsv(c.concessionaria),
      campoCsv(c.cnpjConcessionaria),
      c.valorInicial.toFixed(2).replace(".", ","),
      c.valorAtual.toFixed(2).replace(".", ","),
      campoCsv(formatDateBR(c.dataInicio)),
      campoCsv(formatDateBR(c.dataFim)),
      campoCsv(c.orgao),
      campoCsv(c.unidadeGestora),
      campoCsv(c.situacao),
      campoCsv(c.esfera),
      campoCsv(c.fonte),
      campoCsv(c.fonteUrl),
    ].join(";")
  );

  return "\uFEFF" + [cabecalho, ...linhas].join("\r\n");
}

/**
 * Gera o microresumo cívico (estilo Seu Nonô), uma ideia por linha.
 *
 * Regra editorial (§12): frases de até 13 palavras, oração direta. O primeiro
 * item sempre lembra que nem todo contrato é a concessão em si.
 */
export function gerarMicroresumoPpp(metricas: MetricasPpp): string[] {
  const instrumentos = metricas.porNatureza.instrumento_concessao ?? 0;
  const apoio = metricas.total - instrumentos;
  return [
    `Minas Gerais reúne ${formatNumberBR(metricas.total)} contratos ligados a concessões.`,
    `Somente ${formatNumberBR(instrumentos)} são o instrumento da concessão em si.`,
    `Outros ${formatNumberBR(apoio)} são supervisão ou estudos, não a PPP.`,
    `O valor inicial somado chega a ${formatCurrencyCompactaBR(metricas.valorInicialTotal)}.`,
    `A base marca ${formatNumberBR(metricas.vigentes)} contratos como vigentes.`,
  ];
}
