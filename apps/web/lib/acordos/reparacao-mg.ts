/**
 * lib/acordos/reparacao-mg.ts
 *
 * Módulo de consulta e consolidação dos Acordos de Reparação Socioambiental
 * em Minas Gerais:
 * - Acordo Judicial de Reparação de Brumadinho (Vale S.A. - R$ 37,68 bi / TJMG)
 * - Acordo de Repactuação da Bacia do Rio Doce (Samarco / Vale / BHP - R$ 132 bi / TRF-6)
 */

import * as fs from "node:fs";
import * as path from "node:path";

export interface AnexoAcordo {
  anexo: string;
  titulo: string;
  valor_original: number;
  finalidade: string;
}

export interface AcordoDetalhado {
  id: string;
  nome: string;
  data_homologacao: string;
  tribunal: string;
  compromissarios: string[];
  orgaos_publicos: string[];
  auditora_independente: string;
  valor_total_nominal: number;
  valor_atualizado_ipca: number;
  anexos: AnexoAcordo[];
}

export interface MunicipioReparacao {
  id_municipio: string;
  nome: string;
  acordo: string;
  bacia: string;
  valor_destinado_nominal: number;
  valor_destinado_atualizado: number;
  empenhos_autorizados: number;
  projetos_em_execucao: number;
  situacao_predominante: string;
  tags?: string[];
  micro_resumo?: string;
}

export interface CatalogoAcordosReparacao {
  gerado_em: string;
  fonte: string;
  totais_consolidados: {
    total_acordos_reparacao_reais: number;
    acordo_brumadinho_vale_reais: number;
    acordo_rio_doce_samarco_vale_bhp_reais: number;
    municipios_beneficiados_mg: number;
    projetos_mapeados: number;
  };
  acordos: AcordoDetalhado[];
  municipios_destaque_reparacao: MunicipioReparacao[];
}

let cacheAcordos: CatalogoAcordosReparacao | null = null;

function resolverCaminhoJson(): string {
  const caminhos = [
    path.resolve(process.cwd(), "data", "acordos-reparacao-mg.json"),
    path.resolve(process.cwd(), "apps", "web", "data", "acordos-reparacao-mg.json"),
    path.resolve(__dirname, "..", "..", "data", "acordos-reparacao-mg.json"),
  ];

  for (const c of caminhos) {
    if (fs.existsSync(c)) return c;
  }
  return caminhos[0];
}

export function carregarAcordosReparacao(): CatalogoAcordosReparacao {
  if (cacheAcordos) return cacheAcordos;

  const jsonPath = resolverCaminhoJson();
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Arquivo acordos-reparacao-mg.json não encontrado em: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  cacheAcordos = JSON.parse(raw) as CatalogoAcordosReparacao;
  return cacheAcordos;
}

export function listarAcordos(): AcordoDetalhado[] {
  return carregarAcordosReparacao().acordos;
}

export function listarMunicipiosAcordos(): MunicipioReparacao[] {
  return carregarAcordosReparacao().municipios_destaque_reparacao;
}

export function obterEstatisticasAcordos() {
  return carregarAcordosReparacao().totais_consolidados;
}

export function obterReparacaoPorIbge(idMunicipio: string): MunicipioReparacao | undefined {
  const itens = listarMunicipiosAcordos();
  const idNorm = idMunicipio.slice(0, 6);
  return itens.find(
    (m) => m.id_municipio === idMunicipio || m.id_municipio.startsWith(idNorm)
  );
}
