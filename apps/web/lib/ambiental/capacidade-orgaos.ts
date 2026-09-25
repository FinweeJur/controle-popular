/**
 * apps/web/lib/ambiental/capacidade-orgaos.ts
 *
 * Acervo de Capacidade Institucional, Efetivo e Orçamento dos Órgãos Ambientais e de Patrimônio.
 *
 * ═══ PAPEL NO PORTAL CÍVICO ═══
 * Este módulo investiga e consolida a série histórica de uma década (marcos em 2016, 2021 e 2026)
 * sobre a força de trabalho e o financiamento dos órgãos públicos encarregados da proteção ambiental,
 * gestão de recursos hídricos e salvaguarda do patrimônio cultural e histórico (como IEF, FEAM,
 * IGAM, SEMAD, IBAMA, ICMBio, IPHAN e IEPHA).
 *
 * No portal Controle Popular, responde a questões críticas para a sociedade:
 * 1. "O órgão ambiental tem equipe técnica suficiente para analisar os estudos de impacto?"
 * 2. "Houve desmonte ou ampliação da fiscalização florestal e de barragens nos últimos 10 anos?"
 * 3. "Qual a proporção de servidores concursados de carreira em relação a cargos comissionados?"
 * 4. "O orçamento cresceu ou encolheu em termos reais após a correção pela inflação (IPCA)?"
 *
 * ═══ FONTES OFICIAIS E AUDITABILIDADE ═══
 * - Portais da Transparência: Dados do Poder Executivo Federal (Portal da Transparência CGU)
 *   e do Estado de Minas Gerais (Portal da Transparência CGE-MG).
 * - Painéis de Pessoal: PEP (Painel Estatístico de Pessoal do Governo Federal) e SIAPE.
 * - Leis Orçamentárias Anuais (LOAs): Dotações aprovadas e executadas de 2016, 2021 e 2026.
 * - Relatórios de Gestão e Contas Anuais do TCU (Tribunal de Contas da União) e TCE-MG.
 * - Editais e atas de concursos públicos: Histórico de certames e déficit apurado em audiências públicas.
 *
 * ═══ DECISÕES METODOLÓGICAS E DE ARQUITETURA ═══
 * - Orçamento Real deflacionado pelo IPCA: Comparar orçamentos nominais entre 2016 e 2026 falseia
 *   o diagnóstico, pois oculta perdas inflacionárias severas. Todos os valores da série real
 *   são reajustados para a data-base de 2026 pelo índice IPCA oficial apurado pelo IBGE.
 * - Índice de Sobrecarga Institucional: Métrica calculada pela razão entre processos ativos
 *   e o número de analistas de carreira disponíveis. Indica o nível de estresse da equipe pública.
 * - Regra das Cinco Coisas (AGENTS.md §8): Estruturado para fornecer agregados rápidos em memória,
 *   sem depender de queries pesadas no banco Postgres durante a renderização do HTML.
 */

import dadosBrutos from "../../data/orgaos-capacidade-ambiental.json";

/**
 * Registro anual do quadro funcional de servidores do órgão.
 */
export interface SerieServidores {
  /** Ano de referência do levantamento funcional (2016, 2021 ou 2026). */
  ano: number;
  /** Servidores públicos efetivos de carreira concursados em exercício ativo. */
  efetivos: number;
  /** Cargos de livre provimento e recrutamento amplo (comissionados e funções gratificadas). */
  comissionados: number;
  /** Soma total dos servidores em atuação no órgão no respectivo exercício. */
  total: number;
}

/**
 * Registro anual do orçamento alocado ao órgão.
 */
export interface SerieOrcamento {
  /** Exercício financeiro correspondente. */
  ano: number;
  /** Dotação orçamentária nominal em Reais (R$) vigente no exercício histórico. */
  orcamentoNominal: number;
  /** Dotação orçamentária atualizada em Reais de 2026 deflacionada pelo IPCA acumulado. */
  orcamentoReal: number;
}

