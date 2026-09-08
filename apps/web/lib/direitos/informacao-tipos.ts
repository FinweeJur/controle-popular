/**
 * apps/web/lib/direitos/informacao-tipos.ts
 *
 * Tipagem para a central de canais de acesso à informação pública (LAI)
 * e concessionárias de serviços públicos essenciais.
 */

export type EsferaCanal = "Municipal" | "Estadual" | "Federal" | "Concessionaria";

export type CategoriaCanal =
  | "Prefeitura"
  | "Câmara Municipal"
  | "Órgão Federal"
  | "Órgão Estadual"
  | "Agência Reguladora"
  | "Água e Saneamento"
  | "Luz e Energia"
  | "Telecomunicações e Internet";

export type ServicoEssencial = "agua" | "luz" | "telecom" | null;

export interface ResponsavelCanal {
  cargo: string;
  nome: string;
}

export interface CanalInformacao {
  id: string;
  nome: string;
  sigla: string;
  esfera: EsferaCanal;
  poder: string;
  categoria: CategoriaCanal;
  servicoEssencial: ServicoEssencial;
  cidade: string;
  uf: string;
  regiao: string;
  codigoIbge: string | null;
  responsavel: ResponsavelCanal;
  telefone: string;
  email: string;
  endereco: string;
  linkPortal: string;
  tipoAtendimento: string;
  descricao: string;
}

export interface ResumoEstatisticasInformacao {
  totalGeral: number;
  porCategoria: Record<string, number>;
  porEsfera: Record<string, number>;
  porUf: Record<string, number>;
  porServicoEssencial: Record<string, number>;
}

export interface CatalogoCanaisLai {
  geradoEm: string;
  versao: string;
  fonte: string;
  totalCanais: number;
  estatisticas: ResumoEstatisticasInformacao;
  canais: CanalInformacao[];
}
