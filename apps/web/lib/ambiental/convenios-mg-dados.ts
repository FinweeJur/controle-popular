/**
 * SERVER-ONLY: os 870 convênios ambientais de MG, lidos de
 * `public/data/convenios-ambientais-mg.json` — o mesmo asset que o cliente
 * busca via `fetch` em `FiltroConvenios.tsx`. Separação motivada pelo teto
 * de 3 MiB gzip do Worker Free (ver nota em `convenios-mg.ts`).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import type { ConvenioAmbientalMg } from "./convenios-mg";

let cache: ConvenioAmbientalMg[] | null = null;

export function lerConveniosAmbientaisMg(): ConvenioAmbientalMg[] {
  if (cache) return cache;
  const caminho = path.resolve(process.cwd(), "public", "data", "convenios-ambientais-mg.json");
  try {
    cache = JSON.parse(readFileSync(caminho, "utf-8")) as ConvenioAmbientalMg[];
  } catch (erro) {
    const causa = erro instanceof Error ? erro.message : String(erro);
    throw new Error(
      `convenios-mg-dados: não consegui ler ${caminho} — rode o build a partir de apps/web ou regenere com scripts/dumpar-convenios.mts (${causa})`
    );
  }
  return cache;
}
