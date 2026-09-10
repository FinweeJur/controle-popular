/**
 * apps/web/lib/judiciario/contatos-tipos.ts
 *
 * Tipos e interfaces para a Central Nacional de Contatos do Judiciário:
 * Varas, Gabinetes e Secretarias (Justiça Estadual, Federal e do Trabalho).
 */

export type RamoJustica = "Estadual" | "Federal" | "Trabalho";

export type TipoUnidade =
  | "Vara"
  | "Gabinete"
  | "Secretaria"
  | "Juizado Especial"
  | "CEJUSC"
  | "Turma Recursal";

export interface CoordenadorUnidade {
  cargo: string;
  nome: string;
}

/** Designação do titular (nome no cargo), com o ato oficial que a
 *  público — alimentado pelo coletor de atos de pessoal. Campo opcional
 *  de propósito: unidade sem informação confirmada não quebra a página. */
export interface DesignacaoTitular {
  nome: string;
  cargo: string;
  /** Número/identificação do ato (portaria, decreto, resolução…). */
  ato?: string;
  /** Data da designação/publicação (ISO yyyy-mm-dd). */
  data?: string;
  /** Link para o ato na fonte oficial. */
  urlFonte?: string;
  /** Data prevista de fim do exercício/permâência (ISO), quando houver. */
  dataFim?: string;
}

export interface UnidadeJudiciaria {
  id: string;
  tribunalSigla: string;
  ramo: RamoJustica;
  tipo: TipoUnidade;
  nome: string;
  comarcaOuSubsecao: string;
  uf: string;
  coordenador: CoordenadorUnidade;
  designacao?: DesignacaoTitular;
  telefone: string;
  whatsappBalcao?: string;
  email: string;
  endereco: string;
  linkBalcaoVirtual: string;
  horarioAtendimento?: string;
}

export interface ResumoEstatisticasContatos {
  totalUnidades: number;
  totalVaras: number;
  totalGabinetes: number;
  totalSecretarias: number;
  totalComarcas: number;
  ufsAtendidas: number;
  totalBalcoesVirtuais: number;
  porRamo: {
    estadual: number;
    federal: number;
    trabalho: number;
  };
}
