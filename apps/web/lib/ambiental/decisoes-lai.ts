/**
 * Decisões de Recursos de LAI da CGE-MG
 *
 * Lê `apps/web/data/decisoes-cge-lai.json` gerado pelo coletor `scripts/coletar-decisoes-cge-mg.mts`.
 */

import bruto from "../../data/decisoes-cge-lai.json";

export interface DecisaoLaiCge {
  id: string;
  numeroRecurso: string;
  ano: number;
  orgaoDemandado: string;
  tipoDecisao: string;
  dataDecisao: string;
  relator: string;
  resumoEmenta: string;
}

export interface ArquivoDecisoesLai {
  fonte: string;
  urlFonte: string;
  coletadoEm: string;
  totalDecisoes: number;
  totalProvimentos: number;
  taxaNaoConhecimentoOuDesprovimento: number;
  distribuicaoPorAno: Array<{
    ano: number;
    total: number;
    desprovimento?: number;
    naoConhecimento?: number;
    perdaObjeto?: number;
    perdaParcial?: number;
    provimento?: number;
    provimentoParcial?: number;
  }>;
  decisoes: DecisaoLaiCge[];
}

const ARQUIVO = bruto as unknown as ArquivoDecisoesLai;

export const DECISOES_LAI_CGE: DecisaoLaiCge[] = ARQUIVO.decisoes;

export const COBERTURA_DECISOES_LAI_CGE = {
  fonte: ARQUIVO.fonte,
  urlFonte: ARQUIVO.urlFonte,
  coletadoEm: ARQUIVO.coletadoEm,
  totalDecisoes: ARQUIVO.totalDecisoes,
  totalProvimentos: ARQUIVO.totalProvimentos,
  taxaNaoConhecimentoOuDesprovimento: ARQUIVO.taxaNaoConhecimentoOuDesprovimento,
  distribuicaoPorAno: ARQUIVO.distribuicaoPorAno,
} as const;
