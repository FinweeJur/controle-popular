/**
 * Tipos para o catálogo institucional de todas as esferas:
 * Executivo (Ministérios, Secretarias Estaduais e Municipais),
 * Legislativo (Câmara, Senado, Assembleias, Câmaras Municipais),
 * Judiciário (Tribunais Superiores e Estaduais),
 * Sistema de Justiça (Ministério Público e Defensoria Pública).
 */

export interface LiderancaInstituicao {
  cargo: string;
  nome: string;
  mandato: string;
  investidura: string;
}

export interface EstruturaPessoalInstituicao {
  servidoresEfetivos: string;
  comissionados: string;
  estagiariosETerceirizados: string;
  magistrados?: string;
  comarcasInstaladas?: string;
}

export interface OrcamentoInstituicao {
  ano: number;
  total: string;
  folhaPessoal: string;
  custeioInvestimentos: string;
  fundoEspecial?: string;
  impactoLRF?: string;
}

export interface OrganogramaItem {
  area: string;
  funcao: string;
  site?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

export interface OuvidoriaContato {
  canal: string;
  telefone: string;
  endereco: string;
  email: string;
  portal?: string;
  sic?: string;
  balcaoVirtual?: string;
}

export interface CorregedoriaInstituicao {
  orgao: string;
  titular: string;
  funcao: string;
  canalDenuncias: string;
}

export interface NoticiaInstituicao {
  titulo: string;
  data: string;
  fonte: string;
  url: string;
  resumo?: string;
}

export interface DocumentoChaveInstituicao {
  titulo: string;
  descricao: string;
  url: string;
}

export type PoderPublico = "Executivo" | "Legislativo" | "Judiciário" | "Sistema de Justiça";
export type EsferaGoverno = "Federal" | "Estadual" | "Municipal";

export interface InstituicaoDetalhe {
  sigla: string;
  nome: string;
  esfera: EsferaGoverno;
  poder: PoderPublico;
  tipo: string;
  icone: string;
  cor: string;
  lideranca: LiderancaInstituicao;
  estruturaPessoal: EstruturaPessoalInstituicao;
  orcamento: OrcamentoInstituicao;
  organograma: OrganogramaItem[];
  funcoes: string[];
  ouvidoria: OuvidoriaContato;
  corregedoria?: CorregedoriaInstituicao;
  documentosChave: DocumentoChaveInstituicao[];
  noticias: NoticiaInstituicao[];
}
