/**
 * Licenciamento e Fiscalização Federal do IBAMA em Minas Gerais
 *
 * Lê `apps/web/data/ibama-mg.json` gerado pelo coletor `scripts/coletar-ibama-mg.mts`.
 */

import bruto from "../../data/ibama-mg.json";

export interface LicencaIbama {
  id: string;
  numeroProcesso: string;
  numeroLicenca: string;
  tipoLicenca: string;
  empreendimento: string;
  municipio: string;
  uf: string;
  dataEmissao: string;
  dataValidade: string | null;
  situacao: string;
  atividade: string;
}

export interface InfracaoIbama {
  id: string;
  numeroAuto: string;
  infrator: string;
  municipio: string;
  uf: string;
  dataLavratura: string;
  valorMulta: number;
  tipoInfracao: string;
  statusJulgamento: string;
  valorPago?: number;
}

export interface ArquivoIbamaMg {
  fonte: string;
  urlFonte: string;
  coletadoEm: string;
  totalLicencas: number;
  totalInfracoes: number;
  resumo: {
    licencasVigentes: number;
    montanteMultas: number;
    municipiosAtendidos: number;
    licencasPorTipo: Record<string, number>;
    infracoesPorStatus: Record<string, number>;
  };
  licencas: LicencaIbama[];
  infracoes: InfracaoIbama[];
}

const ARQUIVO = bruto as unknown as ArquivoIbamaMg;

export const LICENCAS_IBAMA: LicencaIbama[] = ARQUIVO.licencas;
export const INFRACOES_IBAMA: InfracaoIbama[] = ARQUIVO.infracoes;

export const COBERTURA_IBAMA_MG = {
  fonte: ARQUIVO.fonte,
  urlFonte: ARQUIVO.urlFonte,
  coletadoEm: ARQUIVO.coletadoEm,
  totalLicencas: ARQUIVO.totalLicencas,
  totalInfracoes: ARQUIVO.totalInfracoes,
  licencasVigentes: ARQUIVO.resumo.licencasVigentes,
  montanteMultas: ARQUIVO.resumo.montanteMultas,
  municipiosAtendidos: ARQUIVO.resumo.municipiosAtendidos,
  licencasPorTipo: Object.entries(ARQUIVO.resumo.licencasPorTipo).map(([tipo, total]) => ({
    tipo,
    total: Number(total),
  })),
  infracoesPorStatus: Object.entries(ARQUIVO.resumo.infracoesPorStatus).map(([status, total]) => ({
    status,
    total: Number(total),
  })),
} as const;
