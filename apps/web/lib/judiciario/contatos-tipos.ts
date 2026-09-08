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

export interface UnidadeJudiciaria {
  id: string;
  tribunalSigla: string;
  ramo: RamoJustica;
  tipo: TipoUnidade;
  nome: string;
  comarcaOuSubsecao: string;
  uf: string;
  coordenador: CoordenadorUnidade;
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
