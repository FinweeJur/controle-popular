/**
 * lib/clima/bases-risco.ts
 *
 * Módulo de consulta e integração das bases oficiais de clima e risco:
 * - BATER (IBGE/CEMADEN): População em áreas de risco;
 * - CEMADEN: Pluviômetros e acumulado de chuvas;
 * - INMET: Avisos meteorológicos de severidade;
 * - INPE Queimadas: Focos de calor e risco de fogo;
 * - MDR/SNIS + ANA: Saneamento e tratamento de esgoto;
 * - MapBiomas: Cobertura e uso da terra.
 */

import * as fs from "node:fs";
import * as path from "node:path";

export interface FonteClimaRisco {
  id: string;
  nome: string;
  orgao: string;
  tipo_dado: string;
  granularidade: string;
  link_oficial: string;
  metodologia: string;
  ressalva: string;
}

export interface MunicipioRisco {
  id_municipio: string;
  nome: string;
  uf: string;
  populacao_area_risco: number;
  percentual_populacao_risco: number;
  poligonos_bater: number;
  tipo_risco_predominante: string;
  estacoes_cemaden: number;
  cobertura_esgoto_tratado_pct: number;
  cobertura_vegetal_nativa_pct: number;
  alerta_inmet_ativo: string;
  risco_fogo_inpe: "Baixo" | "Médio" | "Alto" | "Crítico";
}

export interface CatalogoClimaRisco {
  gerado_em: string;
  fonte: string;
  estatisticas_gerais: {
    total_poligonos_bater_brasil: number;
    total_poligonos_bater_mg: number;
    populacao_risco_mg: number;
    estacoes_pluvio_mg: number;
    municipios_monitorados_bater_mg: number;
  };
  fontes_oficiais: FonteClimaRisco[];
  municipios_destaque_risco: MunicipioRisco[];
}

let cacheBases: CatalogoClimaRisco | null = null;

function resolverCaminhoJson(): string {
  const caminhos = [
    path.resolve(process.cwd(), "data", "bases-clima-risco.json"),
    path.resolve(process.cwd(), "apps", "web", "data", "bases-clima-risco.json"),
    path.resolve(__dirname, "..", "..", "data", "bases-clima-risco.json"),
  ];

  for (const c of caminhos) {
    if (fs.existsSync(c)) return c;
  }
  return caminhos[0];
}

export function carregarBasesClimaRisco(): CatalogoClimaRisco {
  if (cacheBases) return cacheBases;

  const jsonPath = resolverCaminhoJson();
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Arquivo bases-clima-risco.json não encontrado em: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  cacheBases = JSON.parse(raw) as CatalogoClimaRisco;
  return cacheBases;
}

/** Retorna a lista das 6 fontes oficiais integradas. */
export function listarFontesClimaRisco(): FonteClimaRisco[] {
  return carregarBasesClimaRisco().fontes_oficiais;
}

/** Retorna os municípios monitorados com métricas reais de risco. */
export function listarMunicipiosRisco(): MunicipioRisco[] {
  return carregarBasesClimaRisco().municipios_destaque_risco;
}

/** Localiza dados de risco por código IBGE (7 ou 6 dígitos). */
export function obterRiscoPorIbge(idMunicipio: string): MunicipioRisco | undefined {
  const itens = listarMunicipiosRisco();
  const idNorm = idMunicipio.slice(0, 6);
  return itens.find(
    (m) => m.id_municipio === idMunicipio || m.id_municipio.startsWith(idNorm)
  );
}

/** Estatísticas macro da vulnerabilidade climática e de risco. */
export function obterEstatisticasMacroRisco() {
  const dados = carregarBasesClimaRisco();
  return dados.estatisticas_gerais;
}
