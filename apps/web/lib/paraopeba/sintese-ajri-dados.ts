/**
 * SERVER-ONLY: a síntese da auditoria AJRI, lida de
 * `etl/betim/dados/sintese-ajri-bundle.json` via `carregarJsonEtl`.
 * Saíram do `sintese-ajri.ts` em 2026-08-25 pelo teto de 3 MiB gzip do
 * Worker Free (erro 10027) — ver nota naquele módulo.
 */
import { carregarJsonEtl } from "@/lib/server-only/json-etl";
import type { EixoDaSintese, GraficoDaSintese, LinhaDePrazoAjri } from "./sintese-ajri";

interface SinteseAjriObjeto {
  executivo: string;
  eixos: EixoDaSintese[];
  prazos: LinhaDePrazoAjri[];
  graficosGerais: GraficoDaSintese[];
  transversais: { titulo: string; texto: string }[];
  fragilidades: { titulo: string; texto: string }[];
}

let cache: SinteseAjriObjeto | null = null;

export function lerSinteseAjri(): SinteseAjriObjeto {
  if (!cache) {
    const bruto = carregarJsonEtl<{ SINTESE_AJRI: SinteseAjriObjeto }>(
      "sintese-ajri-bundle.json"
    );
    cache = bruto.SINTESE_AJRI;
  }
  return cache;
}
