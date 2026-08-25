/**
 * SERVER-ONLY: dado bruto da execução do Acordo (FGV), lido de
 * `etl/betim/dados/execucao-fgv-bundle.json` via `carregarJsonEtl`.
 * Saíram do `execucao-fgv.ts` em 2026-08-25 pelo teto de 3 MiB gzip do
 * Worker Free (erro 10027) — ver nota naquele módulo.
 */
import { carregarJsonEtl } from "@/lib/server-only/json-etl";
import type {
  MunicipioExecucaoFgv,
  ProjetoEspecialFgv,
  ProjetoExecucaoFgv,
  StatusProjetoFgv,
} from "./execucao-fgv";

interface BundleExecucaoFgv {
  MUNICIPIOS_EXECUCAO_FGV: MunicipioExecucaoFgv[];
  PROJETOS_EXECUCAO_FGV: ProjetoExecucaoFgv[];
  PROJETOS_ESPECIAIS_FGV: ProjetoEspecialFgv[];
  STATUS_PROJETOS_FGV: StatusProjetoFgv[];
}

let cache: BundleExecucaoFgv | null = null;

function bundle(): BundleExecucaoFgv {
  if (!cache) cache = carregarJsonEtl<BundleExecucaoFgv>("execucao-fgv-bundle.json");
  return cache;
}

export const MUNICIPIOS_EXECUCAO_FGV = bundle().MUNICIPIOS_EXECUCAO_FGV;
export const PROJETOS_EXECUCAO_FGV = bundle().PROJETOS_EXECUCAO_FGV;
export const PROJETOS_ESPECIAIS_FGV = bundle().PROJETOS_ESPECIAIS_FGV;
export const STATUS_PROJETOS_FGV = bundle().STATUS_PROJETOS_FGV;
