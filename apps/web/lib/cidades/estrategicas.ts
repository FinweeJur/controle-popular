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

/** Localiza município por slug ou por código IBGE (7 ou 6 dígitos). */
export function obterCidadePorSlugOuId(slugOuId: string): CidadeEstrategica | undefined {
  const termo = slugOuId.trim().toLowerCase();
  const cidades = listarCidadesEstrategicas();
  return cidades.find(
    (c) =>
      (c.slug && c.slug.toLowerCase() === termo) ||
      c.id_municipio === termo ||
      c.datasus_6dig === termo
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

export interface PibAno {
  ano: number;
  pib_total: number;
  impostos_liquidos?: number;
  valor_adicionado_bruto?: number;
}

export interface PibMunicipal {
  fonte: string;
  municipio: string;
  total_anos: number;
  pib: PibAno[];
}

export function obterPibMunicipal(idMunicipio: string): PibMunicipal | null {
  const caminhos = [
    path.resolve(process.cwd(), "data", `pib-municipal-${idMunicipio}.json`),
    path.resolve(process.cwd(), "apps", "web", "data", `pib-municipal-${idMunicipio}.json`),
  ];
  for (const c of caminhos) {
    if (fs.existsSync(c)) {
      try {
        return JSON.parse(fs.readFileSync(c, "utf-8")) as PibMunicipal;
      } catch {
        return null;
      }
    }
  }
  return null;
}

export interface CidadeCompleta {
  id_municipio: string;
  datasus_6dig: string;
  nome: string;
  uf: string;
  regiao: RegiaoBrasil;
  tipo: TipoCidade;
  slug: string;
  populacao: number;
  pib_mais_recente_bi: number;
  pib_per_capita_reais: number;
  repasses_federais_anuais_mi: number;
  saude_estabelecimentos: number;
  escolas_total: number;
  cnpj_prefeitura: string;
  cnpj_camara: string;
  prefeitura_host: string;
  camara_host: string;
  camara_sistema: string;
  diario_oficial: string;
  lat: number | null;
  lng: number | null;
  serie_pib: PibAno[];
}

let cacheCidadesCompletas: Record<string, CidadeCompleta> | null = null;

export function obterBancoCidadesCompletas(): Record<string, CidadeCompleta> {
  if (cacheCidadesCompletas) return cacheCidadesCompletas;

  const caminhos = [
    path.resolve(process.cwd(), "data", "cidades-dados-completos.json"),
    path.resolve(process.cwd(), "apps", "web", "data", "cidades-dados-completos.json"),
    path.resolve(__dirname, "..", "..", "data", "cidades-dados-completos.json"),
  ];

  for (const c of caminhos) {
    if (fs.existsSync(c)) {
      try {
        const raw = fs.readFileSync(c, "utf-8");
        const parsed = JSON.parse(raw);
        cacheCidadesCompletas = parsed.cidades as Record<string, CidadeCompleta>;
        return cacheCidadesCompletas;
      } catch {
        // segue para proximo caminho
      }
    }
  }
  return {};
}

export function obterDadosCompletosCidade(slugOuId: string): CidadeCompleta | null {
  const banco = obterBancoCidadesCompletas();
  const termo = slugOuId.trim().toLowerCase();

  for (const [ibge, c] of Object.entries(banco)) {
    if (
      ibge === termo ||
      c.datasus_6dig === termo ||
      (c.slug && c.slug.toLowerCase() === termo) ||
      c.nome.toLowerCase() === termo
    ) {
      return c;
    }
  }
  return null;
}

export function listarTodasCidadesCompletas(): CidadeCompleta[] {
  const banco = obterBancoCidadesCompletas();
  return Object.values(banco);
}