/**
 * Identificação da autoridade máxima ou dirigente em exercício no órgão.
 */
export interface LiderancaOrgao {
  /** Nome completo do dirigente ou autoridade máxima do órgão. */
  nome: string;
  /** Cargo formal ocupado (ex: "Diretor-Geral", "Presidente", "Secretário de Estado"). */
  cargo: string;
  /** Nome ou identificação da sala de gabinete. */
  gabinete: string;
  /** E-mail funcional institucional de contato. */
  email: string;
  /** Telefone oficial do gabinete da liderança. */
  telefone: string;
}

/**
 * Informações de sedes e representações regionais do órgão nos territórios.
 */
export interface SedeRegional {
  /** Denominação da unidade regional (ex: "URFBIO Centro-Sul", "Superintendência Regional"). */
  nome: string;
  /** Município sede onde a unidade opera fisicamente. */
  cidade: string;
  /** Logradouro e endereço físico completo. */
  endereco: string;
  /** Telefone de atendimento público regional. */
  telefone: string;
  /** E-mail oficial da representação regional. */
  email: string;
}

/**
 * Canais oficiais de ouvidoria, transparência e denúncia pública.
 */
export interface OuvidoriaCanal {
  /** Nome do canal institucional (ex: "Fala.BR", "Ouvidoria-Geral do Estado"). */
  canal: string;
  /** URL direta para registro eletrônico de manifestações ou pedidos via LAI. */
  url: string;
  /** Telefone oficial do serviço de ouvidoria. */
  telefone: string;
  /** E-mail oficial da ouvidoria. */
  email: string;
}

/**
 * Dados de contato institucional, ouvidoria e endereçamento oficial.
 */
