/**
 * Tipos para o sistema de dados de universidades, grupos de pesquisa e projetos de extensão.
 * Baseado nas especificações do contrato para expansão do índice.
 */

export interface Instituicao {
  sigla: string;
  nome: string;
  tipo: 'Universidade' | 'Instituto Federal' | 'Centro Universitário' | 'Faculdade' | 'Instituto de Ensino Superior';
  uf: string;
  municipios: string[];
  contatos: {
    email?: string;
    telefone?: string;
    endereco?: string;
    site?: string;
  };
  links: {
    site?: string;
    lattes?: string;
    sisu?: string;
    campusVirtual?: string;
  };
  fonteUrl: string;
  dataAcesso: string;
}

export interface UnidadeAcademica {
  sigla: string;
  nome: string;
  campus: string;
  site?: string;
  instituicao: string;
}

export interface Coordenador {
  nome: string;
  lattes?: string;
  email?: string;
  cpf?: string;
}

export interface AreaConhecimento {
  codigo: string;
  nome: string;
  grandeArea: string;
}

export interface GrupoPesquisa {
  id: string;
  sigla: string;
  nome: string;
  areaConhecimento: AreaConhecimento;
  grandeArea: string;
  instituicao: string;
  unidade: string;
  coordenadores: Coordenador[];
  projetos: string[]; // IDs dos projetos
  fonteUrl: string;
}

export interface ProjetoExtensao {
  id: string;
  sigla: string;
  nome: string;
  areaConhecimento: AreaConhecimento;
  grandeArea: string;
  instituicao: string;
  unidade: string;
  coordenadores: Coordenador[];
  grupo?: string; // ID do grupo de pesquisa vinculado
  fonteUrl: string;
}

export interface TemaDerivado {
  areas: AreaConhecimento[];
  grandesAreas: string[];
}

export interface DadosEstado {
  uf: string;
  instituicoes: Instituicao[];
  unidades: UnidadeAcademica[];
  grupos: GrupoPesquisa[];
  projetos: ProjetoExtensao[];
  temas: TemaDerivado;
  fontesUsadas: {
    nome: string;
    url: string;
    tipo: 'cnpq' | 'capes' | 'portal' | 'ministerio';
  }[];
  lacunas: string[];
}

export interface UniversidadesIndex {
  estados: string[];
  totalInstituicoes: number;
  totalGrupos: number;
  totalProjetos: number;
  ultimaAtualizacao: string;
}