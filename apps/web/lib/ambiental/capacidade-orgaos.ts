/**
 * Acervo de Capacidade Institucional, Efetivo e Orçamento dos Órgãos Ambientais e de Patrimônio
 *
 * Módulo de consulta e consolidação analítica da série histórica comparativa de 10 anos
 * (2016, 2021, 2026) dos órgãos ambientais e de patrimônio histórico/cultural estaduais e federais.
 *
 * Dados auditáveis baseados nos Portais da Transparência, SIAPE/PEP, LOAs e Prestações de Contas ao TCU/TCE.
 */

import dadosBrutos from "../../data/orgaos-capacidade-ambiental.json";

export interface SerieServidores {
  ano: number;
  efetivos: number;
  comissionados: number;
  total: number;
}

export interface SerieOrcamento {
  ano: number;
  orcamentoNominal: number;
  orcamentoReal: number;
}

export interface LiderancaOrgao {
  nome: string;
  cargo: string;
  gabinete: string;
  email: string;
  telefone: string;
}

export interface SedeRegional {
  nome: string;
  cidade: string;
  endereco: string;
  telefone: string;
  email: string;
}

export interface OuvidoriaCanal {
  canal: string;
  url: string;
  telefone: string;
  email: string;
}

export interface ContatosOrgao {
  emailGeral: string;
  telefones: string[];
  enderecoSede: {
    logradouro: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  sedesRegionais: SedeRegional[];
  ouvidoria: OuvidoriaCanal;
  canalDenuncia: OuvidoriaCanal;
}

export interface UnidadeOrganograma {
  nome: string;
  sigla: string;
  cargo: string;
  responsavel: string;
  funcao: string;
  telefone: string;
  email: string;
  endereco: string;
  urlPagina: string;
}

export interface ConcursoPublicoOrgao {
  ano: number;
  vagas: number;
  banca: string;
  edital: string;
  hiatoAnosAnterior: number;
  situacao: string;
  deficitEstimado: number;
}

export interface FonteAuditavel {
  titulo: string;
  orgao: string;
  tipo: string;
  url: string;
  descricao: string;
  anoReferencia: string | number;
}

export interface LinksOficiaisOrgao {
  portalPrincipal: string;
  transparencia: string;
  organograma: string;
  relatoriosGestao: string;
  concursos: string;
  sistemasConsulta: string;
}

export interface SerieHistoricaOrgao {
  sigla: string;
  nomeCompleto: string;
  esfera: "Estadual" | "Federal";
  uf: string;
  serieServidores: SerieServidores[];
  variacaoPercentualEfetivo2016_2026: number;
  variacaoPercentualTotal2016_2026: number;
  serieOrcamento: SerieOrcamento[];
  variacaoRealOrcamento2016_2026: number;
  processosAtivosEstimados: number;
  analistasProcessamento: number;
  indiceSobrecarga: number;
}

export interface OrgaoCapacidade {
  sigla: string;
  nomeCompleto: string;
  esfera: "Estadual" | "Federal";
  uf: string;
  papelRegulatorio: string;
  lideranca: LiderancaOrgao;
  contatos: ContatosOrgao;
  responsabilidades: string[];
  marcoLegal: string[];
  organograma: UnidadeOrganograma[];
  ultimoConcurso: ConcursoPublicoOrgao;
  serieServidores: SerieServidores[];
  variacaoPercentualEfetivo2016_2026: number;
  variacaoPercentualTotal2016_2026: number;
  serieOrcamento: SerieOrcamento[];
  variacaoRealOrcamento2016_2026: number;
  processosAtivosEstimados: number;
  analistasProcessamento: number;
  indiceSobrecarga: number;
  fontes: FonteAuditavel[];
  linksOficiais: LinksOficiaisOrgao;
}

export interface MetadadosCapacidade {
  titulo: string;
  dataAtualizacao: string;
  versao: string;
  metodologia: string;
  ipcaAcumulado: {
    "2016_para_2026": number;
    "2021_para_2026": number;
    "2026": number;
  };
  totalOrgaos: number;
}

export interface MetricasGeraisCapacidade {
  totalOrgaos: number;
  totalEfetivos2016: number;
  totalEfetivos2021: number;
  totalEfetivos2026: number;
  perdaEfetivosAbsoluta: number;
  variacaoConsolidadaEfetivos: number;
  totalOrcamentoReal2016: number;
  totalOrcamentoReal2021: number;
  totalOrcamentoReal2026: number;
  variacaoConsolidadaOrcamentoReal: number;
  mediaIndiceSobrecarga: number;
  orgaoMaiorSobrecarga: {
    sigla: string;
    indiceSobrecarga: number;
  };
  orgaoMaiorQuedaEfetivo: {
    sigla: string;
    variacaoEfetivo: number;
  };
  orgaosPorEsfera: {
    estadual: number;
    federal: number;
  };
}

interface BaseDadosCapacidade {
  metadados: MetadadosCapacidade;
  orgaos: OrgaoCapacidade[];
}

const BASE_DADOS = dadosBrutos as unknown as BaseDadosCapacidade;

export const METADADOS_CAPACIDADE: MetadadosCapacidade = BASE_DADOS.metadados;
export const ORGAOS_CAPACIDADE: OrgaoCapacidade[] = BASE_DADOS.orgaos;

/**
 * Retorna todos os órgãos catalogados com dados de capacidade institucional.
 */
export function obterTodosOrgaosCapacidade(): OrgaoCapacidade[] {
  return ORGAOS_CAPACIDADE;
}

/**
 * Busca órgão por sigla exata (ex.: "IEF-MG", "IBAMA", "CETESB-SP"), sem sensibilidade a maiúsculas.
 */
export function obterOrgaoPorSigla(sigla: string): OrgaoCapacidade | undefined {
  if (!sigla) return undefined;
  const normalizada = sigla.trim().toUpperCase();
  return ORGAOS_CAPACIDADE.find((o) => o.sigla.toUpperCase() === normalizada);
}

/**
 * Lista órgãos filtrados por esfera de atuação ("Estadual" ou "Federal").
 */
export function listarOrgaosPorEsfera(esfera: "Estadual" | "Federal"): OrgaoCapacidade[] {
  return ORGAOS_CAPACIDADE.filter((o) => o.esfera === esfera);
}

/**
 * Calcula a perda consolidada de servidores efetivos de carreira entre 2016 e 2026.
 */
export function calcularPerdaConsolidadaServidores(
  orgaos: OrgaoCapacidade[] = ORGAOS_CAPACIDADE
): { total2016: number; total2026: number; perdaAbsoluta: number; perdaPercentual: number } {
  const total2016 = orgaos.reduce((acc, orgao) => {
    const s = orgao.serieServidores.find((item) => item.ano === 2016);
    return acc + (s ? s.efetivos : 0);
  }, 0);

  const total2026 = orgaos.reduce((acc, orgao) => {
    const s = orgao.serieServidores.find((item) => item.ano === 2026);
    return acc + (s ? s.efetivos : 0);
  }, 0);

  const perdaAbsoluta = total2026 - total2016;
  const perdaPercentual = total2016 > 0
    ? Number((((total2026 - total2016) / total2016) * 100).toFixed(2))
    : 0;

  return {
    total2016,
    total2026,
    perdaAbsoluta,
    perdaPercentual,
  };
}

/**
 * Calcula a variação orçamentária média e consolidada em valores reais deflacionados pelo IPCA.
 */
export function calcularVariacaoOrcamentariaMedia(
  orgaos: OrgaoCapacidade[] = ORGAOS_CAPACIDADE
): {
  totalReal2016: number;
  totalReal2026: number;
  variacaoRealTotal: number;
  variacaoRealMediaPorOrgao: number;
} {
  if (orgaos.length === 0) {
    return {
      totalReal2016: 0,
      totalReal2026: 0,
      variacaoRealTotal: 0,
      variacaoRealMediaPorOrgao: 0,
    };
  }

  const totalReal2016 = Number(
    orgaos
      .reduce((acc, orgao) => {
        const o = orgao.serieOrcamento.find((item) => item.ano === 2016);
        return acc + (o ? o.orcamentoReal : 0);
      }, 0)
      .toFixed(2)
  );

  const totalReal2026 = Number(
    orgaos
      .reduce((acc, orgao) => {
        const o = orgao.serieOrcamento.find((item) => item.ano === 2026);
        return acc + (o ? o.orcamentoReal : 0);
      }, 0)
      .toFixed(2)
  );

  const variacaoRealTotal = totalReal2016 > 0
    ? Number((((totalReal2026 - totalReal2016) / totalReal2016) * 100).toFixed(2))
    : 0;

  const somaVariacoesIndividuais = orgaos.reduce(
    (acc, orgao) => acc + orgao.variacaoRealOrcamento2016_2026,
    0
  );
  const variacaoRealMediaPorOrgao = Number(
    (somaVariacoesIndividuais / orgaos.length).toFixed(2)
  );

  return {
    totalReal2016,
    totalReal2026,
    variacaoRealTotal,
    variacaoRealMediaPorOrgao,
  };
}

/**
 * Obtém indicadores consolidados para o painel geral de capacidade dos órgãos.
 */
export function obterMetricasGeraisCapacidade(): MetricasGeraisCapacidade {
  const orgaos = ORGAOS_CAPACIDADE;
  const totalOrgaos = orgaos.length;

  const totalEfetivos2016 = orgaos.reduce((acc, o) => {
    const s = o.serieServidores.find((item) => item.ano === 2016);
    return acc + (s ? s.efetivos : 0);
  }, 0);

  const totalEfetivos2021 = orgaos.reduce((acc, o) => {
    const s = o.serieServidores.find((item) => item.ano === 2021);
    return acc + (s ? s.efetivos : 0);
  }, 0);

  const totalEfetivos2026 = orgaos.reduce((acc, o) => {
    const s = o.serieServidores.find((item) => item.ano === 2026);
    return acc + (s ? s.efetivos : 0);
  }, 0);

  const perdaEfetivosAbsoluta = totalEfetivos2026 - totalEfetivos2016;
  const variacaoConsolidadaEfetivos = totalEfetivos2016 > 0
    ? Number((((totalEfetivos2026 - totalEfetivos2016) / totalEfetivos2016) * 100).toFixed(2))
    : 0;

  const totalOrcamentoReal2016 = Number(
    orgaos
      .reduce((acc, o) => {
        const item = o.serieOrcamento.find((s) => s.ano === 2016);
        return acc + (item ? item.orcamentoReal : 0);
      }, 0)
      .toFixed(2)
  );

  const totalOrcamentoReal2021 = Number(
    orgaos
      .reduce((acc, o) => {
        const item = o.serieOrcamento.find((s) => s.ano === 2021);
        return acc + (item ? item.orcamentoReal : 0);
      }, 0)
      .toFixed(2)
  );

  const totalOrcamentoReal2026 = Number(
    orgaos
      .reduce((acc, o) => {
        const item = o.serieOrcamento.find((s) => s.ano === 2026);
        return acc + (item ? item.orcamentoReal : 0);
      }, 0)
      .toFixed(2)
  );

  const variacaoConsolidadaOrcamentoReal = totalOrcamentoReal2016 > 0
    ? Number((((totalOrcamentoReal2026 - totalOrcamentoReal2016) / totalOrcamentoReal2016) * 100).toFixed(2))
    : 0;

  const somaIndicesSobrecarga = orgaos.reduce((acc, o) => acc + o.indiceSobrecarga, 0);
  const mediaIndiceSobrecarga = totalOrgaos > 0
    ? Number((somaIndicesSobrecarga / totalOrgaos).toFixed(2))
    : 0;

  let orgaoMaiorSobrecarga = {
    sigla: "",
    indiceSobrecarga: -Infinity,
  };

  let orgaoMaiorQuedaEfetivo = {
    sigla: "",
    variacaoEfetivo: Infinity,
  };

  let estadualCount = 0;
  let federalCount = 0;

  for (const o of orgaos) {
    if (o.indiceSobrecarga > orgaoMaiorSobrecarga.indiceSobrecarga) {
      orgaoMaiorSobrecarga = {
        sigla: o.sigla,
        indiceSobrecarga: o.indiceSobrecarga,
      };
    }

    if (o.variacaoPercentualEfetivo2016_2026 < orgaoMaiorQuedaEfetivo.variacaoEfetivo) {
      orgaoMaiorQuedaEfetivo = {
        sigla: o.sigla,
        variacaoEfetivo: o.variacaoPercentualEfetivo2016_2026,
      };
    }

    if (o.esfera === "Estadual") {
      estadualCount++;
    } else if (o.esfera === "Federal") {
      federalCount++;
    }
  }

  return {
    totalOrgaos,
    totalEfetivos2016,
    totalEfetivos2021,
    totalEfetivos2026,
    perdaEfetivosAbsoluta,
    variacaoConsolidadaEfetivos,
    totalOrcamentoReal2016,
    totalOrcamentoReal2021,
    totalOrcamentoReal2026,
    variacaoConsolidadaOrcamentoReal,
    mediaIndiceSobrecarga,
    orgaoMaiorSobrecarga,
    orgaoMaiorQuedaEfetivo,
    orgaosPorEsfera: {
      estadual: estadualCount,
      federal: federalCount,
    },
  };
}
