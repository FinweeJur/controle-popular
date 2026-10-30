import { DadosEstado, UniversidadesIndex } from './tipos';

/**
 * Índice centralizado de dados de universidades por estado.
 * Mantém a lista de estados cobertos e estatísticas gerais.
 */

const ESTADOS_COBERTOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const INDEX: UniversidadesIndex = {
  estados: ESTADOS_COBERTOS,
  totalInstituicoes: 0,
  totalGrupos: 0,
  totalProjetos: 0,
  ultimaAtualizacao: new Date().toISOString().split('T')[0]
};

/**
 * Retorna os dados de um estado específico.
 * @param uf Sigla do estado (ex: 'MG', 'SP', 'RJ')
 */
export function obterDadosEstado(uf: string): DadosEstado | null {
  try {
    // Importação dinâmica para evitar carregamento de todos os estados de uma vez
    const dados = require(`./dados-${uf.toLowerCase()}.ts`);
    return dados.default || dados;
  } catch (error) {
    console.warn(`Dados para o estado ${uf} não encontrados`);
    return null;
  }
}

/**
 * Retorna todos os estados que possuem dados disponíveis.
 */
export function listarEstadosDisponiveis(): string[] {
  return ESTADOS_COBERTOS.filter(uf => {
    try {
      require(`./dados-${uf.toLowerCase()}.ts`);
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * Retorna o índice geral do sistema de universidades.
 */
export function obterIndex(): UniversidadesIndex {
  return INDEX;
}

/**
 * Busca instituições por nome ou sigla.
 * @param termo Termo de busca
 * @param uf Estado específico (opcional)
 */
export function buscarInstituicoes(termo: string, uf?: string): Instituicao[] {
  const termoLower = termo.toLowerCase();
  const resultados: Instituicao[] = [];
  
  const estadosParaBuscar = uf ? [uf] : listarEstadosDisponiveis();
  
  for (const estado of estadosParaBuscar) {
    const dados = obterDadosEstado(estado);
    if (dados) {
      for (const instituicao of dados.instituicoes) {
        if (
          instituicao.sigla.toLowerCase().includes(termoLower) ||
          instituicao.nome.toLowerCase().includes(termoLower)
        ) {
          resultados.push(instituicao);
        }
      }
    }
  }
  
  return resultados;
}

/**
 * Busca grupos de pesquisa por área do conhecimento.
 * @param area Área do conhecimento
 * @param uf Estado específico (opcional)
 */
export function buscarGruposPorArea(area: string, uf?: string): GrupoPesquisa[] {
  const areaLower = area.toLowerCase();
  const resultados: GrupoPesquisa[] = [];
  
  const estadosParaBuscar = uf ? [uf] : listarEstadosDisponiveis();
  
  for (const estado of estadosParaBuscar) {
    const dados = obterDadosEstado(estado);
    if (dados) {
      for (const grupo of dados.grupos) {
        if (
          grupo.areaConhecimento.nome.toLowerCase().includes(areaLower) ||
          grupo.grandeArea.toLowerCase().includes(areaLower)
        ) {
          resultados.push(grupo);
        }
      }
    }
  }
  
  return resultados;
}