export interface ContatosOrgao {
  /** E-mail geral para correspondências do órgão. */
  emailGeral: string;
  /** Lista de telefones de atendimento público. */
  telefones: string[];
  /** Endereço físico completo da sede central. */
  enderecoSede: {
    logradouro: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  /** Sedes e unidades regionais operando no território. */
  sedesRegionais: SedeRegional[];
  /** Canal oficial de ouvidoria e Lei de Acesso à Informação (LAI). */
  ouvidoria: OuvidoriaCanal;
  /** Canal específico para denúncias de infrações ou crimes ambientais. */
  canalDenuncia: OuvidoriaCanal;
}

/**
 * Unidade administrativa componente do organograma formal da entidade.
 */
export interface UnidadeOrganograma {
  /** Denominação da diretoria, superintendência ou gerência. */
  nome: string;
  /** Sigla oficial da unidade interna. */
  sigla: string;
  /** Cargo de chefia da unidade. */
  cargo: string;
  /** Nome da pessoa responsável designada para o cargo. */
  responsavel: string;
  /** Descrição das atribuições regimentais da unidade. */
  funcao: string;
  /** Telefone institucional direto da unidade. */
  telefone: string;
  /** E-mail institucional da unidade. */
  email: string;
  /** Localização física ou endereço da unidade. */
  endereco: string;
  /** URL pública da página oficial da unidade. */
  urlPagina: string;
}

/**
 * Histórico do último concurso público realizado pelo órgão.
 */
export interface ConcursoPublicoOrgao {
  /** Ano de realização do último certame de provimento de cargos. */
  ano: number;
  /** Número de vagas abertas no edital oficial. */
  vagas: number;
  /** Banca organizadora responsável pelo concurso. */
  banca: string;
  /** Identificação formal do edital no diário oficial. */
  edital: string;
  /** Quantidade de anos decorridos sem concurso anterior à realização do certame. */
  hiatoAnosAnterior: number;
  /** Situação atual do concurso (ex: "Validade Expirada", "Em Andamento", "Homologado"). */
  situacao: string;
  /** Estimativa de postos vagos por aposentadoria e vacância apurada em relatórios. */
  deficitEstimado: number;
}

/**
 * Referência bibliográfica ou link auditável da fonte primária dos dados.
 */
export interface FonteAuditavel {
  /** Título do documento, painel ou relatório público. */
  titulo: string;
  /** Órgão ou entidade emissora do documento oficial. */
  orgao: string;
  /** Categoria do documento (ex: "Relatório de Gestão", "LOA", "Painel de Pessoal"). */
  tipo: string;
  /** URL canônica para consulta direta pelo cidadão. */
  url: string;
  /** Descrição sucinta do método e dos dados extraídos da fonte. */
  descricao: string;
  /** Ano ou período cronológico coberto pela fonte. */
  anoReferencia: string | number;
}

/**
 * Links oficiais e sistemas de pesquisa mantidos pelo órgão.
 */
export interface LinksOficiaisOrgao {
  /** Portal institucional principal na internet. */
  portalPrincipal: string;
  /** Seção da Lei de Acesso à Informação e Portal da Transparência. */
  transparencia: string;
  /** Página contendo a estrutura organizacional e organograma vigente. */
  organograma: string;
  /** Acervo dos Relatórios de Gestão e Prestações de Contas Anuais. */
  relatoriosGestao: string;
  /** Seção oficial sobre certames e concursos públicos. */
  concursos: string;
  /** Sistemas informatizados de consulta processual (ex: SEI, SLA, SisemaNet). */
  sistemasConsulta: string;
}

/**
 * Estrutura analítica com a série histórica e indicadores de sobrecarga do órgão.
 */
export interface SerieHistoricaOrgao {
  /** Sigla do órgão (ex: "IEF-MG", "IBAMA"). */
  sigla: string;
  /** Nome oficial por extenso. */
  nomeCompleto: string;
  /** Esfera de vinculação administrativa ("Estadual" ou "Federal"). */
  esfera: "Estadual" | "Federal";
  /** Unidade da Federação de atuação principal ("MG" ou "BR"). */
  uf: string;
  /** Série histórica dos quantitativos de pessoal (2016, 2021, 2026). */
  serieServidores: SerieServidores[];
  /** Variação percentual de servidores efetivos de 2016 para 2026. */
  variacaoPercentualEfetivo2016_2026: number;
  /** Variação percentual do quadro total (efetivos + comissionados) de 2016 para 2026. */
  variacaoPercentualTotal2016_2026: number;
  /** Série orçamentária nominal e real deflacionada. */
  serieOrcamento: SerieOrcamento[];
  /** Variação percentual real do orçamento (expurgada a inflação) entre 2016 e 2026. */
  variacaoRealOrcamento2016_2026: number;
  /** Volume estimado de processos de licenciamento, outorga ou fiscalização ativos. */
  processosAtivosEstimados: number;
  /** Quantidade de analistas efetivos dedicados à análise final de processos. */
  analistasProcessamento: number;
  /** Razão entre processos ativos e analistas (indicador de carga de trabalho per capita). */
  indiceSobrecarga: number;
}

/**
 * Perfil institucional completo do órgão ambiental catalogado.
 */
export interface OrgaoCapacidade {
  /** Sigla identificadora única do órgão. */
  sigla: string;
  /** Nome completo da instituição. */
  nomeCompleto: string;
  /** Esfera federativa ("Estadual" ou "Federal"). */
  esfera: "Estadual" | "Federal";
  /** Unidade federativa de jurisdição. */
  uf: string;
  /** Descrição resumida da missão regulatória e fiscalizatória. */
  papelRegulatorio: string;
  /** Dados da autoridade em exercício. */
  lideranca: LiderancaOrgao;
  /** Canais oficiais de atendimento e endereços. */
  contatos: ContatosOrgao;
  /** Principais competências e responsabilidades legais atribuídas. */
  responsabilidades: string[];
  /** Legislações fundamentais e decretos que criaram ou regulamentaram a instituição. */
  marcoLegal: string[];
  /** Relação de unidades e departamentos integrantes da estrutura formal. */
  organograma: UnidadeOrganograma[];
  /** Dados do último concurso público realizado pela entidade. */
  ultimoConcurso: ConcursoPublicoOrgao;
  /** Série histórica do quadro funcional nos três marcos decenais. */
  serieServidores: SerieServidores[];
  /** Variação percentual apurada no quadro de servidores concursados. */
  variacaoPercentualEfetivo2016_2026: number;
  /** Variação percentual no total global da folha de servidores. */
  variacaoPercentualTotal2016_2026: number;
  /** Série histórica dos valores orçamentários nominais e corrigidos. */
  serieOrcamento: SerieOrcamento[];
  /** Variação percentual do orçamento em termos reais deflacionados. */
  variacaoRealOrcamento2016_2026: number;
  /** Estimativa de processos abertos sob tutela da instituição. */
  processosAtivosEstimados: number;
  /** Quadro técnico efetivo alocado na análise e instrução dos processos. */
  analistasProcessamento: number;
  /** Índice de sobrecarga de trabalho (processos ativos por analista). */
  indiceSobrecarga: number;
  /** Fontes públicas auditadas para comprovação de cada dado. */
  fontes: FonteAuditavel[];
  /** Hiperlinks oficiais para consulta externa direta. */
  linksOficiais: LinksOficiaisOrgao;
}

/**
 * Metadados gerais sobre a compilação do acervo de capacidade institucional.
 */
export interface MetadadosCapacidade {
  /** Título do acervo documental. */
  titulo: string;
  /** Data da última medição e consolidação dos dados. */
  dataAtualizacao: string;
  /** Versão da base de dados. */
  versao: string;
  /** Descrição da metodologia adotada na consolidação. */
  metodologia: string;
  /** Índices do IPCA acumulado aplicados para o cálculo dos valores reais de 2026. */
  ipcaAcumulado: {
    "2016_para_2026": number;
    "2021_para_2026": number;
    "2026": number;
  };
  /** Quantidade total de órgãos ambientais auditados. */
  totalOrgaos: number;
}

/**
 * Indicadores gerais agregados para os cartões de topo da página analítica.
 */
export interface MetricasGeraisCapacidade {
  /** Total de órgãos públicos mapeados no acervo. */
  totalOrgaos: number;
  /** Total consolidado de servidores efetivos em 2016 somando todos os órgãos. */
  totalEfetivos2016: number;
  /** Total consolidado de servidores efetivos em 2021 somando todos os órgãos. */
  totalEfetivos2021: number;
  /** Total consolidado de servidores efetivos em 2026 somando todos os órgãos. */
  totalEfetivos2026: number;
  /** Perda líquida absoluta de servidores concursados entre 2016 e 2026. */
  perdaEfetivosAbsoluta: number;
  /** Variação percentual consolidada da força de trabalho de carreira de 2016 para 2026. */
  variacaoConsolidadaEfetivos: number;
  /** Orçamento real somado de todos os órgãos em 2016 (a preços de 2026). */
  totalOrcamentoReal2016: number;
  /** Orçamento real somado de todos os órgãos em 2021 (a preços de 2026). */
  totalOrcamentoReal2021: number;
  /** Orçamento real somado de todos os órgãos em 2026. */
  totalOrcamentoReal2026: number;
  /** Variação real do orçamento consolidado ao longo da década. */
  variacaoConsolidadaOrcamentoReal: number;
  /** Média aritmética do índice de sobrecarga entre as instituições. */
  mediaIndiceSobrecarga: number;
  /** Órgão com maior índice crítico de sobrecarga de processos por analista. */
  orgaoMaiorSobrecarga: {
    sigla: string;
    indiceSobrecarga: number;
  };
  /** Órgão com a maior perda percentual no quadro de servidores concursados. */
  orgaoMaiorQuedaEfetivo: {
    sigla: string;
    variacaoEfetivo: number;
  };
  /** Distribuição de órgãos mapeados por esfera de governo. */
  orgaosPorEsfera: {
    estadual: number;
    federal: number;
  };
}

/** Interface da estrutura crua do JSON de capacidade institucional. */
interface BaseDadosCapacidade {
  metadados: MetadadosCapacidade;
  orgaos: OrgaoCapacidade[];
}

const BASE_DADOS = dadosBrutos as unknown as BaseDadosCapacidade;

/** Metadados e índices metodológicos de atualização da base. */
export const METADADOS_CAPACIDADE: MetadadosCapacidade = BASE_DADOS.metadados;

/** Coleção completa dos órgãos catalogados. */
export const ORGAOS_CAPACIDADE: OrgaoCapacidade[] = BASE_DADOS.orgaos;

/**
 * Retorna todos os órgãos catalogados no acervo com suas séries funcionais e orçamentárias.
 *
 * @returns Vetor de objetos `OrgaoCapacidade`.
 */
export function obterTodosOrgaosCapacidade(): OrgaoCapacidade[] {
  return ORGAOS_CAPACIDADE;
}

/**
 * Localiza um órgão pela sigla exata (ex.: "IEF-MG", "IBAMA", "CETESB-SP"), sem sensibilidade a maiúsculas.
 *
 * @param sigla Sigla institucional do órgão a pesquisar.
 * @returns O órgão localizado ou `undefined` se a sigla não for encontrada.
 */
export function obterOrgaoPorSigla(sigla: string): OrgaoCapacidade | undefined {
  if (!sigla) return undefined;
  const normalizada = sigla.trim().toUpperCase();
  return ORGAOS_CAPACIDADE.find((o) => o.sigla.toUpperCase() === normalizada);
}

/**
 * Filtra os órgãos conforme a esfera administrativa ("Estadual" ou "Federal").
 *
 * @param esfera Esfera federativa desejada.
 * @returns Lista de órgãos pertencentes à esfera selecionada.
 */
export function listarOrgaosPorEsfera(esfera: "Estadual" | "Federal"): OrgaoCapacidade[] {
  return ORGAOS_CAPACIDADE.filter((o) => o.esfera === esfera);
}

/**
 * Calcula a variação consolidada e a perda de servidores efetivos de carreira entre 2016 e 2026.
 *
 * ═══ RELEVÂNCIA DO CÁLCULO ═══
 * Isola os servidores efetivos dos comissionados. O servidor concursado detém estabilidade
 * e autonomia técnica para emitir laudos de infração ou indeferir licenças ilegais sem
 * sofrer demissão sumária por pressão política. A perda de efetivos é o principal
 * indicador de fragilização da proteção socioambiental.
 *
 * @param orgaos Lista opcional de órgãos a consolidar (padrão: todos os órgãos do acervo).
 * @returns Objeto com totais de 2016, 2026, perda absoluta e variação percentual.
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
 * Calcula a evolução orçamentária média e consolidada em valores reais deflacionados pelo IPCA.
 *
 * ═══ POR QUE O ORÇAMENTO REAL É INDISPENSÁVEL ═══
 * Um orçamento nominal que subiu de R$ 100 milhões para R$ 130 milhões pode parecer um aumento,
 * mas se a inflação acumulada no período foi de 60%, o órgão perdeu quase 20% do seu poder de compra
 * real para combustíveis, fiscalizações de campo, diárias e contratação de peritos.
 *
 * @param orgaos Lista de órgãos a consolidar (padrão: base integral).
 * @returns Totais e variações percentuais em moeda real e média por instituição.
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
 * Obtém todos os indicadores consolidados para o painel geral de capacidade dos órgãos.
 *
 * Realiza a apuração das métricas fundamentais (perda de pessoal, variação de orçamento,
 * órgão mais sobrecarregado e distribuição por esfera) em uma única varredura eficiente.
 *
 * @returns Objeto `MetricasGeraisCapacidade` pronto para renderizar os cartões de topo da interface.
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
