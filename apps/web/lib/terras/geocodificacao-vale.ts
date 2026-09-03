/**
 * lib/terras/geocodificacao-vale.ts
 *
 * Implementa a geocodificação dos dados do monitoramento da Vale e do
 * Acordo de Reparação de Brumadinho conforme PLANO-GEOCODIFICACAO.md:
 * - Join com polígonos municipais (municipios-mg.geojson) por código IBGE (7 dígitos).
 * - Georreferenciamento de pontos de monitoramento, estruturas e obras.
 * - Registro em padrão GeoJSON FeatureCollection para consumo no globo 3D e mapas.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { MUNICIPIOS_EXECUCAO_FGV } from "@/lib/paraopeba/execucao-fgv-dados";

export interface FeatureGeoJSON {
  type: "Feature";
  geometry: {
    type: "Point" | "Polygon" | "MultiPolygon";
    coordinates: any;
  };
  properties: Record<string, any>;
}

export interface FeatureCollectionGeoJSON {
  type: "FeatureCollection";
  features: FeatureGeoJSON[];
}

/** Mapa de códigos IBGE de 7 dígitos para os 26 municípios da Bacia do Paraopeba (Anexos I.3 e I.4). */
export const CODIGOS_IBGE_BACIA_PARAOPEBA: Record<string, string> = {
  "Abaeté": "3100203",
  "Betim": "3106705",
  "Biquinhas": "3107000",
  "Brumadinho": "3109006",
  "Caetanópolis": "3109907",
  "Curvelo": "3120904",
  "Esmeraldas": "3124104",
  "Felixlândia": "3125705",
  "Florestal": "3126000",
  "Fortuna de Minas": "3126406",
  "Igarapé": "3130101",
  "Juatuba": "3136652",
  "Maravilhas": "3139805",
  "Mário Campos": "3140159",
  "Mateus Leme": "3140704",
  "Morada Nova de Minas": "3143500",
  "Paineiras": "3146404",
  "Papagaios": "3146701",
  "Pará de Minas": "3147105",
  "Paraopeba": "3147501",
  "Pequi": "3150208",
  "Pompéu": "3152006",
  "São Gonçalo do Abaeté": "3161809",
  "São Joaquim de Bicas": "3162922",
  "São José da Varginha": "3163102",
  "Três Marias": "3169307",
};

/**
 * Coordenadas pontuais oficiais das principais estruturas e monitoramentos
 * da Vale na reparação do Paraopeba (lat/long WGS84).
 */
export const PONTOS_MONITORAMENTO_VALE = [
  {
    id: "VALE-EST-01",
    nome: "Cortina de Estacas Pranchas — Córrego do Feijão",
    tipo: "Estrutura de Contenção",
    municipio: "Brumadinho",
    ibge: "3109006",
    lat: -20.1214,
    lng: -44.1205,
    situacao: "Operacional",
    descricao: "Retenção mecânica de sedimentos remanescentes no vale do Córrego do Feijão.",
  },
  {
    id: "VALE-EST-02",
    nome: "Dique 1 — B1 Córrego do Feijão",
    tipo: "Dique de Sedimentos",
    municipio: "Brumadinho",
    ibge: "3109006",
    lat: -20.1287,
    lng: -44.1242,
    situacao: "Operacional",
    descricao: "Contenção intermediária para estabilização de encosta e rejeitos carreados.",
  },
  {
    id: "VALE-ETA-01",
    nome: "Estação de Tratamento de Água Fluvial (ETAF) — Alberto Flores",
    tipo: "Tratamento de Água",
    municipio: "Brumadinho",
    ibge: "3109006",
    lat: -20.1432,
    lng: -44.1561,
    situacao: "Operacional",
    descricao: "Desassoreamento e clarificação da água do Rio Paraopeba.",
  },
  {
    id: "VALE-CAP-01",
    nome: "Nova Captação Subterrânea do Rio Manso / Paraopeba",
    tipo: "Segurança Hídrica",
    municipio: "Brumadinho",
    ibge: "3109006",
    lat: -20.1102,
    lng: -44.1804,
    situacao: "Concluída",
    descricao: "Sistema alternativo de adução para o abastecimento da Região Metropolitana de BH.",
  },
  {
    id: "VALE-MON-01",
    nome: "Ponto Telemétrico PM-01 (Juatuba)",
    tipo: "Estação de Qualidade da Água",
    municipio: "Juatuba",
    ibge: "3136652",
    lat: -19.9511,
    lng: -44.3418,
    situacao: "Ativo",
    descricao: "Sonda multiparâmetros contínua de turbidez, oxigênio dissolvido e metais.",
  },
  {
    id: "VALE-MON-02",
    nome: "Ponto Telemétrico PM-02 (São Joaquim de Bicas)",
    tipo: "Estação de Qualidade da Água",
    municipio: "São Joaquim de Bicas",
    ibge: "3162922",
    lat: -20.0489,
    lng: -44.2711,
    situacao: "Ativo",
    descricao: "Monitoramento de qualidade e vazão a jusante da confluência do Córrego Ferro-Carvão.",
  },
  {
    id: "VALE-MON-03",
    nome: "Ponto Telemétrico PM-03 (Betim — Represa de Várzea das Flores)",
    tipo: "Estação Hidrológica",
    municipio: "Betim",
    ibge: "3106705",
    lat: -19.9123,
    lng: -44.1678,
    situacao: "Ativo",
    descricao: "Monitoramento de proteção do manancial da RMBH.",
  },
];

/**
 * Gera a camada GeoJSON de pontos de monitoramento e estruturas da Vale.
 */
export function gerarGeoJsonMonitoramentoVale(): FeatureCollectionGeoJSON {
  const features: FeatureGeoJSON[] = PONTOS_MONITORAMENTO_VALE.map((p) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [p.lng, p.lat],
    },
    properties: {
      id: p.id,
      nome: p.nome,
      tipo: p.tipo,
      municipio: p.municipio,
      id_municipio: p.ibge,
      situacao: p.situacao,
      descricao: p.descricao,
      fonte: "Auditoria FGV e Monitoramento Vale S.A.",
    },
  }));

  return {
    type: "FeatureCollection",
    features,
  };
}

/**
 * Cruza os investimentos municipais do Acordo de Reparação com código IBGE.
 */
export function cruzarInvestimentosValeComIbge() {
  return MUNICIPIOS_EXECUCAO_FGV.map((m) => {
    const ibge = CODIGOS_IBGE_BACIA_PARAOPEBA[m.municipio] || null;
    return {
      municipio: m.municipio,
      id_municipio: ibge,
      acordoInicial: m.acordoInicial,
      acordoAtual: m.acordoAtual,
      empenhosAutorizados: m.empenhosAutorizados,
      saldoTeto: m.saldoTeto,
      taxaEmpenhoPct: m.acordoAtual > 0 ? Math.round((m.empenhosAutorizados / m.acordoAtual) * 100) : 0,
    };
  });
}
