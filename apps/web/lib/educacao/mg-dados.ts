/**
 * Dados educacionais de MG — IBGE e INEP.
 *
 * Lê `apps/web/data/educacao-ibge-mg.json` (lista de municípios com código IBGE)
 * e `apps/web/data/educacao-inep-mg.json` (indicadores do Censo Escolar e IDEB).
 *
 * Usado para enriquecer a seção de educação com dados reais.
 */

import ibgeBruto from "@/data/educacao-ibge-mg.json";
import inepBruto from "@/data/educacao-inep-mg.json";

export interface MunicipioIbge {
  codigo_ibge: string;
  municipio: string;
}

export interface DadosInepMunicipio {
  codigo_ibge: string;
  municipio: string;
  populacao_estimada: number;
  escolas_publicas: number;
  escolas_privadas: number;
  matriculas_fundamental: number;
  matriculas_medio: number;
  ideb_anos_iniciais: number | null;
  ideb_anos_finais: number | null;
  ideb_projetado_2025: number | null;
  taxa_aprovacao_fundamental: number | null;
  taxa_reprovacao_fundamental: number | null;
  taxa_abandono_fundamental: number | null;
  matriculas_2022: number;
  matriculas_2023: number;
  docentes_fundamental: number;
  docentes_medio: number;
  escolas_infraestrutura_internet: number;
  escolas_infraestrutura_biblioteca: number;
  fonte: string;
}

export interface DadosEducacaoMg {
  municipios: MunicipioIbge[];
  indicadores: DadosInepMunicipio[];
  metadata: {
    titulo: string;
    descricao: string;
    fontes: string[];
    url_fontes: string[];
    campos: Record<string, string>;
    data_atualizacao: string;
    observacoes: string[];
  };
}

let cache: DadosEducacaoMg | null = null;

export function carregarDadosEducacaoMg(): DadosEducacaoMg {
  if (cache) return cache;

  const indicadores = (inepBruto as { municipios?: DadosInepMunicipio[] }).municipios ?? [];
  const metadata = (inepBruto as { metadata?: DadosEducacaoMg["metadata"] }).metadata ?? {
    titulo: "Dados Educacionais - Minas Gerais",
    descricao: "Indicadores de educação básica dos principais municípios de MG",
    fontes: [],
    url_fontes: [],
    campos: {},
    data_atualizacao: "",
    observacoes: [],
  };

  cache = {
    municipios: ibgeBruto as MunicipioIbge[],
    indicadores,
    metadata,
  };

  return cache;
}

export function obterDadosMunicipio(codigoIbge: string): DadosInepMunicipio | undefined {
  const dados = carregarDadosEducacaoMg();
  return dados.indicadores.find((m) => m.codigo_ibge === codigoIbge);
}

export function listarMunicipiosComDados(): DadosInepMunicipio[] {
  return carregarDadosEducacaoMg().indicadores;
}
