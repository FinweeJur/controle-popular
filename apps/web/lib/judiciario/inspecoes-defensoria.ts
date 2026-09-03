/**
 * lib/judiciario/inspecoes-defensoria.ts
 *
 * Módulo de consulta e consolidação de transparência do Judiciário e Defensoria:
 * - Relatórios de Inspeção da Corregedoria Nacional (CNJ) sobre 33 órgãos (343 relatórios de 2008 a 2026).
 * - Cobertura da Defensoria Pública do Estado de Minas Gerais (DPMG) por comarca (120 atendidas / 298 total).
 */

import * as fs from "node:fs";
import * as path from "node:path";

export interface OrgaoInspecionado {
  orgao: string;
  nome: string;
  tipo: string;
  uf: string;
  total_relatorios: number;
  ultimo_relatorio_ano: number;
  processo_ultimo_relatorio: string;
  paginas_ultimo_relatorio: number;
  achados_destaque: string[];
}

export interface EvolucaoDefensoria {
  ano: number;
  comarcas_atendidas: number;
  percentual: number;
  fonte: string;
}

export interface ComarcaDesassistida {
  comarca: string;
  populacao: number;
  regiao: string;
  polo_proximo: string;
}

export interface CatalogoInspecoesDefensoria {
  gerado_em: string;
  fonte_inspecoes: string;
  fonte_defensoria: string;
  totais: {
    total_relatorios_cnj: number;
    orgaos_correcionados: number;
    anos_cobertura_inicio: number;
    anos_cobertura_fim: number;
    total_comarcas_mg: number;
    comarcas_com_defensoria_mg: number;
    deficit_comarcas_mg_percentual: number;
    achados_substantivos_tjmg_2026: number;
  };
  orgaos_inspecionados: OrgaoInspecionado[];
  defensoria_mg_comarcas: {
    total_comarcas: number;
    atendidas_presencialmente: number;
    nao_atendidas: number;
    atendidas_parcialmente: number;
    evolucao_historica: EvolucaoDefensoria[];
    comarcas_desassistidas_destaque: ComarcaDesassistida[];
  };
}

let cacheCatalogo: CatalogoInspecoesDefensoria | null = null;

function resolverCaminhoJson(): string {
  const caminhos = [
    path.resolve(process.cwd(), "data", "cnj-inspecoes-defensoria.json"),
    path.resolve(process.cwd(), "apps", "web", "data", "cnj-inspecoes-defensoria.json"),
    path.resolve(__dirname, "..", "..", "data", "cnj-inspecoes-defensoria.json"),
  ];

  for (const c of caminhos) {
    if (fs.existsSync(c)) return c;
  }
  return caminhos[0];
}

export function carregarInspecoesDefensoria(): CatalogoInspecoesDefensoria {
  if (cacheCatalogo) return cacheCatalogo;

  const jsonPath = resolverCaminhoJson();
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Arquivo cnj-inspecoes-defensoria.json não encontrado em: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  cacheCatalogo = JSON.parse(raw) as CatalogoInspecoesDefensoria;
  return cacheCatalogo;
}

export function listarOrgaosInspecionados(): OrgaoInspecionado[] {
  return carregarInspecoesDefensoria().orgaos_inspecionados;
}

export function obterEstatisticasJudiciario() {
  return carregarInspecoesDefensoria().totais;
}

export function obterDadosDefensoriaMG() {
  return carregarInspecoesDefensoria().defensoria_mg_comarcas;
}

export function obterOrgaoPorSigla(sigla: string): OrgaoInspecionado | undefined {
  const orgaos = listarOrgaosInspecionados();
  return orgaos.find((o) => o.orgao.toLowerCase() === sigla.toLowerCase());
}
