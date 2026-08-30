/**
 * SERVER-ONLY: agregados nacionais do SIRENEJud (CNJ) para a frente
 * Judiciário, lidos de `etl/betim/dados/sirenejud-brasil.json`.
 *
 * Mesma fonte e regime do recorte de MG (`lib/ambiental/sirenejud-dados.ts`):
 * arquivo em massa do CNJ, agregado de contagens, nomes de partes descartados
 * na coleta. Aqui o corte é Brasil por UF e tribunal — complemento do
 * `/judiciario/numeros` (Justiça em Números), que nasce da mesma base-mãe
 * (DataJud) mas em agregado anual por tribunal.
 */
import { carregarJsonEtl } from "@/lib/server-only/json-etl";

export interface UfSirenejud {
  uf: string;
  total: number;
  pendentes: number;
  baixados: number;
}

export interface TribunalSirenejud {
  tribunal: string;
  total: number;
  ufs: string[];
  pendentes: number;
}

export interface SirenejudBrasil {
  fonte: string;
  url_fonte: string;
  arquivo_origem: string;
  arquivo_modificado_em: string;
  gerado_em: string;
  cobertura: string;
  ressalvas: string[];
  total_processos_br: number;
  anos_anomalos: number;
  serie_anual_br: Record<string, number>;
  por_uf: UfSirenejud[];
  por_tribunal: TribunalSirenejud[];
  top_classes_br: [string, number][];
  top_assuntos_br: [string, number][];
}

let cache: SirenejudBrasil | null | undefined;

export function carregarSirenejudBrasil(): SirenejudBrasil | null {
  if (cache !== undefined) return cache;
  try {
    cache = carregarJsonEtl<SirenejudBrasil>("sirenejud-brasil.json");
  } catch {
    cache = null;
  }
  return cache;
}
