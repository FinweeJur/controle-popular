/**
 * SERVER-ONLY: dado do programa de compensação ambiental (TAC projetos),
 * lido de `etl/betim/dados/tac-projetos-bundle.json` via `carregarJsonEtl`.
 * Saíram dos módulos inline em 2026-08-25 pelo teto de 3 MiB gzip do Worker
 * Free (erro 10027). O cliente busca o mesmo conteúdo como asset em
 * `public/data/tac-projetos.json` (hook em PainelTac.tsx).
 */
import { carregarJsonEtl } from "@/lib/server-only/json-etl";
import type { ContratoTacAmbiental, LinhaTacAmbiental } from "./tac-projetos";
import type { AcordoTacContrato, AnoAcordo, StatusPorOrgao } from "./tac-agregados";

interface BundleTacProjetos {
  TAC_PROJETOS: LinhaTacAmbiental[];
  TAC_POR_ANO: { ano: number; previsto: number; executado: number }[];
  TAC_POR_MINERADORA: { mineradora: string; previsto: number; executado: number }[];
  TAC_POR_STATUS: { status: string; projetos: number }[];
  TAC_POR_PROJETO: ContratoTacAmbiental[];
  COBERTURA_TAC_PROJETOS: Record<string, unknown>;
  TAC_ACORDOS_PROJETOS: AcordoTacContrato[];
  TAC_STATUS_POR_ORGAO: StatusPorOrgao[];
  TAC_ANO_ACORDOS: AnoAcordo[];
  COBERTURA_TAC_ACORDOS: Record<string, unknown>;
}

const cache = new Map<string, unknown>();

function bloco<T>(chave: string): T {
  if (!cache.has(chave)) {
    const bruto = carregarJsonEtl<Record<string, T>>("tac-projetos-bundle.json");
    cache.set(chave, bruto[chave]);
  }
  return cache.get(chave) as T;
}

export const TAC_PROJETOS = bloco<LinhaTacAmbiental[]>("TAC_PROJETOS");
export const TAC_POR_ANO = bloco<{ ano: number; previsto: number; executado: number }[]>("TAC_POR_ANO");
export const TAC_POR_MINERADORA = bloco<{ mineradora: string; previsto: number; executado: number }[]>(
  "TAC_POR_MINERADORA"
);
export const TAC_POR_STATUS = bloco<{ status: string; projetos: number }[]>("TAC_POR_STATUS");
export const TAC_POR_PROJETO = bloco<ContratoTacAmbiental[]>("TAC_POR_PROJETO");
export const TAC_ACORDOS_PROJETOS = bloco<AcordoTacContrato[]>("TAC_ACORDOS_PROJETOS");
export const TAC_STATUS_POR_ORGAO = bloco<StatusPorOrgao[]>("TAC_STATUS_POR_ORGAO");
export const TAC_ANO_ACORDOS = bloco<AnoAcordo[]>("TAC_ANO_ACORDOS");
/* Coberturas são objetos literais grandes com campos variados — tipar aqui
 * exigiria replicar as interfaces do gerador; hoje os consumidores usam
 * campos pontuais. Pragmatismo: `any` com dívida registrada. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const COBERTURA_TAC_PROJETOS = bloco<any>("COBERTURA_TAC_PROJETOS");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const COBERTURA_TAC_ACORDOS = bloco<any>("COBERTURA_TAC_ACORDOS");
