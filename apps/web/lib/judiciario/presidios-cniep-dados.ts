/**
 * SERVER-ONLY: os estabelecimentos penais de MG (CNIEP), lidos de
 * `etl/betim/dados/presidios-cniep-bundle.json` via `carregarJsonEtl`.
 * Saíram do `presidios-cniep.ts` em 2026-08-25 pelo teto de 3 MiB gzip do
 * Worker Free (erro 10027). O cliente busca o mesmo dado como asset em
 * `public/data/estabelecimentos-mg.json` (hook em `TabelaPresidios.tsx`).
 */
import { carregarJsonEtl } from "@/lib/server-only/json-etl";
import type { EstabelecimentoPenal } from "./presidios-cniep";

let cache: EstabelecimentoPenal[] | null = null;

export function lerEstabelecimentosMg(): EstabelecimentoPenal[] {
  if (!cache) {
    const bruto = carregarJsonEtl<{ ESTABELECIMENTOS_MG: EstabelecimentoPenal[] }>(
      "presidios-cniep-bundle.json"
    );
    cache = bruto.ESTABELECIMENTOS_MG;
  }
  return cache;
}
