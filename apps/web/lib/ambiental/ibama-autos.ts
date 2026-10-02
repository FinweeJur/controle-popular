/**
 * @file apps/web/lib/ambiental/ibama-autos.ts
 * @description Tipos dos autos de infração do IBAMA agregados por município —
 * o retrato da fiscalização ambiental federal que enriquece `/ambiental/ibama`.
 *
 * ═══ O QUE É (AGENTS §7) ═══
 * Contagem e valor de autos lavrados pelo IBAMA, por município (código IBGE),
 * com área autuada (quando declarada em hectare) e quantos tiveram embargo.
 * Auto lavrado NÃO é condenação: cabe defesa e recurso — a tela diz isso.
 * O IBAMA publica nome e CPF/CNPJ do infrator; este acervo NÃO os copia —
 * publica só o agregado por território.
 *
 * CLIENT-SAFE: não lê arquivo. A leitura mora em
 * `lib/server-only/dados-ibama-autos.ts`.
 */

export interface AutosPorMunicipio extends Record<string, unknown> {
  cod_ibge: string;
  municipio: string;
  uf: string;
  autos: number;
  valor: number;
  area_ha: number;
  com_embargo: number;
}

export interface AcervoIbamaAutos {
  fonte: string;
  url_fonte: string;
  url_arquivo: string;
  janela: string;
  atualizado_em: string;
  metodologia: string;
  total_autos: number;
  total_valor: number;
  autos_cancelados: number;
  total_municipios: number;
  por_uf: Record<string, { autos: number; valor: number; com_embargo: number }>;
  por_ano: Record<string, { autos: number; valor: number }>;
  por_bioma: Record<string, number>;
  registros: AutosPorMunicipio[];
}
