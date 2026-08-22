import dados from "../../../../etl/betim/dados/pncp-mg.json";

/**
 * Contratos e licitações do PNCP para os quatro órgãos ambientais do Estado
 * de Minas Gerais (SEMAD, FEAM, IEF, IGAM). ARQUIVO GERADO — não editar à mão.
 *
 * Gerado por `scripts/coletar-pncp-mg.mts`, cujo cabeçalho documenta o
 * recorte (por que só 4 órgãos, não os 854 municípios nem "o Estado
 * inteiro") e as duas armadilhas que mais importam aqui:
 *
 * ═══ CONTRATOS SÃO COMPLETOS; LICITAÇÕES SÃO DECLARADAMENTE PARCIAIS ═══
 *
 * `/v1/contratos` filtra por CNPJ do órgão — barato, coletado por completo
 * (2021 até o ano corrente). `/v1/contratacoes/publicacao` (licitações)
 * **ignora `cnpjOrgao` em silêncio** (medido no Python, `etl/pncp/client.py`):
 * só filtra por município-sede + modalidade. Os 4 órgãos são sediados em
 * Belo Horizonte, que também sedia a Prefeitura, a União e boa parte do
 * Estado — uma varredura completa custaria dezenas de milhares de linhas
 * só para achar as destes 4 CNPJs. Por isso `licitacoes` aqui cobre só a
 * modalidade 6 (Pregão Eletrônico, a que concentra o volume) e só o ano
 * corrente — `escopo.licitacoes` no JSON de origem declara exatamente o que
 * ficou de fora. **Nunca leia `COBERTURA_PNCP_MG.licitacoes.total` como "o
 * total de licitações destes órgãos"** — é o total ACHADO na fatia varrida.
 *
 * ═══ SE `linhaCruaOmitida` FOR `true`, `PNCP_MG_CONTRATOS` VEM VAZIO ═══
 *
 * Acima de 2.000 contratos dedupe, o coletor grava só os agregados
 * (`PNCP_MG_CONTRATOS_POR_ORGAO_E_ANO`) e omite a linha crua — anunciado em
 * `COBERTURA_PNCP_MG.linhaCruaOmitida`, nunca em silêncio. Uma tela que lista
 * contrato por contrato precisa checar essa flag antes de mostrar "nenhum
 * contrato" onde na verdade há milhares agregados.
 *
 * ═══ COLETA PENDENTE ═══
 *
 * Se `COBERTURA_PNCP_MG.coletaPendente` for `true`, os totais abaixo são
 * ZERO porque a coleta real ainda não rodou — não porque os órgãos não
 * contrataram nada. `COBERTURA_PNCP_MG.motivoPendencia` explica por quê.
 * **Nenhuma tela deste portal pode mostrar "R$ 0,00" ou "0 contratos" nesse
 * estado sem também mostrar o aviso de pendência** — é a mesma regra já
 * aplicada a `valorBruto: 0` no ComunicaBR (`docs/FONTES.md`): zero medido e
 * "não coletado ainda" não podem parecer a mesma coisa.
 */

export interface OrgaoAmbientalPncpMg {
  sigla: string;
  nome: string;
  cnpj: string;
}

export interface ContratoPncpMg {
  numeroControlePncp: string;
  numeroContrato: string | null;
  ano: number | null;
  orgaoSigla: string;
  orgaoCnpj: string;
  unidade: string | null;
  tipo: string | null;
  objeto: string | null;
  fornecedorCnpjCpf: string | null;
  fornecedorNome: string | null;
  valorInicial: number | null;
  valorGlobal: number | null;
  dataAssinatura: string | null;
  vigenciaInicio: string | null;
  vigenciaFim: string | null;
  link: string | null;
}

export interface AgregadoOrgaoAno {
  orgao: string;
  ano: number | "sem-ano";
  quantidade: number;
  valorTotal: number;
}

interface PncpMgJson {
  coletadoEm: string | null;
  coletaPendente: boolean;
  motivoPendencia: string | null;
  fonte: string;
  via: string;
  escopo: {
    orgaos: OrgaoAmbientalPncpMg[];
    contratos: string;
    licitacoes: string;
  };
  contratosCombinacoesIncompletas: string[];
  licitacoesPaginasVarridas: number;
  licitacoesTetoAtingido: boolean;
  contratos: {
    total: number;
    valorGlobalTotal: number;
    periodoInicio: string | null;
    periodoFim: string | null;
    linhaCruaOmitida: boolean;
    linhas: ContratoPncpMg[];
    porOrgaoEAno: AgregadoOrgaoAno[];
  };
  licitacoes: {
    total: number;
    valorHomologadoOuEstimadoTotal: number;
    porOrgao: AgregadoOrgaoAno[];
  };
}

const DADOS = dados as PncpMgJson;

/** Vazio quando `linhaCruaOmitida` é `true` (passou de 2.000 contratos
 *  dedupe) OU quando a coleta ainda está pendente — checar as duas flags em
 *  `COBERTURA_PNCP_MG` antes de tratar "vazio" como "sem contrato nenhum". */
export const PNCP_MG_CONTRATOS: ContratoPncpMg[] = DADOS.contratos.linhas;

export const PNCP_MG_CONTRATOS_POR_ORGAO_E_ANO: AgregadoOrgaoAno[] = DADOS.contratos.porOrgaoEAno;

/** Amostra parcial — ver docstring. Nunca "o total de licitações". */
export const PNCP_MG_LICITACOES_POR_ORGAO: AgregadoOrgaoAno[] = DADOS.licitacoes.porOrgao;

export const ORGAOS_AMBIENTAIS_PNCP_MG: OrgaoAmbientalPncpMg[] = DADOS.escopo.orgaos;

/** Importe ISTO em página de servidor, nunca `PNCP_MG_CONTRATOS` direto
 *  (regra de payload — `docs/AGENTS.md`). */
export const COBERTURA_PNCP_MG = {
  coletadoEm: DADOS.coletadoEm,
  coletaPendente: DADOS.coletaPendente,
  motivoPendencia: DADOS.motivoPendencia,
  fonte: DADOS.fonte,
  escopoContratos: DADOS.escopo.contratos,
  escopoLicitacoes: DADOS.escopo.licitacoes,
  combinacoesIncompletas: DADOS.contratosCombinacoesIncompletas,
  contratos: {
    total: DADOS.contratos.total,
    valorGlobalTotal: DADOS.contratos.valorGlobalTotal,
    periodoInicio: DADOS.contratos.periodoInicio,
    periodoFim: DADOS.contratos.periodoFim,
    linhaCruaOmitida: DADOS.contratos.linhaCruaOmitida,
  },
  licitacoes: {
    /** Total ACHADO na fatia varrida (modalidade 6, ano corrente, BH) — não
     *  o total real de licitações dos 4 órgãos. Ver docstring. */
    total: DADOS.licitacoes.total,
    valorHomologadoOuEstimadoTotal: DADOS.licitacoes.valorHomologadoOuEstimadoTotal,
    paginasVarridas: DADOS.licitacoesPaginasVarridas,
    tetoAtingido: DADOS.licitacoesTetoAtingido,
  },
} as const;
