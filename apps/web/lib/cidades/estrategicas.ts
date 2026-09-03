/**
 * lib/cidades/estrategicas.ts
 *
 * Módulo de consulta e indexação das 199 cidades estratégicas do Brasil
 * (27 capitais estaduais/DF + 172 polos regionais do interior).
 *
 * Dados auditados conforme o runbook de expansão e API de Localidades do IBGE.
 */

import * as fs from "node:fs";
import * as path from "node:path";

export type RegiaoBrasil = "Norte" | "Nordeste" | "Centro-Oeste" | "Sudeste" | "Sul";
export type TipoCidade = "capital" | "polo-interior";

export interface CidadeEstrategica {
  id_municipio: string;       // Código IBGE de 7 dígitos
  nome: string;
  uf: string;
  regiao: RegiaoBrasil;
  tipo: TipoCidade;
  datasus_6dig: string;       // Código DATASUS de 6 dígitos (sem DV)
  cnpj_prefeitura: string | null;
  cnpj_camara: string | null;
  camara_sistema: string | null;
  camara_coletor: string | null;
  camara_host: string | null;
  prefeitura_host: string | null;
  prefeitura_dados_abertos_api: string | null;
  prefeitura_dados_abertos_host: string | null;
  diario_oficial: string | null;
  estado_municipios_count: number;
  lat: number | null;
  lng: number | null;
  nome_portal: string;
  slug: string | null;
  ativo: boolean;
}

export interface CatalogoCidadesEstrategicas {
  gerado_em: string;
  fonte: string;
  total: number;
  por_regiao: Record<RegiaoBrasil, number>;
  por_tipo: Record<TipoCidade, number>;
  cidades: CidadeEstrategica[];
}

let cacheCatalogo: CatalogoCidadesEstrategicas | null = null;

function resolverCaminhoJson(): string {
  // apps/web/data/cidades-estrategicas.json
  const caminhos = [
    path.resolve(process.cwd(), "data", "cidades-estrategicas.json"),
    path.resolve(process.cwd(), "apps", "web", "data", "cidades-estrategicas.json"),
    path.resolve(__dirname, "..", "..", "data", "cidades-estrategicas.json"),
  ];

  for (const c of caminhos) {
    if (fs.existsSync(c)) return c;
  }
  return caminhos[0];
}

export function carregarCatalogoCidades(): CatalogoCidadesEstrategicas {
  if (cacheCatalogo) return cacheCatalogo;

  const jsonPath = resolverCaminhoJson();
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Arquivo cidades-estrategicas.json não encontrado em: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  cacheCatalogo = JSON.parse(raw) as CatalogoCidadesEstrategicas;
  return cacheCatalogo;
}

/** Retorna a lista completa das 199 cidades estratégicas. */
export function listarCidadesEstrategicas(): CidadeEstrategica[] {
  return carregarCatalogoCidades().cidades;
}

/** Localiza município pelo código IBGE de 7 dígitos ou de 6 dígitos. */
export function obterCidadePorIbge(idMunicipio: string): CidadeEstrategica | undefined {
  const cidades = listarCidadesEstrategicas();
  return cidades.find(
    (c) => c.id_municipio === idMunicipio || c.datasus_6dig === idMunicipio
  );
}

/** Retorna apenas as 27 capitais estaduais/DF. */
export function listarCapitais(): CidadeEstrategica[] {
  return listarCidadesEstrategicas().filter((c) => c.tipo === "capital");
}

/** Retorna os polos do interior de uma região específica. */
export function listarPolosPorRegiao(regiao: RegiaoBrasil): CidadeEstrategica[] {
  return listarCidadesEstrategicas().filter((c) => c.regiao === regiao);
}

/** Retorna as cidades estratégicas de uma UF. */
export function listarCidadesPorUf(uf: string): CidadeEstrategica[] {
  const ufNormalizada = uf.toUpperCase().trim();
  return listarCidadesEstrategicas().filter((c) => c.uf === ufNormalizada);
}

/** Busca cidades estratégicas por nome, UF ou código IBGE. */
export function buscarCidadesEstrategicas(termo: string): CidadeEstrategica[] {
  const termoNorm = termo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (!termoNorm) return listarCidadesEstrategicas();

  return listarCidadesEstrategicas().filter((c) => {
    const nomeNorm = c.nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return (
      nomeNorm.includes(termoNorm) ||
      c.uf.toLowerCase().includes(termoNorm) ||
      c.id_municipio.includes(termoNorm) ||
      c.datasus_6dig.includes(termoNorm)
    );
  });
}

/** Estatísticas globais do plano de expansão nacional. */
export function obterEstatisticasExpansao(): {
  totalCidades: number;
  totalCapitais: number;
  totalPolosInterior: number;
  totalEstados: number;
  distribuicaoRegiao: Record<RegiaoBrasil, number>;
} {
  const cat = carregarCatalogoCidades();
  const ufs = new Set(cat.cidades.map((c) => c.uf));

  return {
    totalCidades: cat.total,
    totalCapitais: cat.por_tipo.capital,
    totalPolosInterior: cat.por_tipo["polo-interior"],
    totalEstados: ufs.size,
    distribuicaoRegiao: cat.por_regiao,
  };
}
