/**
 * Convênios de saída dos quatro órgãos ambientais de Minas Gerais (SEMAD, FEAM,
 * IEF, IGAM). ARQUIVO GERADO �?" não editar à mão.
 *
 * Gerado por `scripts/coletar-convenios-ambientais-mg.mts` a partir do CKAN do
 * `dados.mg.gov.br` (dataset `convenios-saida`, publicado pela CGE). O
 * cabeçalho daquele script documenta as armadilhas da fonte �?" inclusive a que
 * mais importa aqui:
 *
 * �.��.��.� `dt_vigencia_inicial` N�fO �? A DATA DE INÍCIO �.��.��.�
 *
 * Em 90.045 dos 90.254 registros ela é igual a `dt_vigencia_final`: as duas
 * guardam a data-limite originalmente pactuada. Por isso os campos abaixo se
 * chamam `prazoOriginal` e `prazoAtual`, e `diasDeProrrogacao` é a
 * diferença entre eles �?" quem calcular duração a partir de "inicial" obtém zero
 * para 99,8% dos convênios, e o zero parece plausível.
 *
 * �.��.��.� O QUE ESTE DADO N�fO TEM �.��.��.�
 *
 * Meta e etapa de cada convênio. O dataset publica o recurso
 * `ft_convenio_metaetapa`, mas ele vem **vazio** (só cabeçalho, HTTP 200) �?"
 * conferido duas vezes em 2026-08-21. Sem ele não há como dizer se o convênio
 * cumpriu o que prometeu; dá para dizer quanto custou e quanto tempo levou.
 */

export interface ConvenioAmbientalMg {
  id: string;
  nome: string;
  objetivo: string;
  orgao: string;
  convenente: string;
  municipio: string;
  ano: number;
  /** Vazio quando a fonte não informa (registros da base antiga gravam "-"). */
  instrumento: string;
  valorTotal: number;
  valorConcedente: number;
  valorContrapartida: number;
  /** Data-limite originalmente pactuada, `AAAA-MM-DD`. */
  prazoOriginal: string | null;
  /** Data-limite vigente hoje. */
  prazoAtual: string | null;
  /** `prazoAtual – prazoOriginal` em dias. 0 = nunca prorrogado. */
  diasDeProrrogacao: number;

  /** Tags de assunto extraídas do nome/objetivo. */
  tags?: string[];
  /** Resumo curto do estado de execução do convênio. */
  resumo_execucao?: string;
  /** Percentual de execução (0-100), quando disponível na fonte. */
  percentual_execucao?: number;
  /** Situação descritiva da execução (ex.: "Em execução", "Concluído"). */
  situacao_execucao?: string;
  /** Esfera administrativa: federal, estadual ou municipal. */
  esfera?: string;
}

/**
 * 2026-08-25: a lista (870 convenios, ~930 KiB) saiu daqui e virou
 * public/data/convenios-ambientais-mg.json - asset estatico buscado pelo
 * cliente (FiltroConvenios.tsx) e lido em Node via convenios-mg-dados.ts
 * (testes). Motivo no cabecalho de lib/server-only/json-etl.ts: teto de
 * 3 MiB gzip do Worker Free (erro 10027 em 2026-08-24).
 */
export const COBERTURA_CONVENIOS_AMBIENTAIS = {
  convenios: 870,
  orgaos: 4,
  municipios: 373,
  anoInicial: 2007,
  anoFinal: 2026,
  valorTotal: 477368938.8000006,
  prorrogados: 415,
  percentualProrrogados: 47.7,
  medianaDiasDeProrrogacao: 365,
  maximoDiasDeProrrogacao: 5171,
  /** O mesmo cálculo sobre os 90254 convênios de TODOS os 55 órgãos do
   *  Estado �?" a régua para dizer se o ambiental foge da média. */
  percentualProrrogadosNoEstado: 27.6,
  conveniosNoEstado: 90254,
} as const;

export const CONVENIOS_AMBIENTAIS_POR_ORGAO = [{"orgao":"SECRETARIA DE ESTADO DE MEIO AMBIENTE E DESENVOLVIMENTO SUSTENTAVEL","convenios":688,"valorTotal":401686963.02000046,"prorrogados":357},{"orgao":"INSTITUTO ESTADUAL DE FLORESTAS","convenios":107,"valorTotal":44328672.419999994,"prorrogados":37},{"orgao":"INSTITUTO MINEIRO DE GESTAO DAS AGUAS","convenios":48,"valorTotal":21592521.19,"prorrogados":13},{"orgao":"FUNDACAO ESTADUAL DO MEIO AMBIENTE","convenios":27,"valorTotal":9760782.17,"prorrogados":8}] as const;
export const CONVENIOS_AMBIENTAIS_POR_ANO = [{"ano":2007,"convenios":46,"valorTotal":11498410.32,"prorrogados":14},{"ano":2008,"convenios":78,"valorTotal":57561387.42000002,"prorrogados":31},{"ano":2009,"convenios":94,"valorTotal":52984291.55,"prorrogados":48},{"ano":2010,"convenios":82,"valorTotal":33683459.37,"prorrogados":43},{"ano":2011,"convenios":39,"valorTotal":18401925.750000004,"prorrogados":29},{"ano":2012,"convenios":68,"valorTotal":14885017.459999993,"prorrogados":36},{"ano":2013,"convenios":9,"valorTotal":31001160.32,"prorrogados":7},{"ano":2014,"convenios":15,"valorTotal":5223466.459999999,"prorrogados":11},{"ano":2015,"convenios":24,"valorTotal":11399559.669999998,"prorrogados":23},{"ano":2016,"convenios":15,"valorTotal":1505142.1600000001,"prorrogados":12},{"ano":2017,"convenios":26,"valorTotal":6620361.370000001,"prorrogados":24},{"ano":2018,"convenios":11,"valorTotal":2709470.3300000005,"prorrogados":10},{"ano":2019,"convenios":9,"valorTotal":12297696.51,"prorrogados":2},{"ano":2020,"convenios":41,"valorTotal":6848225.79,"prorrogados":32},{"ano":2021,"convenios":59,"valorTotal":31730176.25,"prorrogados":27},{"ano":2022,"convenios":43,"valorTotal":39846653.089999996,"prorrogados":14},{"ano":2023,"convenios":73,"valorTotal":54590436.00999999,"prorrogados":31},{"ano":2024,"convenios":20,"valorTotal":8927259.16,"prorrogados":10},{"ano":2025,"convenios":55,"valorTotal":56322691.72999999,"prorrogados":11},{"ano":2026,"convenios":63,"valorTotal":19332148.08,"prorrogados":0}] as const;