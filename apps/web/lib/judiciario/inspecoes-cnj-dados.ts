/**
 * SERVER-ONLY: os cinco acervos grandes das inspeções do CNJ/TJMG, lidos de
 * `etl/betim/dados/inspecoes-cnj-bundle.json` via `carregarJsonEtl`. Saíram
 * do `inspecoes-cnj.ts` em 2026-08-25 pelo teto de 3 MiB gzip do Worker
 * Free (erro 10027) — ver nota naquele módulo.
 */
import { carregarJsonEtl } from "@/lib/server-only/json-etl";
import type {
  OrgaoInspecionado,
  PendenciaInspecao,
  RelatorioTjmg,
} from "./inspecoes-cnj";

interface BundleInspecoesCnj {
  ORGAOS_INSPECIONADOS: OrgaoInspecionado[];
  RELATORIOS_TJMG: RelatorioTjmg[];
  PENDENCIAS_TJMG: PendenciaInspecao[];
  COBRANCAS_POR_INSPECAO: { ano: number; cobrancas: number }[];
}

let cache: BundleInspecoesCnj | null = null;

function bundle(): BundleInspecoesCnj {
  if (!cache) cache = carregarJsonEtl<BundleInspecoesCnj>("inspecoes-cnj-bundle.json");
  return cache;
}

export const ORGAOS_INSPECIONADOS = bundle().ORGAOS_INSPECIONADOS;
export const RELATORIOS_TJMG = bundle().RELATORIOS_TJMG;
export const PENDENCIAS_TJMG = bundle().PENDENCIAS_TJMG;
export const COBRANCAS_POR_INSPECAO = bundle().COBRANCAS_POR_INSPECAO;
