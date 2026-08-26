/**
 * SERVER-ONLY: as comarcas da Defensoria Pública de MG, lidas de
 * `etl/betim/dados/defensoria-mg-bundle.json` via `carregarJsonEtl`.
 * Saíram do `defensoria-mg.ts` em 2026-08-25 pelo teto de 3 MiB gzip do
 * Worker Free (erro 10027). O cliente busca o mesmo dado como asset em
 * `public/data/comarcas-mg.json` (hook em TabelaComarcas.tsx).
 */
import { carregarJsonEtl } from "@/lib/server-only/json-etl";
import type { ComarcaDefensoria } from "./defensoria-mg";

let cache: ComarcaDefensoria[] | null = null;

export function lerComarcasMg(): ComarcaDefensoria[] {
  if (!cache) {
    const bruto = carregarJsonEtl<{ COMARCAS_MG: ComarcaDefensoria[] }>(
      "defensoria-mg-bundle.json"
    );
    cache = bruto.COMARCAS_MG;
  }
  return cache;
}
