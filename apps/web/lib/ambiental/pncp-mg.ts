import { carregarJsonEtl } from "@/lib/server-only/json-etl";

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
  modalidade: string | null;
  situacao: string | null;
  valorGlobal: number | null;
  dataAssinatura: string | null;
  dataInicioVigencia: string | null;
  dataFimVigencia: string | null;
  linkPncp: string;
}

export interface AgregadoOrgaoAno {
  orgaoSigla: string;
  ano: number;
  quantidade: number;
  valorTotal: number;
}

export interface PncpMgJson {
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

function getDados(): PncpMgJson {
  try {
    return carregarJsonEtl<PncpMgJson>("pncp-mg.json");
  } catch {
    return {
      coletadoEm: null,
      coletaPendente: true,
      motivoPendencia: "API do PNCP indisponível",
      fonte: "https://pncp.gov.br/",
      via: "",
      escopo: {
        orgaos: [
          { sigla: "SEMAD", nome: "Secretaria de Estado de Meio Ambiente e Desenvolvimento Sustentável", cnpj: "00957404000178" },
          { sigla: "FEAM", nome: "Fundação Estadual do Meio Ambiente", cnpj: "25455858000171" },
          { sigla: "IEF", nome: "Instituto Estadual de Florestas", cnpj: "18746164000128" },
          { sigla: "IGAM", nome: "Instituto Mineiro de Gestão das Águas", cnpj: "17387481000132" },
        ],
        contratos: "planejado: completo, 2021 até o ano corrente",
        licitacoes: "planejado: PARCIAL, só modalidade 6 (Pregão Eletrônico)",
      },
      contratosCombinacoesIncompletas: [],
      licitacoesPaginasVarridas: 0,
      licitacoesTetoAtingido: false,
      contratos: { total: 0, valorGlobalTotal: 0, periodoInicio: null, periodoFim: null, linhaCruaOmitida: false, linhas: [], porOrgaoEAno: [] },
      licitacoes: { total: 0, valorHomologadoOuEstimadoTotal: 0, porOrgao: [] },
    };
  }
}

const DADOS_PNCP = getDados();

export function lerPncpMgContratos(): ContratoPncpMg[] {
  return DADOS_PNCP.contratos.linhas;
}

/** Vazio quando `linhaCruaOmitida` é `true` (passou de 2.000 contratos
 *  dedupe) OU quando a coleta ainda está pendente — checar as duas flags em
 *  `COBERTURA_PNCP_MG` antes de tratar "vazio" como "sem contrato nenhum". */
export const PNCP_MG_CONTRATOS: ContratoPncpMg[] = DADOS_PNCP.contratos.linhas;

export const PNCP_MG_CONTRATOS_POR_ORGAO_E_ANO: AgregadoOrgaoAno[] = DADOS_PNCP.contratos.porOrgaoEAno;

export const PNCP_MG_LICITACOES_POR_ORGAO: AgregadoOrgaoAno[] = DADOS_PNCP.licitacoes.porOrgao;

export const ORGAOS_AMBIENTAIS_PNCP_MG: OrgaoAmbientalPncpMg[] = DADOS_PNCP.escopo.orgaos;

/** Importe ISTO em página de servidor, nunca `PNCP_MG_CONTRATOS` direto
 *  (regra de payload — `docs/AGENTS.md`). */
export const COBERTURA_PNCP_MG = {
  coletadoEm: DADOS_PNCP.coletadoEm,
  coletaPendente: DADOS_PNCP.coletaPendente,
  motivoPendencia: DADOS_PNCP.motivoPendencia,
  fonte: DADOS_PNCP.fonte,
  escopoContratos: DADOS_PNCP.escopo.contratos,
  escopoLicitacoes: DADOS_PNCP.escopo.licitacoes,
  combinacoesIncompletas: DADOS_PNCP.contratosCombinacoesIncompletas,
  contratos: {
    total: DADOS_PNCP.contratos.total,
    valorGlobalTotal: DADOS_PNCP.contratos.valorGlobalTotal,
    periodoInicio: DADOS_PNCP.contratos.periodoInicio,
    periodoFim: DADOS_PNCP.contratos.periodoFim,
    linhaCruaOmitida: DADOS_PNCP.contratos.linhaCruaOmitida,
  },
  licitacoes: {
    /** Total ACHADO na fatia varrida (modalidade 6, ano corrente, BH) — não
     *  o total real de licitações dos 4 órgãos. Ver docstring. */
    total: DADOS_PNCP.licitacoes.total,
    valorHomologadoOuEstimadoTotal: DADOS_PNCP.licitacoes.valorHomologadoOuEstimadoTotal,
    paginasVarridas: DADOS_PNCP.licitacoesPaginasVarridas,
    tetoAtingido: DADOS_PNCP.licitacoesTetoAtingido,
  },
} as const;
