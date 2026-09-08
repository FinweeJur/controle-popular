/**
 * apps/web/lib/telefonia/cobertura.ts
 *
 * Modulo de consulta e indicadores de cobertura de telefonia celular (SMP)
 * baseados nos dados oficiais de licenciamento de estacoes da Anatel (Mosaico).
 */

import dadosTelefonia from "@/data/telefonia-municipios-mg.json";

export interface OperadoraCobertura {
  operadora: string;
  torres: number;
  pct: number;
  geracao_max: string;
}

export interface CoberturaMunicipal {
  municipio: string;
  total_torres: number;
  tem_5g: boolean;
  lider: OperadoraCobertura | null;
  ranking: OperadoraCobertura[];
}

const DADOS_MUNICIPIOS = dadosTelefonia as Record<string, CoberturaMunicipal>;

/**
 * Retorna as estatisticas de cobertura de celular de um municipio por codigo IBGE.
 * Retorna null caso o municipio nao conste na base (ex.: fora de MG ou invalido).
 */
export function obterCoberturaTelefonia(idMunicipio: string | number): CoberturaMunicipal | null {
  const cod = String(idMunicipio).trim();
  return DADOS_MUNICIPIOS[cod] ?? null;
}

/**
 * Retorna a lista ordenada de operadoras com presenca no municipio.
 */
export function obterRankingOperadoras(idMunicipio: string | number): OperadoraCobertura[] {
  const cob = obterCoberturaTelefonia(idMunicipio);
  return cob ? cob.ranking : [];
}
