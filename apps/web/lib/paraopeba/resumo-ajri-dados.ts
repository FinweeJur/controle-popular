/**
 * SERVER-ONLY: os 337 resumos da auditoria AJRI, lidos de
 * `public/data/resumo-ajri.json` (asset estático — o mesmo arquivo que o
 * cliente busca via `fetch`). Separação do `resumo-ajri.ts` pelo mesmo
 * motivo do teto de 3 MiB gzip do Worker (ver nota naquele módulo).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import type { ResumoAjri } from "./resumo-ajri";

let cache: Record<string, ResumoAjri> | null = null;

export function lerResumosAjri(): Record<string, ResumoAjri> {
  if (cache) return cache;
  const caminho = path.resolve(process.cwd(), "public", "data", "resumo-ajri.json");
  try {
    cache = JSON.parse(readFileSync(caminho, "utf-8")) as Record<string, ResumoAjri>;
  } catch (erro) {
    const causa = erro instanceof Error ? erro.message : String(erro);
    throw new Error(
      `resumo-ajri-dados: não consegui ler ${caminho} — rode o build a partir de apps/web ou regenere com scripts/dumpar-resumo-ajri.mts (${causa})`
    );
  }
  return cache;
}
